import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { FileService } from '../../src/application/services/FileService'
import type { IFileRepository } from '../../src/domain/repositories/IFileRepository'
import type { IFolderRepository } from '../../src/domain/repositories/IFolderRepository'
import type { CachePort } from '../../src/application/ports/cache.port'
import type { EventPublisherPort } from '../../src/application/ports/event-publisher.port'
import type { FileEntity } from '../../src/domain/entities/File'
import type { FolderEntity } from '../../src/domain/entities/Folder'
import { ValidationError } from '../../src/domain/errors'

describe('FileService', () => {
  let fileService: FileService
  let mockFileRepo: IFileRepository
  let mockFolderRepo: IFolderRepository
  let mockCache: CachePort
  let mockEventPublisher: EventPublisherPort

  const mockFile: FileEntity = {
    id: 'f123',
    name: 'test.txt',
    folderId: '123',
    size: 1024,
    mimeType: 'text/plain',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockFolder: FolderEntity = {
    id: '123',
    name: 'Test Folder',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    mockFileRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(mockFile)),
      findByFolderId: mock(() => Promise.resolve([])),
      search: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve(mockFile)),
      update: mock(() => Promise.resolve(mockFile)),
      delete: mock(() => Promise.resolve()),
    }

    mockFolderRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(mockFolder)),
      findByParentId: mock(() => Promise.resolve([])),
      findChildren: mock(() => Promise.resolve([])),
      buildTree: mock(() => Promise.resolve([])),
      search: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({} as FolderEntity)),
      update: mock(() => Promise.resolve({} as FolderEntity)),
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

    fileService = new FileService(mockFileRepo, mockFolderRepo, mockCache, mockEventPublisher)
  })

  describe('getAllFiles', () => {
    it('should get all files from repository', async () => {
      const result = await fileService.getAllFiles()
      expect(result).toEqual([])
      expect(mockFileRepo.findAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFileById', () => {
    it('should return cached file if available', async () => {
      mockCache.get = mock(() => Promise.resolve(mockFile))

      const result = await fileService.getFileById('f123')

      expect(result).toEqual(mockFile)
      expect(mockCache.get).toHaveBeenCalledTimes(1)
      expect(mockFileRepo.findById).not.toHaveBeenCalled()
    })

    it('should fetch from DB and cache if not cached', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      mockFileRepo.findById = mock(() => Promise.resolve(mockFile))

      const result = await fileService.getFileById('f123')

      expect(result).toEqual(mockFile)
      expect(mockFileRepo.findById).toHaveBeenCalledTimes(1)
      expect(mockCache.set).toHaveBeenCalledTimes(1)
    })

    it('should not cache if file not found', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      mockFileRepo.findById = mock(() => Promise.resolve(null))

      const result = await fileService.getFileById('f999')

      expect(result).toBeNull()
      expect(mockCache.set).not.toHaveBeenCalled()
    })
  })

  describe('getFilesByFolderId', () => {
    it('should throw error if folder not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(fileService.getFilesByFolderId('999')).rejects.toThrow(ValidationError)
      await expect(fileService.getFilesByFolderId('999')).rejects.toThrow(
        'Folder with id 999 not found',
      )
    })

    it('should return cached files if available', async () => {
      const mockFiles = [mockFile]
      mockCache.get = mock(() => Promise.resolve(mockFiles))

      const result = await fileService.getFilesByFolderId('123')

      expect(result).toEqual(mockFiles)
      expect(mockFileRepo.findByFolderId).not.toHaveBeenCalled()
    })

    it('should fetch from DB and cache if not cached', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      const mockFiles = [mockFile]
      mockFileRepo.findByFolderId = mock(() => Promise.resolve(mockFiles))

      const result = await fileService.getFilesByFolderId('123')

      expect(result).toEqual(mockFiles)
      expect(mockFileRepo.findByFolderId).toHaveBeenCalledTimes(1)
      expect(mockCache.set).toHaveBeenCalledTimes(1)
    })
  })

  describe('searchFiles', () => {
    it('should throw error for empty query', async () => {
      await expect(fileService.searchFiles('')).rejects.toThrow(ValidationError)
      await expect(fileService.searchFiles('   ')).rejects.toThrow('Search query cannot be empty')
    })

    it('should return cached results if available', async () => {
      const mockResults = [mockFile]
      mockCache.get = mock(() => Promise.resolve(mockResults))

      const result = await fileService.searchFiles('test')

      expect(result).toEqual(mockResults)
      expect(mockFileRepo.search).not.toHaveBeenCalled()
    })

    it('should search and cache results', async () => {
      mockCache.get = mock(() => Promise.resolve(null))
      const mockResults = [mockFile]
      mockFileRepo.search = mock(() => Promise.resolve(mockResults))

      const result = await fileService.searchFiles('test')

      expect(result).toEqual(mockResults)
      expect(mockFileRepo.search).toHaveBeenCalledWith('test')
      expect(mockCache.set).toHaveBeenCalledTimes(1)
    })

    it('should trim whitespace from query', async () => {
      mockCache.get = mock(() => Promise.resolve(null))

      await fileService.searchFiles('  test  ')

      expect(mockFileRepo.search).toHaveBeenCalledWith('test')
    })
  })

  describe('createFile', () => {
    it('should throw error for empty name', async () => {
      await expect(fileService.createFile({ name: '', folderId: '123' })).rejects.toThrow(
        ValidationError,
      )
      await expect(fileService.createFile({ name: '   ', folderId: '123' })).rejects.toThrow(
        'File name cannot be empty',
      )
    })

    it('should throw error if folder not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(fileService.createFile({ name: 'test.txt', folderId: '999' })).rejects.toThrow(
        'Folder with id 999 not found',
      )
    })

    it('should create file with default values', async () => {
      const result = await fileService.createFile({
        name: 'test.txt',
        folderId: '123',
      })

      expect(result).toEqual(mockFile)
      expect(mockFileRepo.create).toHaveBeenCalledWith({
        name: 'test.txt',
        folderId: '123',
        size: 0,
        mimeType: null,
        filePath: null,
      })
    })

    it('should create file with custom size and mimeType', async () => {
      await fileService.createFile({
        name: 'test.txt',
        folderId: '123',
        size: 2048,
        mimeType: 'text/plain',
      })

      expect(mockFileRepo.create).toHaveBeenCalledWith({
        name: 'test.txt',
        folderId: '123',
        size: 2048,
        mimeType: 'text/plain',
        filePath: null,
      })
    })

    it('should invalidate caches after creation', async () => {
      await fileService.createFile({ name: 'test.txt', folderId: '123' })

      expect(mockCache.delMany).toHaveBeenCalledTimes(1)
      expect(mockCache.clearPattern).toHaveBeenCalledWith('search:*')
    })

    it('should publish file.created and search.index events', async () => {
      await fileService.createFile({ name: 'test.txt', folderId: '123' })

      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(3) // file.created + search.index + cache.invalidate
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file.created',
        }),
      )
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'search.index.file',
        }),
      )
    })

    it('should trim file name', async () => {
      await fileService.createFile({ name: '  test.txt  ', folderId: '123' })

      expect(mockFileRepo.create).toHaveBeenCalledWith({
        name: 'test.txt',
        folderId: '123',
        size: 0,
        mimeType: null,
        filePath: null,
      })
    })
  })

  describe('updateFile', () => {
    it('should throw error for empty name', async () => {
      await expect(fileService.updateFile('f123', { name: '' })).rejects.toThrow(
        'File name cannot be empty',
      )
    })

    it('should throw error if new folder not found', async () => {
      mockFolderRepo.findById = mock(() => Promise.resolve(null))

      await expect(fileService.updateFile('f123', { folderId: '999' })).rejects.toThrow(
        'Folder with id 999 not found',
      )
    })

    it('should throw error if file not found', async () => {
      mockFileRepo.findById = mock(() => Promise.resolve(null))

      await expect(fileService.updateFile('f999', { name: 'new.txt' })).rejects.toThrow(
        'File with id f999 not found',
      )
    })

    it('should update file name', async () => {
      await fileService.updateFile('f123', { name: 'new.txt' })

      expect(mockFileRepo.update).toHaveBeenCalledWith('f123', {
        name: 'new.txt',
      })
    })

    it('should update file folder', async () => {
      await fileService.updateFile('f123', { folderId: '456' })

      expect(mockFileRepo.update).toHaveBeenCalledWith('f123', {
        folderId: '456',
      })
    })

    it('should invalidate caches after update', async () => {
      await fileService.updateFile('f123', { name: 'new.txt' })

      expect(mockCache.delMany).toHaveBeenCalled()
      expect(mockCache.clearPattern).toHaveBeenCalledWith('search:*')
    })

    it('should publish file.updated and search.index events', async () => {
      await fileService.updateFile('f123', { name: 'new.txt' })

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file.updated',
        }),
      )
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'search.index.file',
        }),
      )
    })
  })

  describe('deleteFile', () => {
    it('should throw error if file not found', async () => {
      mockFileRepo.findById = mock(() => Promise.resolve(null))

      await expect(fileService.deleteFile('f999')).rejects.toThrow('File with id f999 not found')
    })

    it('should delete file', async () => {
      await fileService.deleteFile('f123')

      expect(mockFileRepo.delete).toHaveBeenCalledWith('f123')
    })

    it('should invalidate caches after deletion', async () => {
      await fileService.deleteFile('f123')

      expect(mockCache.delMany).toHaveBeenCalled()
      expect(mockCache.clearPattern).toHaveBeenCalledWith('search:*')
    })

    it('should publish file.deleted and search.index events', async () => {
      await fileService.deleteFile('f123')

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file.deleted',
        }),
      )
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'search.remove.file',
        }),
      )
    })
  })
})
