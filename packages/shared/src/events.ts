import { z } from 'zod'

// ============================================================================
// Base Event Interface
// ============================================================================

export interface BaseEvent<T = unknown> {
  type: string
  version: string
  payload: T
  timestamp: Date
  metadata?: {
    correlationId?: string
    userId?: string
    source?: string
  }
}

// ============================================================================
// Event Type Enums
// ============================================================================

export enum FolderEventType {
  FOLDER_CREATED = 'folder.created',
  FOLDER_UPDATED = 'folder.updated',
  FOLDER_DELETED = 'folder.deleted',
  FOLDER_MOVED = 'folder.moved',
}

export enum FileEventType {
  FILE_CREATED = 'file.created',
  FILE_UPDATED = 'file.updated',
  FILE_DELETED = 'file.deleted',
  FILE_MOVED = 'file.moved',
}

export enum CacheEventType {
  CACHE_INVALIDATE = 'cache.invalidate',
  CACHE_WARM = 'cache.warm',
  CACHE_CLEAR_ALL = 'cache.clear.all',
}

export enum SearchEventType {
  SEARCH_INDEX_FOLDER = 'search.index.folder',
  SEARCH_INDEX_FILE = 'search.index.file',
  SEARCH_REMOVE_FOLDER = 'search.remove.folder',
  SEARCH_REMOVE_FILE = 'search.remove.file',
  SEARCH_REBUILD_INDEX = 'search.rebuild.index',
}

// ============================================================================
// Zod Schemas - Folder Events
// ============================================================================

export const FolderCreatedPayloadSchema = z.object({
  folderId: z.string().uuid(),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable(),
  createdBy: z.string().optional(),
})

export const FolderUpdatedPayloadSchema = z.object({
  folderId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().uuid().optional(),
  previousParentId: z.string().uuid().optional(),
  updatedBy: z.string().optional(),
})

export const FolderDeletedPayloadSchema = z.object({
  folderId: z.string().uuid(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
  deletedBy: z.string().optional(),
})

export const FolderMovedPayloadSchema = z.object({
  folderId: z.string().uuid(),
  previousParentId: z.string().uuid().nullable(),
  newParentId: z.string().uuid().nullable(),
  movedBy: z.string().optional(),
})

// ============================================================================
// Zod Schemas - File Events
// ============================================================================

export const FileCreatedPayloadSchema = z.object({
  fileId: z.string().uuid(),
  name: z.string().min(1).max(255),
  folderId: z.string().uuid(),
  size: z.number().int().nonnegative(),
  mimeType: z.string().optional(),
  createdBy: z.string().optional(),
})

export const FileUpdatedPayloadSchema = z.object({
  fileId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().optional(),
  previousFolderId: z.string().uuid().optional(),
  size: z.number().int().nonnegative().optional(),
  updatedBy: z.string().optional(),
})

export const FileDeletedPayloadSchema = z.object({
  fileId: z.string().uuid(),
  name: z.string(),
  folderId: z.string().uuid(),
  deletedBy: z.string().optional(),
})

export const FileMovedPayloadSchema = z.object({
  fileId: z.string().uuid(),
  previousFolderId: z.string().uuid(),
  newFolderId: z.string().uuid(),
  movedBy: z.string().optional(),
})

// ============================================================================
// Zod Schemas - Cache Events
// ============================================================================

export const CacheInvalidatePayloadSchema = z.object({
  key: z.string().optional(),
  pattern: z.string().optional(),
  reason: z.string().optional(),
})

export const CacheWarmPayloadSchema = z.object({
  type: z.enum(['folder.tree', 'folder.children', 'popular.folders']),
  folderId: z.string().uuid().optional(),
})

export const CacheClearAllPayloadSchema = z.object({
  reason: z.string(),
})

// ============================================================================
// Zod Schemas - Search Events
// ============================================================================

export const SearchIndexFolderPayloadSchema = z.object({
  folderId: z.string().uuid(),
  name: z.string(),
})

export const SearchIndexFilePayloadSchema = z.object({
  fileId: z.string().uuid(),
  name: z.string(),
  folderId: z.string().uuid(),
})

export const SearchRemovePayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['folder', 'file']),
})

export const SearchRebuildIndexPayloadSchema = z.object({
  reason: z.string().optional(),
})

// ============================================================================
// TypeScript Types (inferred from Zod)
// ============================================================================

// Folder Payloads
export type FolderCreatedPayload = z.infer<typeof FolderCreatedPayloadSchema>
export type FolderUpdatedPayload = z.infer<typeof FolderUpdatedPayloadSchema>
export type FolderDeletedPayload = z.infer<typeof FolderDeletedPayloadSchema>
export type FolderMovedPayload = z.infer<typeof FolderMovedPayloadSchema>

// File Payloads
export type FileCreatedPayload = z.infer<typeof FileCreatedPayloadSchema>
export type FileUpdatedPayload = z.infer<typeof FileUpdatedPayloadSchema>
export type FileDeletedPayload = z.infer<typeof FileDeletedPayloadSchema>
export type FileMovedPayload = z.infer<typeof FileMovedPayloadSchema>

// Cache Payloads
export type CacheInvalidatePayload = z.infer<typeof CacheInvalidatePayloadSchema>
export type CacheWarmPayload = z.infer<typeof CacheWarmPayloadSchema>
export type CacheClearAllPayload = z.infer<typeof CacheClearAllPayloadSchema>

// Search Payloads
export type SearchIndexFolderPayload = z.infer<typeof SearchIndexFolderPayloadSchema>
export type SearchIndexFilePayload = z.infer<typeof SearchIndexFilePayloadSchema>
export type SearchRemovePayload = z.infer<typeof SearchRemovePayloadSchema>
export type SearchRebuildIndexPayload = z.infer<typeof SearchRebuildIndexPayloadSchema>

// ============================================================================
// Typed Events
// ============================================================================

// Folder Events
export type FolderCreatedEvent = BaseEvent<FolderCreatedPayload>
export type FolderUpdatedEvent = BaseEvent<FolderUpdatedPayload>
export type FolderDeletedEvent = BaseEvent<FolderDeletedPayload>
export type FolderMovedEvent = BaseEvent<FolderMovedPayload>

// File Events
export type FileCreatedEvent = BaseEvent<FileCreatedPayload>
export type FileUpdatedEvent = BaseEvent<FileUpdatedPayload>
export type FileDeletedEvent = BaseEvent<FileDeletedPayload>
export type FileMovedEvent = BaseEvent<FileMovedPayload>

// Cache Events
export type CacheInvalidateEvent = BaseEvent<CacheInvalidatePayload>
export type CacheWarmEvent = BaseEvent<CacheWarmPayload>
export type CacheClearAllEvent = BaseEvent<CacheClearAllPayload>

// Search Events
export type SearchIndexFolderEvent = BaseEvent<SearchIndexFolderPayload>
export type SearchIndexFileEvent = BaseEvent<SearchIndexFilePayload>
export type SearchRemoveEvent = BaseEvent<SearchRemovePayload>
export type SearchRebuildIndexEvent = BaseEvent<SearchRebuildIndexPayload>

// ============================================================================
// Union Types for Event Handlers
// ============================================================================

export type FolderEvent =
  | FolderCreatedEvent
  | FolderUpdatedEvent
  | FolderDeletedEvent
  | FolderMovedEvent

export type FileEvent = FileCreatedEvent | FileUpdatedEvent | FileDeletedEvent | FileMovedEvent

export type CacheEvent = CacheInvalidateEvent | CacheWarmEvent | CacheClearAllEvent

export type SearchEvent =
  | SearchIndexFolderEvent
  | SearchIndexFileEvent
  | SearchRemoveEvent
  | SearchRebuildIndexEvent

export type AllEvents = FolderEvent | FileEvent | CacheEvent | SearchEvent
