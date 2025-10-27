/**
 * Folder Processor - Processes folder-related operations for cache management
 *
 * This processor handles folder operations like creation, updates, and deletion
 * by managing the appropriate cache entries to ensure consistency across the system.
 *
 * @module FolderProcessor
 */

import redis from '../infrastructure/cache/redis'
import prisma from '../infrastructure/database/prisma'
import { WorkerConfig } from '../config'
import { FolderCreatedPayload, FolderUpdatedPayload, FolderDeletedPayload } from '../types'

/**
 * Processor class that handles folder-related cache operations
 *
 * This class manages cache invalidation and warming for folder operations,
 * ensuring that the folder tree and related caches stay consistent with
 * the database state.
 */
export class FolderProcessor {
  /**
   * Handles the event when a new folder is created
   *
   * This method invalidates relevant cache entries and warms the folder tree cache
   * to ensure the new folder appears in the cache.
   *
   * @param payload The folder data from the event
   * @returns Promise that resolves when processing is complete
   */
  async handleFolderCreated(payload: FolderCreatedPayload): Promise<void> {
    console.log(`🆕 Processing folder created: ${payload.folderId}`)

    // Invalidate folder tree cache to include the new folder
    await redis.del('folder:tree')

    // Invalidate parent's children cache if the new folder has a parent
    if (payload.parentId) {
      await redis.del(`folder:${payload.parentId}:children`)
    }

    // Warm up folder tree cache with the latest data
    await this.warmFolderTreeCache()

    console.log(`✅ Folder created processing complete`)
  }

  /**
   * Handles the event when a folder is updated
   *
   * This method invalidates relevant cache entries to ensure updated folder
   * information is served from the database.
   *
   * @param payload The updated folder data from the event
   * @returns Promise that resolves when processing is complete
   */
  async handleFolderUpdated(payload: FolderUpdatedPayload): Promise<void> {
    console.log(`📝 Processing folder updated: ${payload.folderId}`)

    // Invalidate folder tree cache to reflect the update
    await redis.del('folder:tree')

    // Invalidate specific folder cache
    await redis.del(`folder:${payload.folderId}`)

    // Invalidate parent's children cache in case folder moved or changed
    if (payload.parentId) {
      await redis.del(`folder:${payload.parentId}:children`)
    }

    console.log(`✅ Folder updated processing complete`)
  }

  /**
   * Handles the event when a folder is deleted
   *
   * This method invalidates relevant cache entries to remove the deleted folder
   * from all caches.
   *
   * @param payload The deleted folder data from the event
   * @returns Promise that resolves when processing is complete
   */
  async handleFolderDeleted(payload: FolderDeletedPayload): Promise<void> {
    console.log(`🗑️ Processing folder deleted: ${payload.folderId}`)

    // Invalidate folder tree cache to remove the deleted folder
    await redis.del('folder:tree')

    // Invalidate specific folder cache
    await redis.del(`folder:${payload.folderId}`)

    // Invalidate folder's children cache (children are now orphaned)
    await redis.del(`folder:${payload.folderId}:children`)

    // Invalidate parent's children cache if the folder had a parent
    if (payload.parentId) {
      await redis.del(`folder:${payload.parentId}:children`)
    }

    console.log(`✅ Folder deleted processing complete`)
  }

  /**
   * Warms the folder tree cache with the latest data from the database
   *
   * This method fetches the complete folder tree structure from the database
   * and stores it in Redis cache with appropriate TTL settings.
   *
   * @returns Promise that resolves when cache warming is complete
   */
  private async warmFolderTreeCache(): Promise<void> {
    try {
      console.log('🔥 Warming up folder tree cache...')

      // Fetch all folders from database, ordered by name
      const folders = await prisma.folder.findMany({
        orderBy: { name: 'asc' },
      })

      // Define type for the folder tree nodes
      type FolderNode = {
        id: string
        name: string
        parentId: string | null
        createdAt: Date
        updatedAt: Date
        children: FolderNode[]
        level: number
      }

      // Build tree structure based on parent-child relationships (same logic as in backend)
      const folderMap = new Map<string, FolderNode>()
      folders.forEach((folder) => {
        folderMap.set(folder.id, { ...folder, children: [], level: 0 })
      })

      const rootFolders: FolderNode[] = []

      folders.forEach((folder) => {
        const currentFolder = folderMap.get(folder.id)!
        currentFolder.children = [] // Ensure children is an array

        if (folder.parentId === null) {
          // This is a root folder
          rootFolders.push(currentFolder)
        } else {
          // This folder has a parent, add it to the parent's children
          const parent = folderMap.get(folder.parentId)
          if (parent) {
            currentFolder.level = parent.level + 1
            parent.children.push(currentFolder)
          }
        }
      })

      // Cache the complete tree structure with appropriate TTL
      await redis.set(
        'folder:tree',
        JSON.stringify(rootFolders),
        'EX',
        WorkerConfig.CACHE_TTL.FOLDER_TREE,
      )

      console.log(`✅ Folder tree cache warmed (${folders.length} folders)`)
    } catch (error) {
      console.error('❌ Error warming folder tree cache:', error)
    }
  }
}
