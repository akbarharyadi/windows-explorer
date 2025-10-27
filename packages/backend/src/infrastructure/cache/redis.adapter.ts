import type { Redis } from 'ioredis'
import type { CachePort } from '../../application/ports/cache.port'

/**
 * Redis adapter implementing CachePort interface
 * Part of Infrastructure layer - adapts Redis to our domain interface
 */
export class RedisCacheAdapter implements CachePort {
  constructor(private readonly client: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      return value ? (JSON.parse(value) as T) : null
    } catch (error) {
      console.error(`Failed to get cache key "${key}":`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (error) {
      console.error(`Failed to set cache key "${key}":`, error)
      throw error
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`Failed to delete cache key "${key}":`, error)
      throw error
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return

    try {
      await this.client.del(...keys)
    } catch (error) {
      console.error(`Failed to delete cache keys:`, error)
      throw error
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } catch (error) {
      console.error(`Failed to clear cache pattern "${pattern}":`, error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Failed to check existence of cache key "${key}":`, error)
      return false
    }
  }
}
