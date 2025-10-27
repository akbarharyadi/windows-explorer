import type { IFileRepository } from '../../domain/repositories/IFileRepository'
import type { IFolderRepository } from '../../domain/repositories/IFolderRepository'
import type { FileEntity } from '../../domain/entities/File'
import type { CachePort } from '../ports/cache.port'
import type { EventPublisherPort } from '../ports/event-publisher.port'
import { ValidationError } from '../../domain/errors'
import { CacheConfig } from '../../infrastructure/cache/config'
import { FileStorageService } from '../../infrastructure/storage/FileStorageService'

/**
 * File Service - Application layer business logic
 * Implements file operations with caching and event publishing
 * Following Clean Architecture and SOLID principles
 */
export class FileService {
  private storageService: FileStorageService

  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private cache: CachePort,
    private eventPublisher: EventPublisherPort,
    storageService?: FileStorageService,
  ) {
    this.storageService = storageService || new FileStorageService()
  }

  /**
   * Get all files (flat list)
   * Results are not cached as this is rarely used directly
   */
  async getAllFiles(): Promise<FileEntity[]> {
    return await this.fileRepository.findAll()
  }

  /**
   * Get file by ID with caching
   * Cache TTL: 3 minutes (CACHE_TTL_FILE_BY_ID)
   */
  async getFileById(id: string): Promise<FileEntity | null> {
    const cacheKey = CacheConfig.KEYS.FILE_BY_ID(id)

    // Try cache first
    const cached = await this.cache.get<FileEntity>(cacheKey)
    if (cached) {
      return cached
    }

    // Get from database
    const file = await this.fileRepository.findById(id)

    // Cache if found
    if (file) {
      await this.cache.set(cacheKey, file, CacheConfig.TTL.FILE_BY_ID)
    }

    return file
  }

  /**
   * Get files by folder ID with caching
   * Cache TTL: 2 minutes (CACHE_TTL_FILE_LIST)
   */
  async getFilesByFolderId(folderId: string): Promise<FileEntity[]> {
    // Validate folder exists
    const folder = await this.folderRepository.findById(folderId)
    if (!folder) {
      throw new ValidationError(`Folder with id ${folderId} not found`)
    }

    const cacheKey = CacheConfig.KEYS.FILE_LIST(folderId)

    // Try cache first
    const cached = await this.cache.get<FileEntity[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Get from database
    const files = await this.fileRepository.findByFolderId(folderId)

    // Cache results
    await this.cache.set(cacheKey, files, CacheConfig.TTL.FILE_LIST)

    return files
  }

  /**
   * Search files by name with caching
   * Cache TTL: 1 minute (CACHE_TTL_SEARCH)
   */
  async searchFiles(query: string): Promise<FileEntity[]> {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty')
    }

    const normalizedQuery = query.trim()
    const cacheKey = CacheConfig.KEYS.SEARCH_RESULTS(normalizedQuery)

    // Try cache first (same cache key pattern as folders for unified search)
    const cached = await this.cache.get<FileEntity[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Search database
    const results = await this.fileRepository.search(normalizedQuery)

    // Cache results
    await this.cache.set(cacheKey, results, CacheConfig.TTL.SEARCH_RESULTS)

    return results
  }

  /**
   * Create a new file
   * Invalidates relevant caches and publishes events
   */
  async createFile(data: {
    name: string
    folderId: string
    size?: number
    mimeType?: string
    filePath?: string
  }): Promise<FileEntity> {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('File name cannot be empty')
    }

    // Validate folder exists
    const folder = await this.folderRepository.findById(data.folderId)
    if (!folder) {
      throw new ValidationError(`Folder with id ${data.folderId} not found`)
    }

    // Create file
    const file = await this.fileRepository.create({
      name: data.name.trim(),
      folderId: data.folderId,
      size: data.size ?? 0,
      mimeType: data.mimeType ?? null,
      filePath: data.filePath ?? null,
    })

    // Invalidate relevant caches
    await this.invalidateFileCaches(file.id, file.folderId)

    // Publish file.created event
    await this.eventPublisher.publish({
      type: 'file.created',
      payload: {
        fileId: file.id,
        name: file.name,
        folderId: file.folderId,
        size: file.size,
        mimeType: file.mimeType,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // Publish search.index.file event for search indexing
    await this.eventPublisher.publish({
      type: 'search.index.file',
      payload: {
        fileId: file.id,
        name: file.name,
        folderId: file.folderId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    return file
  }

  /**
   * Update file properties
   * Invalidates relevant caches and publishes events
   */
  async updateFile(id: string, data: { name?: string; folderId?: string }): Promise<FileEntity> {
    // Validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('File name cannot be empty')
    }

    // Validate new folder exists if changing folder
    if (data.folderId) {
      const folder = await this.folderRepository.findById(data.folderId)
      if (!folder) {
        throw new ValidationError(`Folder with id ${data.folderId} not found`)
      }
    }

    // Get old file data for cache invalidation
    const oldFile = await this.fileRepository.findById(id)
    if (!oldFile) {
      throw new ValidationError(`File with id ${id} not found`)
    }

    // Update file
    const file = await this.fileRepository.update(id, {
      ...(data.name && { name: data.name.trim() }),
      ...(data.folderId && { folderId: data.folderId }),
    })

    // Invalidate caches (old and new folder)
    await this.invalidateFileCaches(file.id, file.folderId)
    if (oldFile.folderId !== file.folderId) {
      await this.invalidateFileCaches(id, oldFile.folderId)
    }

    // Publish file.updated event
    await this.eventPublisher.publish({
      type: 'file.updated',
      payload: {
        fileId: file.id,
        name: file.name,
        folderId: file.folderId,
        oldFolderId: oldFile.folderId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // Publish search.index.file event for search indexing
    await this.eventPublisher.publish({
      type: 'search.index.file',
      payload: {
        fileId: file.id,
        name: file.name,
        folderId: file.folderId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    return file
  }

  /**
   * Upload a file with actual file storage
   * Saves file to disk and creates database record
   */
  async uploadFile(file: File, folderId: string): Promise<FileEntity> {
    // Validate folder exists
    const folder = await this.folderRepository.findById(folderId)
    if (!folder) {
      throw new ValidationError(`Folder with id ${folderId} not found`)
    }

    // Save file to disk
    const filePath = await this.storageService.saveFile(file, file.name)

    // Create file record in database
    return await this.createFile({
      name: file.name,
      folderId,
      size: file.size,
      mimeType: file.type,
      filePath,
    })
  }

  /**
   * Get file content for download
   */
  async getFileContent(id: string): Promise<{ buffer: Buffer; file: FileEntity }> {
    const file = await this.getFileById(id)
    if (!file) {
      throw new ValidationError(`File with id ${id} not found`)
    }

    if (!file.filePath) {
      throw new ValidationError(`File ${id} has no stored content`)
    }

    if (!this.storageService.fileExists(file.filePath)) {
      throw new ValidationError(`File content not found on disk for file ${id}`)
    }

    const buffer = await this.storageService.readFile(file.filePath)
    return { buffer, file }
  }

  /**
   * Delete file
   * Invalidates relevant caches and publishes events
   */
  async deleteFile(id: string): Promise<void> {
    // Get file before deletion for cache invalidation
    const file = await this.fileRepository.findById(id)
    if (!file) {
      throw new ValidationError(`File with id ${id} not found`)
    }

    // Delete file from disk if it exists
    if (file.filePath) {
      try {
        await this.storageService.deleteFile(file.filePath)
      } catch (error) {
        console.error(`Failed to delete file from disk: ${error}`)
        // Continue with database deletion even if disk deletion fails
      }
    }

    // Delete file from database
    await this.fileRepository.delete(id)

    // Invalidate all related caches
    await this.invalidateFileCaches(id, file.folderId)

    // Publish file.deleted event
    await this.eventPublisher.publish({
      type: 'file.deleted',
      payload: {
        fileId: file.id,
        name: file.name,
        folderId: file.folderId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // Publish search.remove.file event for removing from search index
    await this.eventPublisher.publish({
      type: 'search.remove.file',
      payload: {
        id: file.id,
      },
    })
  }

  /**
   * Invalidate all caches related to a file
   * @private
   */
  private async invalidateFileCaches(fileId: string, folderId: string): Promise<void> {
    const keysToInvalidate = [
      CacheConfig.KEYS.FILE_BY_ID(fileId),
      CacheConfig.KEYS.FILE_LIST(folderId),
      CacheConfig.KEYS.FOLDER_CHILDREN(folderId),
      CacheConfig.KEYS.FOLDER_TREE, // Tree might show file counts
    ]

    // Clear all search caches (they might contain this file)
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
        reason: 'file_change',
        fileId,
        folderId,
      },
    })
  }
}
