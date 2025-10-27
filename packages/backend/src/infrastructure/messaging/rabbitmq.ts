import amqp from 'amqplib'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../../../../../.env') })

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'

/**
 * RabbitMQ exchange and queue configuration
 */
export const RABBITMQ_CONFIG = {
  EXCHANGES: {
    FOLDER: 'folder.events',
    FILE: 'file.events',
    CACHE: 'cache.events',
    SEARCH: 'search.events',
  },
  QUEUES: {
    FOLDER_CREATED: 'folder.created',
    FOLDER_UPDATED: 'folder.updated',
    FOLDER_DELETED: 'folder.deleted',
    FILE_CREATED: 'file.created',
    FILE_UPDATED: 'file.updated',
    FILE_DELETED: 'file.deleted',
    CACHE_INVALIDATE: 'cache.invalidate',
    SEARCH_INDEX: 'search.index',
  },
  ROUTING_KEYS: {
    FOLDER_CREATED: 'folder.created',
    FOLDER_UPDATED: 'folder.updated',
    FOLDER_DELETED: 'folder.deleted',
    FILE_CREATED: 'file.created',
    FILE_UPDATED: 'file.updated',
    FILE_DELETED: 'file.deleted',
    CACHE_INVALIDATE: 'cache.invalidate',
    SEARCH_INDEX: 'search.index',
  },
}

/**
 * RabbitMQ connection manager singleton
 * Manages connection lifecycle, channel creation, and exchange/queue setup
 */
export class RabbitMQConnectionManager {
  private static instance: RabbitMQConnectionManager
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private isConnecting = false

  private constructor() {}

  static getInstance(): RabbitMQConnectionManager {
    if (!RabbitMQConnectionManager.instance) {
      RabbitMQConnectionManager.instance = new RabbitMQConnectionManager()
    }
    return RabbitMQConnectionManager.instance
  }

  /**
   * Connect to RabbitMQ and setup exchanges/queues
   */
  async connect(): Promise<void> {
    if (this.connection && this.channel) {
      console.log('🐰 RabbitMQ: Already connected')
      return
    }

    if (this.isConnecting) {
      console.log('🐰 RabbitMQ: Connection in progress...')
      // Wait for the connection to complete
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return
    }

    this.isConnecting = true

    try {
      console.log('🐰 RabbitMQ: Connecting...')
      this.connection = await amqp.connect(RABBITMQ_URL)

      // Handle connection events
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ Connection Error:', err.message)
      })

      this.connection.on('close', () => {
        console.log('🔌 RabbitMQ: Connection closed')
        this.connection = null
        this.channel = null
      })

      // Create channel
      this.channel = await this.connection.createChannel()
      console.log('✅ RabbitMQ: Channel created')

      // Setup exchanges and queues
      await this.setupExchangesAndQueues()

      console.log('✅ RabbitMQ: Ready')
    } catch (error) {
      console.error('❌ RabbitMQ Connection failed:', error)
      this.connection = null
      this.channel = null
      throw error
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Setup exchanges, queues, and bindings
   */
  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available')
    }

    const { EXCHANGES, QUEUES, ROUTING_KEYS } = RABBITMQ_CONFIG

    // Create topic exchanges
    await this.channel.assertExchange(EXCHANGES.FOLDER, 'topic', {
      durable: true,
    })
    await this.channel.assertExchange(EXCHANGES.FILE, 'topic', { durable: true })
    await this.channel.assertExchange(EXCHANGES.CACHE, 'topic', {
      durable: true,
    })
    await this.channel.assertExchange(EXCHANGES.SEARCH, 'topic', {
      durable: true,
    })

    // Create queues and bind to exchanges
    const queueBindings = [
      {
        queue: QUEUES.FOLDER_CREATED,
        exchange: EXCHANGES.FOLDER,
        routingKey: ROUTING_KEYS.FOLDER_CREATED,
      },
      {
        queue: QUEUES.FOLDER_UPDATED,
        exchange: EXCHANGES.FOLDER,
        routingKey: ROUTING_KEYS.FOLDER_UPDATED,
      },
      {
        queue: QUEUES.FOLDER_DELETED,
        exchange: EXCHANGES.FOLDER,
        routingKey: ROUTING_KEYS.FOLDER_DELETED,
      },
      {
        queue: QUEUES.FILE_CREATED,
        exchange: EXCHANGES.FILE,
        routingKey: ROUTING_KEYS.FILE_CREATED,
      },
      {
        queue: QUEUES.FILE_UPDATED,
        exchange: EXCHANGES.FILE,
        routingKey: ROUTING_KEYS.FILE_UPDATED,
      },
      {
        queue: QUEUES.FILE_DELETED,
        exchange: EXCHANGES.FILE,
        routingKey: ROUTING_KEYS.FILE_DELETED,
      },
      {
        queue: QUEUES.CACHE_INVALIDATE,
        exchange: EXCHANGES.CACHE,
        routingKey: ROUTING_KEYS.CACHE_INVALIDATE,
      },
      {
        queue: QUEUES.SEARCH_INDEX,
        exchange: EXCHANGES.SEARCH,
        routingKey: ROUTING_KEYS.SEARCH_INDEX,
      },
    ]

    for (const binding of queueBindings) {
      await this.channel.assertQueue(binding.queue, { durable: true })
      await this.channel.bindQueue(binding.queue, binding.exchange, binding.routingKey)
    }

    console.log('✅ RabbitMQ: Exchanges and queues setup complete')
  }

  /**
   * Get the current channel
   */
  async getChannel(): Promise<amqp.Channel> {
    if (!this.channel) {
      await this.connect()
    }

    if (!this.channel) {
      throw new Error('Failed to create RabbitMQ channel')
    }

    return this.channel
  }

  /**
   * Close connection gracefully
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close()
        this.channel = null
        console.log('✅ RabbitMQ: Channel closed')
      }

      if (this.connection) {
        await this.connection.close()
        this.connection = null
        console.log('✅ RabbitMQ: Connection closed')
      }
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error)
      throw error
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null
  }
}

// Export singleton instance
export const rabbitMQ = RabbitMQConnectionManager.getInstance()

// Test connection on startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  rabbitMQ.connect().catch((err) => {
    console.error('Failed to connect to RabbitMQ:', err)
  })
}

// Graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down RabbitMQ connection...')
  await rabbitMQ.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

export default rabbitMQ
