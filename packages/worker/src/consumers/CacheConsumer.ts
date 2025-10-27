/**
 * Cache Consumer - Processes cache management events from RabbitMQ
 *
 * This consumer handles messages related to cache operations like invalidation
 * and warming, ensuring the cache stays consistent with the underlying data.
 *
 * @module CacheConsumer
 */

import rabbitmq from '../infrastructure/queue/rabbitmq'
import redis from '../infrastructure/cache/redis'
import { CacheWarmer } from '../processors/CacheWarmer'
import { Queues } from '@window-explorer/shared'
import { CacheInvalidatePayload, CacheWarmPayload, WorkerMessage } from '../types'

/**
 * Consumer class that handles cache management events
 *
 * This class listens to the cache queue and processes events related to
 * cache invalidation and warming operations.
 */
export class CacheConsumer {
  private cacheWarmer: CacheWarmer

  /**
   * Creates a new instance of CacheConsumer
   * Initializes dependencies for processing cache events
   */
  constructor() {
    this.cacheWarmer = new CacheWarmer()
  }

  /**
   * Starts the cache consumer to listen for messages
   *
   * This method connects to the RabbitMQ cache queue and processes incoming messages
   * related to cache management operations.
   *
   * @returns Promise that resolves when the consumer is started
   * @throws Error if connection to RabbitMQ fails
   */
  async start(): Promise<void> {
    console.log('👂 Starting Cache Consumer...')

    await rabbitmq.consume(Queues.CACHE.name, async (message: WorkerMessage) => {
      const { type, payload } = message

      switch (type) {
        case 'cache.invalidate':
          await this.handleCacheInvalidation(payload as CacheInvalidatePayload)
          break

        case 'cache.warm':
          await this.handleCacheWarming(payload as CacheWarmPayload)
          break

        default:
          console.warn(`⚠️ Unknown cache event type: ${type}`)
      }
    })

    console.log('✅ Cache Consumer started')
  }

  /**
   * Handles cache invalidation events
   *
   * This method removes specific cache entries either by key or by pattern
   * to ensure the cache doesn't serve stale data.
   *
   * @param payload The cache invalidation request data
   * @returns Promise that resolves when invalidation is complete
   */
  private async handleCacheInvalidation(payload: CacheInvalidatePayload): Promise<void> {
    console.log(`🗑️ Invalidating cache: ${payload.key}`)

    if (payload.pattern) {
      // Delete keys matching pattern to remove multiple related entries
      const keys = await redis.keys(payload.pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`✅ Invalidated ${keys.length} cache keys`)
      }
    } else {
      // Delete single key to remove specific cache entry
      if (payload.key) {
        await redis.del(payload.key)
        console.log(`✅ Cache key invalidated: ${payload.key}`)
      }
    }
  }

  /**
   * Handles cache warming events
   *
   * This method pre-populates cache entries to improve performance by
   * pre-loading frequently accessed data.
   *
   * @param payload The cache warming request data
   * @returns Promise that resolves when warming is complete
   */
  private async handleCacheWarming(payload: CacheWarmPayload): Promise<void> {
    console.log(`🔥 Warming cache: ${payload.type}`)

    switch (payload.type) {
      case 'folder.children':
        // Warm up folder children cache with recent data
        if (payload.folderId) {
          await this.cacheWarmer.warmFolderChildren(payload.folderId)
        }
        break

      case 'popular.folders':
        // Warm up popular folders cache to improve access times
        await this.cacheWarmer.warmPopularFolders()
        break

      default:
        console.warn(`⚠️ Unknown cache warming type: ${payload.type}`)
    }

    console.log(`✅ Cache warming complete`)
  }
}
