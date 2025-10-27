import type { IFolderRepository } from '../../domain/repositories/IFolderRepository'
import type { IFileRepository } from '../../domain/repositories/IFileRepository'
import type { FolderEntity, FolderWithChildren } from '../../domain/entities/Folder'
import type { CachePort } from '../ports/cache.port'
import type { EventPublisherPort } from '../ports/event-publisher.port'
import { ValidationError } from '../../domain/errors'
import { CacheConfig } from '../../infrastructure/cache/config'
import { EventStatusRepository } from '../../infrastructure/tracking/EventStatusRepository'
import { EventStatus } from '@window-explorer/shared'
import { v4 as uuidv4 } from 'uuid'

/**
 * Folder Service - Application layer business logic
 * Implements folder operations with caching and event publishing
 * Following Clean Architecture and SOLID principles
 */
export class FolderService {
  private eventStatusRepo: EventStatusRepository

  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository,
    private cache: CachePort,
    private eventPublisher: EventPublisherPort,
  ) {
    this.eventStatusRepo = new EventStatusRepository()
  }

  /**
   * Get all folders (flat list)
   * Results are not cached as this is rarely used directly
   */
  async getAllFolders(): Promise<FolderEntity[]> {
    return await this.folderRepository.findAll()
  }

  /**
   * Get folder tree structure with caching
   * Cache TTL: 5 minutes (CACHE_TTL_FOLDER_TREE)
   */
  async getFolderTree(): Promise<FolderWithChildren[]> {
    const cacheKey = CacheConfig.KEYS.FOLDER_TREE

    // Try to get from cache first
    const cached = await this.cache.get<FolderWithChildren[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Build tree from database
    const tree = await this.folderRepository.buildTree()

    // Store in cache
    await this.cache.set(cacheKey, tree, CacheConfig.TTL.FOLDER_TREE)

    return tree
  }

  /**
   * Get folder by ID with caching
   * Cache TTL: 3 minutes (CACHE_TTL_FOLDER_BY_ID)
   */
  async getFolderById(id: string): Promise<FolderEntity | null> {
    const cacheKey = CacheConfig.KEYS.FOLDER_BY_ID(id)

    // Try cache first
    const cached = await this.cache.get<FolderEntity>(cacheKey)
    if (cached) {
      return cached
    }

    // Get from database
    const folder = await this.folderRepository.findById(id)

    // Cache if found
    if (folder) {
      await this.cache.set(cacheKey, folder, CacheConfig.TTL.FOLDER_BY_ID)
    }

    return folder
  }

  /**
   * Get folder children (both subfolders and files) with caching
   * Cache TTL: 2 minutes (CACHE_TTL_FOLDER_CHILDREN)
   */
  async getFolderChildren(parentId: string) {
    // Validate parent exists
    const parent = await this.folderRepository.findById(parentId)
    if (!parent) {
      throw new ValidationError(`Folder with id ${parentId} not found`)
    }

    const childrenCacheKey = CacheConfig.KEYS.FOLDER_CHILDREN(parentId)
    const filesCacheKey = CacheConfig.KEYS.FILE_LIST(parentId)

    // Try to get from cache
    const cachedFolders = await this.cache.get(childrenCacheKey)
    const cachedFiles = await this.cache.get(filesCacheKey)

    if (cachedFolders && cachedFiles) {
      return { folders: cachedFolders, files: cachedFiles }
    }

    // Get from database
    const folders = await this.folderRepository.findChildren(parentId)
    const files = await this.fileRepository.findByFolderId(parentId)

    // Cache results
    await this.cache.set(childrenCacheKey, folders, CacheConfig.TTL.FOLDER_CHILDREN)
    await this.cache.set(filesCacheKey, files, CacheConfig.TTL.FILE_LIST)

    return { folders, files }
  }

  /**
   * Search folders by name with caching
   * Cache TTL: 1 minute (CACHE_TTL_SEARCH)
   */
  async searchFolders(query: string): Promise<FolderEntity[]> {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty')
    }

    const normalizedQuery = query.trim()
    const cacheKey = CacheConfig.KEYS.SEARCH_RESULTS(normalizedQuery)

    // Try cache first
    const cached = await this.cache.get<FolderEntity[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Search database
    const results = await this.folderRepository.search(normalizedQuery)

    // Cache results
    await this.cache.set(cacheKey, results, CacheConfig.TTL.SEARCH_RESULTS)

    return results
  }

  /**
   * Create a new folder
   * Invalidates relevant caches and publishes events
   * Returns folder with eventId for tracking async processing
   */
  async createFolder(data: {
    name: string
    parentId?: string | null
  }): Promise<{ folder: FolderEntity; eventId: string }> {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Folder name cannot be empty')
    }

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await this.folderRepository.findById(data.parentId)
      if (!parent) {
        throw new ValidationError(`Parent folder with id ${data.parentId} not found`)
      }
    }

    // Create folder
    const folder = await this.folderRepository.create({
      name: data.name.trim(),
      parentId: data.parentId ?? null,
    })

    // Generate unique event ID for tracking
    const eventId = uuidv4()

    // Track event status in database
    await this.eventStatusRepo.create({
      eventId,
      eventType: 'folder.created',
      status: EventStatus.PENDING,
      metadata: { folderId: folder.id },
    })

    // Invalidate relevant caches
    await this.invalidateFolderCaches(folder.id, folder.parentId)

    // Publish folder.created event with tracking ID
    await this.eventPublisher.publish({
      type: 'folder.created',
      payload: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
      },
      metadata: {
        eventId, // Include event ID for worker to track
        timestamp: new Date().toISOString(),
      },
    })

    // Return folder with event ID for frontend tracking
    return { folder, eventId }
  }

  /**
   * Update folder properties
   * Invalidates relevant caches and publishes events
   */
  async updateFolder(
    id: string,
    data: { name?: string; parentId?: string },
  ): Promise<FolderEntity> {
    // Validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Folder name cannot be empty')
    }

    // Prevent circular references
    if (data.parentId === id) {
      throw new ValidationError('A folder cannot be its own parent')
    }

    // Get old folder data for cache invalidation
    const oldFolder = await this.folderRepository.findById(id)
    if (!oldFolder) {
      throw new ValidationError(`Folder with id ${id} not found`)
    }

    // Update folder
    const folder = await this.folderRepository.update(id, {
      ...(data.name && { name: data.name.trim() }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    })

    // Invalidate caches (old and new parent)
    await this.invalidateFolderCaches(folder.id, folder.parentId)
    if (oldFolder.parentId !== folder.parentId && oldFolder.parentId) {
      await this.invalidateFolderCaches(id, oldFolder.parentId)
    }

    // Publish folder.updated event
    await this.eventPublisher.publish({
      type: 'folder.updated',
      payload: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        oldParentId: oldFolder.parentId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    return folder
  }

  /**
   * Delete folder
   * Invalidates relevant caches and publishes events
   */
  async deleteFolder(id: string): Promise<void> {
    // Get folder before deletion for cache invalidation
    const folder = await this.folderRepository.findById(id)
    if (!folder) {
      throw new ValidationError(`Folder with id ${id} not found`)
    }

    // Delete folder
    await this.folderRepository.delete(id)

    // Invalidate all related caches
    await this.invalidateFolderCaches(id, folder.parentId)

    // Publish folder.deleted event
    await this.eventPublisher.publish({
      type: 'folder.deleted',
      payload: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // Publish search.remove.folder event for removing from search index
    await this.eventPublisher.publish({
      type: 'search.remove.folder',
      payload: {
        id: folder.id,
      },
    })
  }

  /**
   * Invalidate all caches related to a folder
   * @private
   */
  private async invalidateFolderCaches(folderId: string, parentId: string | null): Promise<void> {
    const keysToInvalidate = [
      CacheConfig.KEYS.FOLDER_TREE,
      CacheConfig.KEYS.FOLDER_BY_ID(folderId),
      CacheConfig.KEYS.FOLDER_CHILDREN(folderId),
      CacheConfig.KEYS.FILE_LIST(folderId),
    ]

    // Also invalidate parent's children cache if parent exists
    if (parentId) {
      keysToInvalidate.push(CacheConfig.KEYS.FOLDER_CHILDREN(parentId))
      keysToInvalidate.push(CacheConfig.KEYS.FILE_LIST(parentId))
    }

    // Clear all search caches (they might contain this folder)
    await this.cache.clearPattern('search:*')

    // Delete specific keys
    await this.cache.delMany(keysToInvalidate)

    // Publish cache.invalidate event
    await this.eventPublisher.publish({
      type: 'cache.invalidate',
      payload: {
        keys: keysToInvalidate,
        pattern: 'search:*',
      },
      metadata: {
        reason: 'folder_change',
        folderId,
      },
    })
  }
}
