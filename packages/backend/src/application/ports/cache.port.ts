/**
 * Cache port (interface) for caching operations
 * Part of Application layer in Clean Architecture
 * Implementations (adapters) should be in Infrastructure layer
 */
export interface CachePort {
  /**
   * Get value from cache by key
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON serialized)
   * @param ttlSeconds Time to live in seconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>

  /**
   * Delete value from cache
   * @param key Cache key to delete
   */
  del(key: string): Promise<void>

  /**
   * Delete multiple keys from cache
   * @param keys Array of cache keys to delete
   */
  delMany(keys: string[]): Promise<void>

  /**
   * Clear all keys matching a pattern
   * @param pattern Pattern to match (e.g., 'folder:*')
   */
  clearPattern(pattern: string): Promise<void>

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  exists(key: string): Promise<boolean>
}
