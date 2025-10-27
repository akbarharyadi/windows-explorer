/**
 * Search Indexer - Manages search index operations for folders and files
 *
 * This processor handles adding, updating, and removing entries from the
 * search index to ensure search functionality stays current with the database.
 *
 * @module SearchIndexer
 */

import redis from '../infrastructure/cache/redis'
import prisma from '../infrastructure/database/prisma'
import { WorkerConfig } from '../config'
import { SearchIndexFolderPayload, SearchIndexFilePayload } from '../types'

/**
 * Processor class that handles search indexing operations
 *
 * This class manages the search index by adding, updating, and removing
 * entries for folders and files in the Redis-based search index.
 */
export class SearchIndexer {
  /**
   * Adds or updates a folder in the search index
   *
   * This method looks up the folder in the database and adds it to the
   * appropriate search index for quick lookups.
   *
   * @param payload The folder data to index
   * @returns Promise that resolves when indexing is complete
   * @throws Error if there's an issue with indexing
   */
  async indexFolder(payload: SearchIndexFolderPayload): Promise<void> {
    // Validate payload
    if (!payload || !payload.folderId) {
      console.error('❌ Invalid payload for folder indexing:', payload)
      return
    }

    console.log(`🔍 Indexing folder: ${payload.folderId}`)

    try {
      const folder = await prisma.folder.findUnique({
        where: { id: payload.folderId },
      })

      if (!folder) {
        console.error(`❌ Folder not found: ${payload.folderId}`)
        return
      }

      // Index folder name for search by creating a Redis set with the folder ID
      const searchKey = `search:folders:${folder.name.toLowerCase()}`
      await redis.sadd(searchKey, folder.id)
      await redis.expire(searchKey, WorkerConfig.CACHE_TTL.SEARCH_RESULTS)

      console.log(`✅ Folder indexed: ${folder.name}`)
    } catch (error) {
      console.error('❌ Error indexing folder:', error)
      throw error
    }
  }

  /**
   * Adds or updates a file in the search index
   *
   * This method looks up the file in the database and adds it to the
   * appropriate search index for quick lookups.
   *
   * @param payload The file data to index
   * @returns Promise that resolves when indexing is complete
   * @throws Error if there's an issue with indexing
   */
  async indexFile(payload: SearchIndexFilePayload): Promise<void> {
    // Validate payload
    if (!payload || !payload.fileId) {
      console.error('❌ Invalid payload for file indexing:', payload)
      return
    }

    console.log(`🔍 Indexing file: ${payload.fileId}`)

    try {
      const file = await prisma.file.findUnique({
        where: { id: payload.fileId },
      })

      if (!file) {
        console.error(`❌ File not found: ${payload.fileId}`)
        return
      }

      // Index file name for search by creating a Redis set with the file ID
      const searchKey = `search:files:${file.name.toLowerCase()}`
      await redis.sadd(searchKey, file.id)
      await redis.expire(searchKey, WorkerConfig.CACHE_TTL.SEARCH_RESULTS)

      console.log(`✅ File indexed: ${file.name}`)
    } catch (error) {
      console.error('❌ Error indexing file:', error)
      throw error
    }
  }

  /**
   * Removes an entry from the search index
   *
   * This method removes the specified folder or file from the search index.
   *
   * @param type The type of item to remove ('folder' or 'file')
   * @param id The ID of the item to remove
   * @param name The name of the item to remove (used to construct the search key)
   * @returns Promise that resolves when removal is complete
   */
  async removeFromIndex(type: 'folder' | 'file', id: string, name: string): Promise<void> {
    console.log(`🗑️ Removing from search index: ${type}:${id}`)

    try {
      // Remove the ID from the appropriate search index set
      const searchKey = `search:${type}s:${name.toLowerCase()}`
      await redis.srem(searchKey, id)

      console.log(`✅ Removed from index: ${name}`)
    } catch (error) {
      console.error('❌ Error removing from index:', error)
    }
  }
}
