import { describe, it, expect } from 'bun:test'
import { EventBuilder } from './eventBuilder'
import { FolderEventType, FileEventType, CacheEventType, SearchEventType } from './events'
import { EVENT_SCHEMA_VERSION } from './utils'

describe('EventBuilder', () => {
  // ============================================================================
  // Folder Events
  // ============================================================================

  describe('createFolderCreated', () => {
    it('should create valid folder created event', () => {
      const folderId = crypto.randomUUID()
      const event = EventBuilder.createFolderCreated({
        folderId,
        name: 'Test Folder',
        parentId: null,
      })

      expect(event.type).toBe(FolderEventType.FOLDER_CREATED)
      expect(event.version).toBe(EVENT_SCHEMA_VERSION)
      expect(event.payload.folderId).toBe(folderId)
      expect(event.payload.name).toBe('Test Folder')
      expect(event.payload.parentId).toBeNull()
      expect(event.timestamp).toBeInstanceOf(Date)
    })

    it('should accept optional createdBy field', () => {
      const event = EventBuilder.createFolderCreated({
        folderId: crypto.randomUUID(),
        name: 'Test',
        parentId: null,
        createdBy: 'user-123',
      })

      expect(event.payload.createdBy).toBe('user-123')
    })

    it('should accept optional metadata', () => {
      const metadata = {
        correlationId: 'test-123',
        userId: 'user-456',
        source: 'api',
      }

      const event = EventBuilder.createFolderCreated(
        {
          folderId: crypto.randomUUID(),
          name: 'Test',
          parentId: null,
        },
        metadata,
      )

      expect(event.metadata).toEqual(metadata)
    })

    it('should throw error for invalid folderId (not UUID)', () => {
      expect(() => {
        EventBuilder.createFolderCreated({
          folderId: 'invalid-uuid',
          name: 'Test',
          parentId: null,
        })
      }).toThrow()
    })

    it('should throw error for empty name', () => {
      expect(() => {
        EventBuilder.createFolderCreated({
          folderId: crypto.randomUUID(),
          name: '',
          parentId: null,
        })
      }).toThrow()
    })

    it('should throw error for name exceeding 255 characters', () => {
      expect(() => {
        EventBuilder.createFolderCreated({
          folderId: crypto.randomUUID(),
          name: 'a'.repeat(256),
          parentId: null,
        })
      }).toThrow()
    })
  })

  describe('createFolderDeleted', () => {
    it('should create valid folder deleted event', () => {
      const folderId = crypto.randomUUID()
      const event = EventBuilder.createFolderDeleted({
        folderId,
        name: 'Deleted Folder',
        parentId: null,
      })

      expect(event.type).toBe(FolderEventType.FOLDER_DELETED)
      expect(event.version).toBe(EVENT_SCHEMA_VERSION)
      expect(event.payload.folderId).toBe(folderId)
      expect(event.payload.name).toBe('Deleted Folder')
    })
  })

  describe('createFolderMoved', () => {
    it('should create valid folder moved event', () => {
      const folderId = crypto.randomUUID()
      const previousParentId = crypto.randomUUID()
      const newParentId = crypto.randomUUID()

      const event = EventBuilder.createFolderMoved({
        folderId,
        previousParentId,
        newParentId,
      })

      expect(event.type).toBe(FolderEventType.FOLDER_MOVED)
      expect(event.payload.folderId).toBe(folderId)
      expect(event.payload.previousParentId).toBe(previousParentId)
      expect(event.payload.newParentId).toBe(newParentId)
    })

    it('should accept null for previousParentId', () => {
      const event = EventBuilder.createFolderMoved({
        folderId: crypto.randomUUID(),
        previousParentId: null,
        newParentId: crypto.randomUUID(),
      })

      expect(event.payload.previousParentId).toBeNull()
    })
  })

  // ============================================================================
  // File Events
  // ============================================================================

  describe('createFileCreated', () => {
    it('should create valid file created event', () => {
      const fileId = crypto.randomUUID()
      const folderId = crypto.randomUUID()

      const event = EventBuilder.createFileCreated({
        fileId,
        name: 'test.txt',
        folderId,
        size: 1024,
      })

      expect(event.type).toBe(FileEventType.FILE_CREATED)
      expect(event.version).toBe(EVENT_SCHEMA_VERSION)
      expect(event.payload.fileId).toBe(fileId)
      expect(event.payload.name).toBe('test.txt')
      expect(event.payload.folderId).toBe(folderId)
      expect(event.payload.size).toBe(1024)
    })

    it('should accept optional mimeType', () => {
      const event = EventBuilder.createFileCreated({
        fileId: crypto.randomUUID(),
        name: 'test.txt',
        folderId: crypto.randomUUID(),
        size: 1024,
        mimeType: 'text/plain',
      })

      expect(event.payload.mimeType).toBe('text/plain')
    })

    it('should throw error for negative size', () => {
      expect(() => {
        EventBuilder.createFileCreated({
          fileId: crypto.randomUUID(),
          name: 'test.txt',
          folderId: crypto.randomUUID(),
          size: -100,
        })
      }).toThrow()
    })

    it('should throw error for non-integer size', () => {
      expect(() => {
        EventBuilder.createFileCreated({
          fileId: crypto.randomUUID(),
          name: 'test.txt',
          folderId: crypto.randomUUID(),
          size: 10.5,
        })
      }).toThrow()
    })
  })

  describe('createFileDeleted', () => {
    it('should create valid file deleted event', () => {
      const fileId = crypto.randomUUID()
      const folderId = crypto.randomUUID()

      const event = EventBuilder.createFileDeleted({
        fileId,
        name: 'deleted.txt',
        folderId,
      })

      expect(event.type).toBe(FileEventType.FILE_DELETED)
      expect(event.payload.fileId).toBe(fileId)
      expect(event.payload.folderId).toBe(folderId)
    })
  })

  // ============================================================================
  // Cache Events
  // ============================================================================

  describe('createCacheInvalidate', () => {
    it('should create event with key (not pattern)', () => {
      const event = EventBuilder.createCacheInvalidate('folder:123', false, 'Folder updated')

      expect(event.type).toBe(CacheEventType.CACHE_INVALIDATE)
      expect(event.version).toBe(EVENT_SCHEMA_VERSION)
      expect(event.payload.key).toBe('folder:123')
      expect(event.payload.pattern).toBeUndefined()
      expect(event.payload.reason).toBe('Folder updated')
    })

    it('should create event with pattern (not key)', () => {
      const event = EventBuilder.createCacheInvalidate('folder:*', true, 'Clear all folders')

      expect(event.payload.pattern).toBe('folder:*')
      expect(event.payload.key).toBeUndefined()
      expect(event.payload.reason).toBe('Clear all folders')
    })

    it('should work without reason', () => {
      const event = EventBuilder.createCacheInvalidate('folder:123')

      expect(event.payload.key).toBe('folder:123')
      expect(event.payload.reason).toBeUndefined()
    })
  })

  describe('createCacheWarm', () => {
    it('should create valid cache warm event', () => {
      const folderId = crypto.randomUUID()
      const event = EventBuilder.createCacheWarm('folder.children', folderId)

      expect(event.type).toBe(CacheEventType.CACHE_WARM)
      expect(event.payload.type).toBe('folder.children')
      expect(event.payload.folderId).toBe(folderId)
    })

    it('should accept folder.tree type', () => {
      const event = EventBuilder.createCacheWarm('folder.tree')

      expect(event.payload.type).toBe('folder.tree')
      expect(event.payload.folderId).toBeUndefined()
    })

    it('should throw error for invalid type', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        EventBuilder.createCacheWarm('invalid.type')
      }).toThrow()
    })
  })

  describe('createCacheClearAll', () => {
    it('should create valid cache clear all event', () => {
      const event = EventBuilder.createCacheClearAll('Manual clear by admin')

      expect(event.type).toBe(CacheEventType.CACHE_CLEAR_ALL)
      expect(event.payload.reason).toBe('Manual clear by admin')
    })

    it('should throw error when reason is missing', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        EventBuilder.createCacheClearAll()
      }).toThrow()
    })
  })

  // ============================================================================
  // Search Events
  // ============================================================================

  describe('createSearchIndexFolder', () => {
    it('should create valid search index folder event', () => {
      const folderId = crypto.randomUUID()
      const event = EventBuilder.createSearchIndexFolder({
        folderId,
        name: 'Important Folder',
      })

      expect(event.type).toBe(SearchEventType.SEARCH_INDEX_FOLDER)
      expect(event.payload.folderId).toBe(folderId)
      expect(event.payload.name).toBe('Important Folder')
    })
  })

  describe('createSearchIndexFile', () => {
    it('should create valid search index file event', () => {
      const fileId = crypto.randomUUID()
      const folderId = crypto.randomUUID()

      const event = EventBuilder.createSearchIndexFile({
        fileId,
        name: 'document.pdf',
        folderId,
      })

      expect(event.type).toBe(SearchEventType.SEARCH_INDEX_FILE)
      expect(event.payload.fileId).toBe(fileId)
      expect(event.payload.name).toBe('document.pdf')
      expect(event.payload.folderId).toBe(folderId)
    })
  })

  describe('createSearchRemove', () => {
    it('should create search remove event for folder', () => {
      const id = crypto.randomUUID()
      const event = EventBuilder.createSearchRemove({
        id,
        name: 'Removed Folder',
        type: 'folder',
      })

      expect(event.type).toBe(SearchEventType.SEARCH_REMOVE_FOLDER)
      expect(event.payload.id).toBe(id)
      expect(event.payload.type).toBe('folder')
    })

    it('should create search remove event for file', () => {
      const id = crypto.randomUUID()
      const event = EventBuilder.createSearchRemove({
        id,
        name: 'removed.txt',
        type: 'file',
      })

      expect(event.type).toBe(SearchEventType.SEARCH_REMOVE_FILE)
      expect(event.payload.type).toBe('file')
    })
  })

  describe('createSearchRebuildIndex', () => {
    it('should create search rebuild index event with reason', () => {
      const event = EventBuilder.createSearchRebuildIndex('Index corrupted')

      expect(event.type).toBe(SearchEventType.SEARCH_REBUILD_INDEX)
      expect(event.payload.reason).toBe('Index corrupted')
    })

    it('should work without reason', () => {
      const event = EventBuilder.createSearchRebuildIndex()

      expect(event.type).toBe(SearchEventType.SEARCH_REBUILD_INDEX)
      expect(event.payload.reason).toBeUndefined()
    })
  })

  // ============================================================================
  // General Event Properties
  // ============================================================================

  describe('Common event properties', () => {
    it('should auto-generate timestamp', () => {
      const before = new Date()
      const event = EventBuilder.createFolderCreated({
        folderId: crypto.randomUUID(),
        name: 'Test',
        parentId: null,
      })
      const after = new Date()

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should set correct version', () => {
      const event = EventBuilder.createFolderCreated({
        folderId: crypto.randomUUID(),
        name: 'Test',
        parentId: null,
      })

      expect(event.version).toBe('1.0.0')
      expect(event.version).toBe(EVENT_SCHEMA_VERSION)
    })
  })
})
