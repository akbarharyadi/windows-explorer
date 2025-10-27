import { redis } from '../cache/redis'
import { rabbitMQ } from '../messaging/rabbitmq'

/**
 * Test utilities for infrastructure layer
 * Provides setup/teardown helpers for tests
 */

/**
 * Wait for Redis to be ready
 */
export async function waitForRedis(maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await redis.ping()
      console.log('✅ Redis is ready for testing')
      return
    } catch {
      console.log(`⏳ Waiting for Redis... (attempt ${i + 1}/${maxAttempts})`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error('Redis is not available after maximum attempts')
}

/**
 * Wait for RabbitMQ to be ready
 */
export async function waitForRabbitMQ(maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await rabbitMQ.connect()
      if (rabbitMQ.isConnected()) {
        console.log('✅ RabbitMQ is ready for testing')
        return
      }
    } catch {
      console.log(`⏳ Waiting for RabbitMQ... (attempt ${i + 1}/${maxAttempts})`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error('RabbitMQ is not available after maximum attempts')
}

/**
 * Clean up Redis test data
 */
export async function cleanupRedis(): Promise<void> {
  try {
    // Delete all test keys (keys starting with 'test:')
    const keys = await redis.keys('test:*')
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🧹 Cleaned up ${keys.length} Redis test keys`)
    }
  } catch (error) {
    console.error('Failed to cleanup Redis test data:', error)
  }
}

/**
 * Clean up RabbitMQ test queues
 */
export async function cleanupRabbitMQ(): Promise<void> {
  try {
    const channel = await rabbitMQ.getChannel()

    // Purge actual queues (not routing keys!)
    const testQueues = ['folder.queue', 'file.queue', 'cache.queue', 'search.queue']

    for (const queue of testQueues) {
      try {
        await channel.purgeQueue(queue)
      } catch {
        // Queue might not exist, ignore error
      }
    }

    console.log('🧹 Cleaned up RabbitMQ test queues')
  } catch (error) {
    console.error('Failed to cleanup RabbitMQ test data:', error)
  }
}

/**
 * Setup infrastructure for tests
 */
export async function setupInfrastructure(): Promise<void> {
  console.log('🔧 Setting up test infrastructure...')
  await waitForRedis()
  await waitForRabbitMQ()
  await cleanupRedis()
  await cleanupRabbitMQ()
  console.log('✅ Test infrastructure ready')
}

/**
 * Teardown infrastructure after tests
 */
export async function teardownInfrastructure(): Promise<void> {
  console.log('🧹 Tearing down test infrastructure...')
  await cleanupRedis()
  await cleanupRabbitMQ()
  // Note: We don't close connections as they're singletons
  // and may be needed for subsequent test runs
  console.log('✅ Test infrastructure cleaned up')
}
