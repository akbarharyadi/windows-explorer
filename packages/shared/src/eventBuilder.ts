import {
  BaseEvent,
  FolderCreatedEvent,
  FolderUpdatedEvent,
  FolderDeletedEvent,
  FolderMovedEvent,
  FileCreatedEvent,
  FileUpdatedEvent,
  FileDeletedEvent,
  FileMovedEvent,
  CacheInvalidateEvent,
  CacheWarmEvent,
  CacheClearAllEvent,
  SearchIndexFolderEvent,
  SearchIndexFileEvent,
  SearchRemoveEvent,
  SearchRebuildIndexEvent,
  FolderEventType,
  FileEventType,
  CacheEventType,
  SearchEventType,
  FolderCreatedPayloadSchema,
  FolderUpdatedPayloadSchema,
  FolderDeletedPayloadSchema,
  FolderMovedPayloadSchema,
  FileCreatedPayloadSchema,
  FileUpdatedPayloadSchema,
  FileDeletedPayloadSchema,
  FileMovedPayloadSchema,
  CacheInvalidatePayloadSchema,
  CacheWarmPayloadSchema,
  CacheClearAllPayloadSchema,
  SearchIndexFolderPayloadSchema,
  SearchIndexFilePayloadSchema,
  SearchRemovePayloadSchema,
  SearchRebuildIndexPayloadSchema,
} from './events'
import { EVENT_SCHEMA_VERSION } from './utils'

/**
 * Event Builder - Factory methods for creating type-safe, validated events
 *
 * All methods:
 * - Validate payloads using Zod schemas (runtime validation)
 * - Auto-generate timestamps
 * - Auto-set schema version
 * - Accept optional metadata
 * - Throw descriptive ZodError if validation fails
 */
export class EventBuilder {
  // ============================================================================
  // Folder Events
  // ============================================================================

  /**
   * Create a folder.created event
   * @throws ZodError if validation fails
   */
  static createFolderCreated(
    data: { folderId: string; name: string; parentId: string | null; createdBy?: string },
    metadata?: BaseEvent['metadata'],
  ): FolderCreatedEvent {
    const validatedPayload = FolderCreatedPayloadSchema.parse(data)

    return {
      type: FolderEventType.FOLDER_CREATED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a folder.updated event
   * @throws ZodError if validation fails
   */
  static createFolderUpdated(
    data: {
      folderId: string
      name?: string
      parentId?: string
      previousParentId?: string
      updatedBy?: string
    },
    metadata?: BaseEvent['metadata'],
  ): FolderUpdatedEvent {
    const validatedPayload = FolderUpdatedPayloadSchema.parse(data)

    return {
      type: FolderEventType.FOLDER_UPDATED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a folder.deleted event
   * @throws ZodError if validation fails
   */
  static createFolderDeleted(
    data: { folderId: string; name: string; parentId: string | null; deletedBy?: string },
    metadata?: BaseEvent['metadata'],
  ): FolderDeletedEvent {
    const validatedPayload = FolderDeletedPayloadSchema.parse(data)

    return {
      type: FolderEventType.FOLDER_DELETED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a folder.moved event
   * @throws ZodError if validation fails
   */
  static createFolderMoved(
    data: {
      folderId: string
      previousParentId: string | null
      newParentId: string | null
      movedBy?: string
    },
    metadata?: BaseEvent['metadata'],
  ): FolderMovedEvent {
    const validatedPayload = FolderMovedPayloadSchema.parse(data)

    return {
      type: FolderEventType.FOLDER_MOVED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  // ============================================================================
  // File Events
  // ============================================================================

  /**
   * Create a file.created event
   * @throws ZodError if validation fails
   */
  static createFileCreated(
    data: {
      fileId: string
      name: string
      folderId: string
      size: number
      mimeType?: string
      createdBy?: string
    },
    metadata?: BaseEvent['metadata'],
  ): FileCreatedEvent {
    const validatedPayload = FileCreatedPayloadSchema.parse(data)

    return {
      type: FileEventType.FILE_CREATED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a file.updated event
   * @throws ZodError if validation fails
   */
  static createFileUpdated(
    data: {
      fileId: string
      name?: string
      folderId?: string
      previousFolderId?: string
      size?: number
      updatedBy?: string
    },
    metadata?: BaseEvent['metadata'],
  ): FileUpdatedEvent {
    const validatedPayload = FileUpdatedPayloadSchema.parse(data)

    return {
      type: FileEventType.FILE_UPDATED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a file.deleted event
   * @throws ZodError if validation fails
   */
  static createFileDeleted(
    data: { fileId: string; name: string; folderId: string; deletedBy?: string },
    metadata?: BaseEvent['metadata'],
  ): FileDeletedEvent {
    const validatedPayload = FileDeletedPayloadSchema.parse(data)

    return {
      type: FileEventType.FILE_DELETED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a file.moved event
   * @throws ZodError if validation fails
   */
  static createFileMoved(
    data: { fileId: string; previousFolderId: string; newFolderId: string; movedBy?: string },
    metadata?: BaseEvent['metadata'],
  ): FileMovedEvent {
    const validatedPayload = FileMovedPayloadSchema.parse(data)

    return {
      type: FileEventType.FILE_MOVED,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  // ============================================================================
  // Cache Events
  // ============================================================================

  /**
   * Create a cache.invalidate event
   * @param keyOrPattern - Cache key or pattern to invalidate
   * @param isPattern - Whether the first argument is a pattern (default: false)
   * @param reason - Optional reason for invalidation
   * @throws ZodError if validation fails
   */
  static createCacheInvalidate(
    keyOrPattern: string,
    isPattern = false,
    reason?: string,
    metadata?: BaseEvent['metadata'],
  ): CacheInvalidateEvent {
    const validatedPayload = CacheInvalidatePayloadSchema.parse({
      [isPattern ? 'pattern' : 'key']: keyOrPattern,
      reason,
    })

    return {
      type: CacheEventType.CACHE_INVALIDATE,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a cache.warm event
   * @throws ZodError if validation fails
   */
  static createCacheWarm(
    type: 'folder.tree' | 'folder.children' | 'popular.folders',
    folderId?: string,
    metadata?: BaseEvent['metadata'],
  ): CacheWarmEvent {
    const validatedPayload = CacheWarmPayloadSchema.parse({
      type,
      folderId,
    })

    return {
      type: CacheEventType.CACHE_WARM,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a cache.clear.all event
   * @throws ZodError if validation fails
   */
  static createCacheClearAll(reason: string, metadata?: BaseEvent['metadata']): CacheClearAllEvent {
    const validatedPayload = CacheClearAllPayloadSchema.parse({
      reason,
    })

    return {
      type: CacheEventType.CACHE_CLEAR_ALL,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  // ============================================================================
  // Search Events
  // ============================================================================

  /**
   * Create a search.index.folder event
   * @throws ZodError if validation fails
   */
  static createSearchIndexFolder(
    data: { folderId: string; name: string },
    metadata?: BaseEvent['metadata'],
  ): SearchIndexFolderEvent {
    const validatedPayload = SearchIndexFolderPayloadSchema.parse(data)

    return {
      type: SearchEventType.SEARCH_INDEX_FOLDER,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a search.index.file event
   * @throws ZodError if validation fails
   */
  static createSearchIndexFile(
    data: { fileId: string; name: string; folderId: string },
    metadata?: BaseEvent['metadata'],
  ): SearchIndexFileEvent {
    const validatedPayload = SearchIndexFilePayloadSchema.parse(data)

    return {
      type: SearchEventType.SEARCH_INDEX_FILE,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a search.remove event
   * @throws ZodError if validation fails
   */
  static createSearchRemove(
    data: { id: string; name: string; type: 'folder' | 'file' },
    metadata?: BaseEvent['metadata'],
  ): SearchRemoveEvent {
    const validatedPayload = SearchRemovePayloadSchema.parse(data)

    return {
      type:
        data.type === 'folder'
          ? SearchEventType.SEARCH_REMOVE_FOLDER
          : SearchEventType.SEARCH_REMOVE_FILE,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }

  /**
   * Create a search.rebuild.index event
   * @throws ZodError if validation fails
   */
  static createSearchRebuildIndex(
    reason?: string,
    metadata?: BaseEvent['metadata'],
  ): SearchRebuildIndexEvent {
    const validatedPayload = SearchRebuildIndexPayloadSchema.parse({
      reason,
    })

    return {
      type: SearchEventType.SEARCH_REBUILD_INDEX,
      version: EVENT_SCHEMA_VERSION,
      payload: validatedPayload,
      timestamp: new Date(),
      metadata,
    }
  }
}
