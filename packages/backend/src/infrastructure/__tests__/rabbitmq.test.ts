import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { rabbitMQ, RABBITMQ_CONFIG } from '../messaging/rabbitmq'
import { RabbitMQEventPublisher } from '../messaging/rabbitmq.publisher'
import { setupInfrastructure, teardownInfrastructure } from './test-infrastructure'

describe('RabbitMQ Infrastructure', () => {
  beforeAll(async () => {
    await setupInfrastructure()
  })

  afterAll(async () => {
    await teardownInfrastructure()
  })

  beforeEach(async () => {
    // Purge all test queues before each test
    const channel = await rabbitMQ.getChannel()
    const queues = Object.values(RABBITMQ_CONFIG.QUEUES)

    for (const queue of queues) {
      try {
        await channel.purgeQueue(queue)
      } catch {
        // Queue might not exist yet, ignore
      }
    }
  })

  describe('RabbitMQ Connection', () => {
    it('should be connected', () => {
      expect(rabbitMQ.isConnected()).toBe(true)
    })

    it('should get channel', async () => {
      const channel = await rabbitMQ.getChannel()
      expect(channel).toBeDefined()
    })
  })

  describe('Exchanges and Queues', () => {
    it('should have all exchanges created', async () => {
      const channel = await rabbitMQ.getChannel()

      // Check exchanges exist (assertExchange with passive: true)
      await expect(channel.checkExchange(RABBITMQ_CONFIG.EXCHANGES.FOLDER)).resolves.toBeDefined()
      await expect(channel.checkExchange(RABBITMQ_CONFIG.EXCHANGES.FILE)).resolves.toBeDefined()
      await expect(channel.checkExchange(RABBITMQ_CONFIG.EXCHANGES.CACHE)).resolves.toBeDefined()
      await expect(channel.checkExchange(RABBITMQ_CONFIG.EXCHANGES.SEARCH)).resolves.toBeDefined()
    })

    it('should have all queues created', async () => {
      const channel = await rabbitMQ.getChannel()

      // Check queues exist
      const queues = Object.values(RABBITMQ_CONFIG.QUEUES)
      for (const queue of queues) {
        await expect(channel.checkQueue(queue)).resolves.toBeDefined()
      }
    })
  })

  describe('RabbitMQEventPublisher', () => {
    let publisher: RabbitMQEventPublisher

    beforeEach(() => {
      publisher = new RabbitMQEventPublisher()
    })

    describe('publish single event', () => {
      it('should publish folder.created event', async () => {
        const event = {
          type: 'folder.created',
          payload: {
            id: '123',
            name: 'Test Folder',
            parentId: 'root',
          },
          metadata: {
            userId: 'user123',
          },
        }

        await publisher.publish(event)

        // Verify message is in queue - folder.created messages go to FOLDER queue due to binding
        const channel = await rabbitMQ.getChannel()
        const message = await channel.get(RABBITMQ_CONFIG.QUEUES.FOLDER, {
          noAck: true,
        })

        expect(message).not.toBe(false)
        if (message) {
          const content = JSON.parse(message.content.toString())
          expect(content.type).toBe('folder.created')
          expect(content.payload).toEqual(event.payload)
          expect(content.metadata.userId).toBe('user123')
          expect(content.metadata.timestamp).toBeDefined()
          expect(content.metadata.publishedBy).toBeDefined()
        }
      })

      it('should publish file.created event', async () => {
        const event = {
          type: 'file.created',
          payload: {
            id: '456',
            name: 'test.txt',
            folderId: '123',
          },
        }

        await publisher.publish(event)

        const channel = await rabbitMQ.getChannel()
        const message = await channel.get(RABBITMQ_CONFIG.QUEUES.FILE, {
          noAck: true,
        })

        expect(message).not.toBe(false)
        if (message) {
          const content = JSON.parse(message.content.toString())
          expect(content.type).toBe('file.created')
          expect(content.payload).toEqual(event.payload)
        }
      })

      it('should publish cache.invalidate event', async () => {
        const event = {
          type: 'cache.invalidate',
          payload: {
            keys: ['folder:123', 'folder:123:children'],
          },
        }

        await publisher.publish(event)

        const channel = await rabbitMQ.getChannel()
        const message = await channel.get(RABBITMQ_CONFIG.QUEUES.CACHE, { noAck: true })

        expect(message).not.toBe(false)
        if (message) {
          const content = JSON.parse(message.content.toString())
          expect(content.type).toBe('cache.invalidate')
          expect(content.payload).toEqual(event.payload)
        }
      })

      it('should handle unknown event type with default routing', async () => {
        const event = {
          type: 'unknown.event',
          payload: {
            data: 'test',
          },
        }

        // Should not throw
        await expect(publisher.publish(event)).resolves.toBeUndefined()
      })
    })

    describe('publish batch events', () => {
      it('should publish multiple events in batch', async () => {
        const events = [
          {
            type: 'folder.created',
            payload: { id: '1', name: 'Folder 1' },
          },
          {
            type: 'folder.created',
            payload: { id: '2', name: 'Folder 2' },
          },
          {
            type: 'folder.created',
            payload: { id: '3', name: 'Folder 3' },
          },
        ]

        await publisher.publishBatch(events)

        // Verify all messages are in queue
        const channel = await rabbitMQ.getChannel()

        for (let i = 0; i < events.length; i++) {
          const message = await channel.get(RABBITMQ_CONFIG.QUEUES.FOLDER, { noAck: true })
          expect(message).not.toBe(false)
        }
      })

      it('should handle empty batch gracefully', async () => {
        await expect(publisher.publishBatch([])).resolves.toBeUndefined()
      })

      it('should publish mixed event types in batch', async () => {
        const events = [
          {
            type: 'folder.created',
            payload: { id: '1', name: 'Folder 1' },
          },
          {
            type: 'file.created',
            payload: { id: '2', name: 'file.txt' },
          },
          {
            type: 'cache.invalidate',
            payload: { keys: ['folder:1'] },
          },
        ]

        await publisher.publishBatch(events)

        // Verify messages are in correct queues
        const channel = await rabbitMQ.getChannel()

        const folderMessage = await channel.get(RABBITMQ_CONFIG.QUEUES.FOLDER, {
          noAck: true,
        })
        const fileMessage = await channel.get(RABBITMQ_CONFIG.QUEUES.FILE, { noAck: true })
        const cacheMessage = await channel.get(RABBITMQ_CONFIG.QUEUES.CACHE, {
          noAck: true,
        })

        expect(folderMessage).not.toBe(false)
        expect(fileMessage).not.toBe(false)
        expect(cacheMessage).not.toBe(false)
      })
    })
  })

  describe('Message retrieval', () => {
    let publisher: RabbitMQEventPublisher

    beforeEach(() => {
      publisher = new RabbitMQEventPublisher()
    })

    it('should retrieve message from folder.created queue', async () => {
      const event = {
        type: 'folder.created',
        payload: {
          id: '123',
          name: 'Test Folder',
        },
      }

      await publisher.publish(event)

      // Retrieve message - folder.created messages go to FOLDER queue
      const channel = await rabbitMQ.getChannel()
      const message = await channel.get(RABBITMQ_CONFIG.QUEUES.FOLDER, {
        noAck: true,
      })

      expect(message).not.toBe(false)
      if (message) {
        const content = JSON.parse(message.content.toString())
        expect(content.type).toBe('folder.created')
        expect(content.payload).toEqual(event.payload)
      }
    })

    it('should retrieve messages from different queues', async () => {
      const folderEvent = {
        type: 'folder.created',
        payload: { id: '1', name: 'Folder' },
      }
      const fileEvent = {
        type: 'file.created',
        payload: { id: '2', name: 'file.txt' },
      }

      await publisher.publish(folderEvent)
      await publisher.publish(fileEvent)

      const channel = await rabbitMQ.getChannel()

      const folderMessage = await channel.get(RABBITMQ_CONFIG.QUEUES.FOLDER, {
        noAck: true,
      })
      const fileMessage = await channel.get(RABBITMQ_CONFIG.QUEUES.FILE, {
        noAck: true,
      })

      expect(folderMessage).not.toBe(false)
      expect(fileMessage).not.toBe(false)

      if (folderMessage && fileMessage) {
        const folderContent = JSON.parse(folderMessage.content.toString())
        const fileContent = JSON.parse(fileMessage.content.toString())

        expect(folderContent.type).toBe('folder.created')
        expect(fileContent.type).toBe('file.created')
      }
    })
  })

  describe('Real-world event scenarios', () => {
    let publisher: RabbitMQEventPublisher

    beforeEach(() => {
      publisher = new RabbitMQEventPublisher()
    })

    it('should handle folder creation with cache invalidation', async () => {
      // Folder created
      await publisher.publish({
        type: 'folder.created',
        payload: {
          id: '123',
          name: 'New Folder',
          parentId: 'root',
        },
      })

      // Invalidate parent folder cache
      await publisher.publish({
        type: 'cache.invalidate',
        payload: {
          keys: ['folder:tree', 'folder:root:children'],
        },
      })

      // Small delay to ensure messages are routed
      await new Promise((resolve) => setTimeout(resolve, 50))

      const channel = await rabbitMQ.getChannel()

      const folderMsg = await channel.get(RABBITMQ_CONFIG.QUEUES.FOLDER, { noAck: true })
      const cacheMsg = await channel.get(RABBITMQ_CONFIG.QUEUES.CACHE, { noAck: true })

      expect(folderMsg).not.toBe(false)
      expect(cacheMsg).not.toBe(false)
    })
  })
})
