import amqp from 'amqplib'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Exchanges, Queues, RoutingKeys } from '@window-explorer/shared'

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../../../../../.env') })

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'window-explorer'
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'window-explorer_password'
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost'
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672'
const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`

/**
 * RabbitMQ exchange and queue configuration
 */
export const RABBITMQ_CONFIG = {
  EXCHANGES: {
    FOLDER: Exchanges.FOLDER.name,
    FILE: Exchanges.FILE.name,
    CACHE: Exchanges.CACHE.name,
    SEARCH: Exchanges.SEARCH.name,
  },
  QUEUES: {
    FOLDER: Queues.FOLDER.name,
    FILE: Queues.FILE.name,
    CACHE: Queues.CACHE.name,
    SEARCH: Queues.SEARCH.name,
  },
  ROUTING_KEYS: {
    FOLDER_CREATED: RoutingKeys.FOLDER.CREATED,
    FOLDER_UPDATED: RoutingKeys.FOLDER.UPDATED,
    FOLDER_DELETED: RoutingKeys.FOLDER.DELETED,
    FILE_CREATED: RoutingKeys.FILE.CREATED,
    FILE_UPDATED: RoutingKeys.FILE.UPDATED,
    FILE_DELETED: RoutingKeys.FILE.DELETED,
    CACHE_INVALIDATE: RoutingKeys.CACHE.INVALIDATE,
    SEARCH_INDEX: RoutingKeys.SEARCH.INDEX_FOLDER,
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

    const { EXCHANGES, QUEUES } = RABBITMQ_CONFIG

    // Create exchanges
    await this.channel.assertExchange(EXCHANGES.FOLDER, Exchanges.FOLDER.type, {
      durable: Exchanges.FOLDER.options.durable,
    })
    await this.channel.assertExchange(EXCHANGES.FILE, Exchanges.FILE.type, {
      durable: Exchanges.FILE.options.durable,
    })
    await this.channel.assertExchange(EXCHANGES.CACHE, Exchanges.CACHE.type, {
      durable: Exchanges.CACHE.options.durable,
    })
    await this.channel.assertExchange(EXCHANGES.SEARCH, Exchanges.SEARCH.type, {
      durable: Exchanges.SEARCH.options.durable,
    })

    // Create queues
    await this.channel.assertQueue(QUEUES.FOLDER, {
      durable: Queues.FOLDER.options.durable,
    })
    await this.channel.assertQueue(QUEUES.FILE, {
      durable: Queues.FILE.options.durable,
    })
    await this.channel.assertQueue(QUEUES.CACHE, {
      durable: Queues.CACHE.options.durable,
    })
    await this.channel.assertQueue(QUEUES.SEARCH, {
      durable: Queues.SEARCH.options.durable,
    })

    // Bind queues to exchanges according to the shared configuration
    // Folder queue bindings
    for (const binding of Queues.FOLDER.bindings) {
      await this.channel.bindQueue(QUEUES.FOLDER, binding.exchange, binding.routingKey)
    }

    // File queue bindings
    for (const binding of Queues.FILE.bindings) {
      await this.channel.bindQueue(QUEUES.FILE, binding.exchange, binding.routingKey)
    }

    // Cache queue bindings
    for (const binding of Queues.CACHE.bindings) {
      await this.channel.bindQueue(QUEUES.CACHE, binding.exchange, binding.routingKey)
    }

    // Search queue bindings
    for (const binding of Queues.SEARCH.bindings) {
      await this.channel.bindQueue(QUEUES.SEARCH, binding.exchange, binding.routingKey)
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
