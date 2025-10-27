import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { setupTestDatabase, teardownTestDatabase, prisma } from '../setup'
import { FolderRepository } from '../../src/infrastructure/database/repositories/FolderRepository'
import { FileRepository } from '../../src/infrastructure/database/repositories/FileRepository'
import { FolderService } from '../../src/application/services/FolderService'
import { RedisCache } from '../../src/infrastructure/cache/redis'
import { RabbitMQEventPublisher } from '../../src/infrastructure/messaging/rabbitmq.publisher'

describe('Folder Integration Tests', () => {
  let folderRepo: FolderRepository
  let fileRepo: FileRepository
  let cache: RedisCache
  let eventPublisher: EventEmitterPort
  let folderService: FolderService

  beforeAll(async () => {
    await setupTestDatabase()
    folderRepo = new FolderRepository()
    fileRepo = new FileRepository()
    cache = new RedisCache()
    eventPublisher = new EventEmitterPort()
    folderService = new FolderService(folderRepo, fileRepo, cache, eventPublisher)
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  it('should create a root folder', async () => {
    const folder = await folderService.createFolder({
      name: 'Test Root',
      parentId: null,
    })

    expect(folder).toBeDefined()
    expect(folder.name).toBe('Test Root')
    expect(folder.parentId).toBeNull()
  })

  it('should create a child folder', async () => {
    const parent = await folderService.createFolder({
      name: 'Parent',
      parentId: null,
    })

    const child = await folderService.createFolder({
      name: 'Child',
      parentId: parent.id,
    })

    expect(child.parentId).toBe(parent.id)
  })

  it('should get folder tree', async () => {
    const tree = await folderService.getFolderTree()
    expect(Array.isArray(tree)).toBe(true)
  })

  it('should search folders', async () => {
    await folderService.createFolder({
      name: 'Searchable Folder',
      parentId: null,
    })

    const results = await folderService.searchFolders('Searchable')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toContain('Searchable')
  })
})