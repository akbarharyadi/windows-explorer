import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { Elysia } from 'elysia'
import { setupTestDatabase, teardownTestDatabase } from '../setup'
import { folderRoutes } from '../../src/presentation/routes/folders'
import { errorHandler } from '../../src/presentation/middlewares/errorHandler'

describe('API Integration Tests', () => {
  let app: Elysia

  beforeAll(async () => {
    await setupTestDatabase()
    app = new Elysia().use(errorHandler).use(folderRoutes)
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  it('should get folder tree', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/folders/tree'))
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should create folder via API', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'API Test Folder',
          parentId: null,
        }),
      })
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('API Test Folder')
  })

  it('should return 400 for invalid folder creation', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Empty name
        }),
      })
    )

    expect(response.status).toBe(400)
  })
})