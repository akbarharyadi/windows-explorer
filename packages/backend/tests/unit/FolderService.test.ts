import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { FolderService } from '../../src/application/services/FolderService'
import type { IFolderRepository } from '../../src/domain/repositories/IFolderRepository'
import type { IFileRepository } from '../../src/domain/repositories/IFileRepository'
import type { CachePort } from '../../src/application/ports/cache.port'
import type { EventPublisherPort } from '../../src/application/ports/event-publisher.port'
import type { FolderEntity } from '../../src/domain/entities/Folder'
import type { FileEntity } from '../../src/domain/entities/File'
import { ValidationError } from '../../src/domain/errors'

describe('FolderService', () => {
  let folderService: FolderService
  let mockFolderRepo: IFolderRepository
  let mockFileRepo: IFileRepository
  let mockCache: CachePort
  let mockEventPublisher: EventPublisherPort

  const mockFolder: FolderEntity = {
    id: '123',
    name: 'Test Folder',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    // Reset mocks before each test
    mockFolderRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(mockFolder)),
      findByParentId: mock(() => Promise.resolve([])),
      findChildren: mock(() => Promise.resolve([])),
      buildTree: mock(() => Promise.resolve([])),
      search: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve(mockFolder)),
      update: mock(() => Promise.resolve(mockFolder)),
      delete: mock(() => Promise.resolve()),
    }

    mockFileRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByFolderId: mock(() => Promise.resolve([])),
      search: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({} as FileEntity)),
      update: mock(() => Promise.resolve({} as FileEntity)),
      delete: mock(() => Promise.resolve()),
    }

    mockCache = {
      get: mock(() => Promise.resolve(null)),
      set: mock(() => Promise.resolve()),
      del: mock(() => Promise.resolve()),
      delMany: mock(() => Promise.resolve()),
      clearPattern: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(false)),
    }

    mockEventPublisher = {
      publish: mock(() => Promise.resolve()),
      publishBatch: mock(() => Promise.resolve()),
    }

    folderService = new FolderService(mockFolderRepo, mockFileRepo, mockCache, mockEventPublisher)
  })

  describe('getAllFolders', () => {
    it('should get all folders from repository', async () => {
      const result = await folderService.getAllFolders()
      expect(result).toEqual([])
      expect(mockFolderRepo.findAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFolderTree', () => {
    it('should return cached tree if available', async () => {
      const mockTree = [{ ...mockFolder, children: [], level: 0 }]
      mockCache.get = mock(() => Promise.resolve(mockTree))

      const result = await folderService.getFolderTree()

      expect(result).toEqual(mockTree)
      expect(mockCache.get).toHaveBeenCalledTimes(1)
      expect(mockFolderRepo.buildTree).not.toHaveBeenCalled()
    })

    it('should build tree and cache it if not cached', async () => {
      const mockTree = [{ ...mockFolder, children: [], level: 0 }]
      mockCache.get = mock(() => Promise.resolve(null))
      mockFolderRepo.buildTree = mock(() => Promise.resolve(mockTree))

      const result = await folderService.getFolderTree()

      expect(result).toEqual(mockTree)
      expect(mockFolderRepo.buildTree).toHaveBeenCalledTimes(1)
      expect(mockCache.set).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFolderById', () => {
    it('should return cached folder if available', async () => {
      mockCache.get = mock(() => Promise.resolve(mockFolder))

      const result = await folderService.getFolderById('123')

      expect(result).toEqual(mockFolder)
      expect(mockCache.get).toHaveBeenCalledTimes(1)
      expect(mockFolderRepo.findById).not.toHaveBeenCalled()
    })

    it('should fetch from DB and cache if not cached', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      mockFolderRepo.findById = mock(() => Promise.resolve(mockFolder))

      const result = await folderService.getFolderById('123')

      expect(result).toEqual(mockFolder)
      expect(mockFolderRepo.findById).toHaveBeenCalledTimes(1)
      expect(mockCache.set).toHaveBeenCalledTimes(1)
    })

    it('should not cache if folder not found', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      const result = await folderService.getFolderById('999')

      expect(result).toBeNull()
      expect(mockCache.set).not.toHaveBeenCalled()
    })
  })

  describe('getFolderChildren', () => {
    it('should throw error if parent folder not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(folderService.getFolderChildren('999')).rejects.toThrow(ValidationError)
      await expect(folderService.getFolderChildren('999')).rejects.toThrow(
        'Folder with id 999 not found',
      )
    })

    it('should return cached children if available', async () => {
      const mockFolders = [mockFolder]
      const mockFiles = [{ id: 'f1', name: 'test.txt' }]

      mockCache.get = mock((key: string) => {
        if (key.includes('children')) return Promise.resolve(mockFolders)
        if (key.includes('files')) return Promise.resolve(mockFiles)
        return Promise.resolve(null)
      })

      const result = await folderService.getFolderChildren('123')

      expect(result).toEqual({ folders: mockFolders, files: mockFiles })
      expect(mockFolderRepo.findChildren).not.toHaveBeenCalled()
      expect(mockFileRepo.findByFolderId).not.toHaveBeenCalled()
    })

    it('should fetch from DB and cache if not cached', async () => {
      mockCache.get = mock(() => Promise.resolve(null))

      await folderService.getFolderChildren('123')

      expect(mockFolderRepo.findChildren).toHaveBeenCalledTimes(1)
      expect(mockFileRepo.findByFolderId).toHaveBeenCalledTimes(1)
      expect(mockCache.set).toHaveBeenCalledTimes(2) // folders + files
    })
  })

  describe('searchFolders', () => {
    it('should throw error for empty query', async () => {
      await expect(folderService.searchFolders('')).rejects.toThrow(ValidationError)
      await expect(folderService.searchFolders('   ')).rejects.toThrow(
        'Search query cannot be empty',
      )
    })

    it('should return cached results if available', async () => {
      const mockResults = [mockFolder]
      mockCache.get = mock(() => Promise.resolve(mockResults))

      const result = await folderService.searchFolders('test')

      expect(result).toEqual(mockResults)
      expect(mockFolderRepo.search).not.toHaveBeenCalled()
    })

    it('should search and cache results', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      const mockResults = [mockFolder]
      mockFolderRepo.search = mock(() => Promise.resolve(mockResults))

      const result = await folderService.searchFolders('test')

      expect(result).toEqual(mockResults)
      expect(mockFolderRepo.search).toHaveBeenCalledWith('test')
      expect(mockCache.set).toHaveBeenCalledTimes(1)
    })

    it('should trim whitespace from query', async () => {
      mockCache.get = mock(() => Promise.resolve(null))

      await folderService.searchFolders('  test  ')

      expect(mockFolderRepo.search).toHaveBeenCalledWith('test')
    })
  })

  describe('createFolder', () => {
    it('should throw error for empty name', async () => {
      await expect(folderService.createFolder({ name: '' })).rejects.toThrow(ValidationError)
      await expect(folderService.createFolder({ name: '   ' })).rejects.toThrow(
        'Folder name cannot be empty',
      )
    })

    it('should throw error if parent not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(folderService.createFolder({ name: 'Test', parentId: '999' })).rejects.toThrow(
        'Parent folder with id 999 not found',
      )
    })

    it('should create folder with null parent', async () => {
      const result = await folderService.createFolder({ name: 'Test' })

      expect(result).toEqual(mockFolder)
      expect(mockFolderRepo.create).toHaveBeenCalledWith({
        name: 'Test',
        parentId: null,
      })
    })

    it('should invalidate caches after creation', async () => {
      await folderService.createFolder({ name: 'Test' })

      expect(mockCache.delMany).toHaveBeenCalledTimes(1)
      expect(mockCache.clearPattern).toHaveBeenCalledWith('search:*')
    })

    it('should publish folder.created event', async () => {
      await folderService.createFolder({ name: 'Test' })

      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2) // folder.created + cache.invalidate
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'folder.created',
        }),
      )
    })

    it('should trim folder name', async () => {
      await folderService.createFolder({ name: '  Test  ' })

      expect(mockFolderRepo.create).toHaveBeenCalledWith({
        name: 'Test',
        parentId: null,
      })
    })
  })

  describe('updateFolder', () => {
    it('should throw error for empty name', async () => {
      await expect(folderService.updateFolder('123', { name: '' })).rejects.toThrow(
        'Folder name cannot be empty',
      )
    })

    it('should throw error for circular reference', async () => {
      await expect(folderService.updateFolder('123', { parentId: '123' })).rejects.toThrow(
        'A folder cannot be its own parent',
      )
    })

    it('should throw error if folder not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(folderService.updateFolder('999', { name: 'New Name' })).rejects.toThrow(
        'Folder with id 999 not found',
      )
    })

    it('should update folder name', async () => {
      await folderService.updateFolder('123', { name: 'New Name' })

      expect(mockFolderRepo.update).toHaveBeenCalledWith('123', {
        name: 'New Name',
      })
    })

    it('should invalidate caches after update', async () => {
      await folderService.updateFolder('123', { name: 'New Name' })

      expect(mockCache.delMany).toHaveBeenCalled()
      expect(mockCache.clearPattern).toHaveBeenCalledWith('search:*')
    })

    it('should publish folder.updated event', async () => {
      await folderService.updateFolder('123', { name: 'New Name' })

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'folder.updated',
        }),
      )
    })
  })

  describe('deleteFolder', () => {
    it('should throw error if folder not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(folderService.deleteFolder('999')).rejects.toThrow(
        'Folder with id 999 not found',
      )
    })

    it('should delete folder', async () => {
      await folderService.deleteFolder('123')

      expect(mockFolderRepo.delete).toHaveBeenCalledWith('123')
    })

    it('should invalidate caches after deletion', async () => {
      await folderService.deleteFolder('123')

      expect(mockCache.delMany).toHaveBeenCalled()
      expect(mockCache.clearPattern).toHaveBeenCalledWith('search:*')
    })

    it('should publish folder.deleted event', async () => {
      await folderService.deleteFolder('123')

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'folder.deleted',
        }),
      )
    })
  })
})
