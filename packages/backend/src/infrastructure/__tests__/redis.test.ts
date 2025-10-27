import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { redis } from '../cache/redis'
import { RedisCacheAdapter } from '../cache/redis.adapter'
import { CacheConfig } from '../cache/config'
import { setupInfrastructure, teardownInfrastructure } from './test-infrastructure'

describe('Redis Infrastructure', () => {
  beforeAll(async () => {
    await setupInfrastructure()
  })

  afterAll(async () => {
    await teardownInfrastructure()
  })

  beforeEach(async () => {
    // Clean test keys before each test
    const keys = await redis.keys('test:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  })

  describe('Redis Connection', () => {
    it('should be connected and ready', async () => {
      const result = await redis.ping()
      expect(result).toBe('PONG')
    })

    it('should have correct configuration', () => {
      expect(redis.options.maxRetriesPerRequest).toBe(3)
      expect(redis.options.enableReadyCheck).toBe(true)
    })
  })

  describe('RedisCacheAdapter', () => {
    let adapter: RedisCacheAdapter

    beforeEach(() => {
      adapter = new RedisCacheAdapter(redis)
    })

    describe('get/set operations', () => {
      it('should set and get a string value', async () => {
        await adapter.set('test:string', 'hello world')
        const value = await adapter.get<string>('test:string')
        expect(value).toBe('hello world')
      })

      it('should set and get an object value', async () => {
        const testObject = { id: '123', name: 'Test Folder', type: 'folder' }
        await adapter.set('test:object', testObject)
        const value = await adapter.get<typeof testObject>('test:object')
        expect(value).toEqual(testObject)
      })

      it('should set and get an array value', async () => {
        const testArray = [1, 2, 3, 4, 5]
        await adapter.set('test:array', testArray)
        const value = await adapter.get<typeof testArray>('test:array')
        expect(value).toEqual(testArray)
      })

      it('should return null for non-existent key', async () => {
        const value = await adapter.get('test:nonexistent')
        expect(value).toBeNull()
      })

      it('should respect TTL and expire', async () => {
        await adapter.set('test:ttl', 'temporary', 1) // 1 second TTL
        const valueBefore = await adapter.get('test:ttl')
        expect(valueBefore).toBe('temporary')

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const valueAfter = await adapter.get('test:ttl')
        expect(valueAfter).toBeNull()
      })
    })

    describe('delete operations', () => {
      it('should delete a single key', async () => {
        await adapter.set('test:delete', 'will be deleted')
        await adapter.del('test:delete')
        const value = await adapter.get('test:delete')
        expect(value).toBeNull()
      })

      it('should delete multiple keys', async () => {
        await adapter.set('test:delete1', 'value1')
        await adapter.set('test:delete2', 'value2')
        await adapter.set('test:delete3', 'value3')

        await adapter.delMany(['test:delete1', 'test:delete2', 'test:delete3'])

        const value1 = await adapter.get('test:delete1')
        const value2 = await adapter.get('test:delete2')
        const value3 = await adapter.get('test:delete3')

        expect(value1).toBeNull()
        expect(value2).toBeNull()
        expect(value3).toBeNull()
      })

      it('should handle deleting empty array gracefully', async () => {
        await expect(adapter.delMany([])).resolves.toBeUndefined()
      })
    })

    describe('pattern operations', () => {
      it('should clear keys matching pattern', async () => {
        await adapter.set('test:pattern:1', 'value1')
        await adapter.set('test:pattern:2', 'value2')
        await adapter.set('test:other', 'keep this')

        await adapter.clearPattern('test:pattern:*')

        const value1 = await adapter.get('test:pattern:1')
        const value2 = await adapter.get('test:pattern:2')
        const value3 = await adapter.get('test:other')

        expect(value1).toBeNull()
        expect(value2).toBeNull()
        expect(value3).toBe('keep this')
      })

      it('should handle clearing non-existent pattern', async () => {
        await expect(adapter.clearPattern('test:nonexistent:*')).resolves.toBeUndefined()
      })
    })

    describe('exists operation', () => {
      it('should return true for existing key', async () => {
        await adapter.set('test:exists', 'value')
        const exists = await adapter.exists('test:exists')
        expect(exists).toBe(true)
      })

      it('should return false for non-existent key', async () => {
        const exists = await adapter.exists('test:nonexistent')
        expect(exists).toBe(false)
      })
    })
  })

  describe('Cache Configuration', () => {
    it('should have correct TTL values', () => {
      expect(CacheConfig.TTL.FOLDER_TREE).toBe(300)
      expect(CacheConfig.TTL.FOLDER_CHILDREN).toBe(120)
      expect(CacheConfig.TTL.FOLDER_BY_ID).toBe(180)
      expect(CacheConfig.TTL.SEARCH_RESULTS).toBe(60)
      expect(CacheConfig.TTL.FILE_LIST).toBe(120)
    })

    it('should generate correct cache keys', () => {
      expect(CacheConfig.KEYS.FOLDER_TREE).toBe('folder:tree')
      expect(CacheConfig.KEYS.FOLDER_BY_ID('123')).toBe('folder:123')
      expect(CacheConfig.KEYS.FOLDER_CHILDREN('123')).toBe('folder:123:children')
      expect(CacheConfig.KEYS.SEARCH_RESULTS('TEST Query')).toBe('search:test query')
      expect(CacheConfig.KEYS.FILE_LIST('456')).toBe('folder:456:files')
      expect(CacheConfig.KEYS.FILE_BY_ID('789')).toBe('file:789')
    })
  })

  describe('Real-world cache scenarios', () => {
    let adapter: RedisCacheAdapter

    beforeEach(() => {
      adapter = new RedisCacheAdapter(redis)
    })

    it('should cache folder tree', async () => {
      const folderTree = {
        id: 'root',
        name: 'Root',
        children: [
          { id: '1', name: 'Folder 1', children: [] },
          { id: '2', name: 'Folder 2', children: [] },
        ],
      }

      await adapter.set(CacheConfig.KEYS.FOLDER_TREE, folderTree, CacheConfig.TTL.FOLDER_TREE)

      const cached = await adapter.get(CacheConfig.KEYS.FOLDER_TREE)
      expect(cached).toEqual(folderTree)
    })

    it('should cache folder by ID', async () => {
      const folder = { id: '123', name: 'My Folder', parentId: 'root' }

      await adapter.set(CacheConfig.KEYS.FOLDER_BY_ID('123'), folder, CacheConfig.TTL.FOLDER_BY_ID)

      const cached = await adapter.get(CacheConfig.KEYS.FOLDER_BY_ID('123'))
      expect(cached).toEqual(folder)
    })

    it('should cache search results', async () => {
      const searchResults = [
        { id: '1', name: 'Result 1', type: 'file' },
        { id: '2', name: 'Result 2', type: 'folder' },
      ]

      await adapter.set(
        CacheConfig.KEYS.SEARCH_RESULTS('test query'),
        searchResults,
        CacheConfig.TTL.SEARCH_RESULTS,
      )

      const cached = await adapter.get(CacheConfig.KEYS.SEARCH_RESULTS('test query'))
      expect(cached).toEqual(searchResults)
    })

    it('should invalidate folder cache when updated', async () => {
      const folderId = '123'

      // Cache folder and its children
      await adapter.set(CacheConfig.KEYS.FOLDER_BY_ID(folderId), {
        id: folderId,
        name: 'Old Name',
      })
      await adapter.set(CacheConfig.KEYS.FOLDER_CHILDREN(folderId), [])
      await adapter.set(CacheConfig.KEYS.FILE_LIST(folderId), [])

      // Simulate folder update - invalidate all related caches
      await adapter.delMany([
        CacheConfig.KEYS.FOLDER_BY_ID(folderId),
        CacheConfig.KEYS.FOLDER_CHILDREN(folderId),
        CacheConfig.KEYS.FILE_LIST(folderId),
        CacheConfig.KEYS.FOLDER_TREE,
      ])

      const folder = await adapter.get(CacheConfig.KEYS.FOLDER_BY_ID(folderId))
      const children = await adapter.get(CacheConfig.KEYS.FOLDER_CHILDREN(folderId))
      const files = await adapter.get(CacheConfig.KEYS.FILE_LIST(folderId))
      const tree = await adapter.get(CacheConfig.KEYS.FOLDER_TREE)

      expect(folder).toBeNull()
      expect(children).toBeNull()
      expect(files).toBeNull()
      expect(tree).toBeNull()
    })
  })
})
