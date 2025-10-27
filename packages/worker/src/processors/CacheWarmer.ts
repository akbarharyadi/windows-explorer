/**
 * Cache Warmer - Pre-populates cache entries with frequently accessed data
 *
 * This processor pre-loads cache entries to improve performance by reducing
 * database queries for commonly accessed data.
 *
 * @module CacheWarmer
 */

import redis from '../infrastructure/cache/redis'
import prisma from '../infrastructure/database/prisma'
import { WorkerConfig } from '../config'

/**
 * Processor class that handles cache warming operations
 *
 * This class pre-populates cache entries with data that is frequently accessed,
 * reducing the need for database queries and improving response times.
 */
export class CacheWarmer {
  /**
   * Warms the folder children cache with data for a specific folder
   *
   * This method fetches the children folders and files for a given folder ID
   * and stores them in the cache for quick access.
   *
   * @param folderId The ID of the folder to warm cache for
   * @returns Promise that resolves when caching is complete
   */
  async warmFolderChildren(folderId: string): Promise<void> {
    console.log(`🔥 Warming folder children cache: ${folderId}`)

    try {
      // Fetch child folders for the specified parent folder
      const folders = await prisma.folder.findMany({
        where: { parentId: folderId },
        orderBy: { name: 'asc' },
      })

      // Fetch child files for the specified folder
      const files = await prisma.file.findMany({
        where: { folderId },
        orderBy: { name: 'asc' },
      })

      // Cache the combined result of folders and files
      const cacheKey = `folder:${folderId}:children`
      const data = { folders, files }

      await redis.set(cacheKey, JSON.stringify(data), 'EX', WorkerConfig.CACHE_TTL.FOLDER_CHILDREN)

      console.log(`✅ Folder children cached: ${folders.length} folders, ${files.length} files`)
    } catch (error) {
      console.error('❌ Error warming folder children cache:', error)
    }
  }

  /**
   * Warms the cache for popular folders (root level folders)
   *
   * This method identifies frequently accessed folders (root folders) and
   * warms their cache entries to improve overall performance.
   *
   * @returns Promise that resolves when caching is complete
   */
  async warmPopularFolders(): Promise<void> {
    console.log('🔥 Warming popular folders cache...')

    try {
      // Get root folders (most accessed) - folders without parents
      const rootFolders = await prisma.folder.findMany({
        where: { parentId: null },
      })

      // Warm the children cache for each root folder
      for (const folder of rootFolders) {
        await this.warmFolderChildren(folder.id)
      }

      console.log(`✅ Popular folders cache warmed (${rootFolders.length} folders)`)
    } catch (error) {
      console.error('❌ Error warming popular folders:', error)
    }
  }
}
