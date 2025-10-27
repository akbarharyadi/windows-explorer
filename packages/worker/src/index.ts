/**
 * Worker Service - Background job processor for the Window Explorer application
 *
 * This service handles asynchronous tasks such as:
 * - Processing folder and file events (creation, updates, deletion)
 * - Managing cache invalidation and warming
 * - Updating search indexes
 * - Maintaining data consistency across the system
 *
 * The worker consumes messages from RabbitMQ queues and processes them to keep
 * the cache, search indexes, and other systems in sync with the main application.
 *
 * @module WorkerService
 */

import rabbitmq from './infrastructure/queue/rabbitmq'
import redis from './infrastructure/cache/redis'
import prisma from './infrastructure/database/prisma'
import { FolderConsumer } from './consumers/FolderConsumer'
import { FileConsumer } from './consumers/FileConsumer'
import { CacheConsumer } from './consumers/CacheConsumer'
import { SearchConsumer } from './consumers/SearchConsumer'
import { WorkerConfig } from './config'

/**
 * Worker Service class that manages all background job processing
 *
 * This service coordinates multiple consumers that listen to different
 * RabbitMQ queues and process events accordingly.
 */
export class WorkerService {
  private folderConsumer: FolderConsumer
  private fileConsumer: FileConsumer
  private cacheConsumer: CacheConsumer
  private searchConsumer: SearchConsumer
  private isShuttingDown = false

  /**
   * Creates a new instance of the WorkerService
   * Initializes all consumers for processing different types of messages
   */
  constructor() {
    this.folderConsumer = new FolderConsumer()
    this.fileConsumer = new FileConsumer()
    this.cacheConsumer = new CacheConsumer()
    this.searchConsumer = new SearchConsumer()
  }

  /**
   * Starts the worker service and all its consumers
   *
   * This method connects to all required services (RabbitMQ, Redis, Database)
   * and starts consuming messages from the queues.
   *
   * @returns Promise that resolves when all consumers are started
   * @throws Error if any service fails to connect or start
   */
  async start(): Promise<void> {
    console.log('🚀 Starting window-explorer Worker Service...')
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`⚙️ Concurrency: ${WorkerConfig.RABBITMQ.PREFETCH_COUNT}`)

    try {
      // Connect to RabbitMQ
      await rabbitmq.connect()

      // Start all consumers
      await Promise.all([
        this.folderConsumer.start(),
        this.fileConsumer.start(),
        this.cacheConsumer.start(),
        this.searchConsumer.start(),
      ])

      console.log('✅ Worker Service started successfully')
      console.log('👂 Listening for messages...')
    } catch (error) {
      console.error('❌ Failed to start Worker Service:', error)
      process.exit(1)
    }
  }

  /**
   * Shuts down the worker service gracefully
   *
   * This method stops all consumers and closes connections to external services
   * to ensure clean shutdown without losing messages or corrupting data.
   *
   * @returns Promise that resolves when all services are shut down
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return

    this.isShuttingDown = true
    console.log('\n🛑 Shutting down Worker Service...')

    const shutdownTimeout = setTimeout(() => {
      console.error('❌ Shutdown timeout exceeded, forcing exit')
      process.exit(1)
    }, WorkerConfig.GRACEFUL_SHUTDOWN_TIMEOUT)

    try {
      // Close RabbitMQ connection (stops consuming new messages)
      await rabbitmq.close()

      // Close Redis connection
      await redis.quit()

      // Close database connection
      await prisma.$disconnect()

      clearTimeout(shutdownTimeout)
      console.log('✅ Worker Service shut down gracefully')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }
}

// Create and start worker service
const worker = new WorkerService()

// Start the worker
worker.start().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received')
  worker.shutdown()
})

process.on('SIGINT', () => {
  console.log('SIGINT received')
  worker.shutdown()
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  worker.shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  worker.shutdown()
})
