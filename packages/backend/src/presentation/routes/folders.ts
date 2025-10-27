import { Elysia, t } from 'elysia'
import { FolderService } from '../../application/services/FolderService'
import { FolderRepository } from '../../infrastructure/database/repositories/FolderRepository'
import { FileRepository } from '../../infrastructure/database/repositories/FileRepository'
import { RedisCacheAdapter } from '../../infrastructure/cache/redis.adapter'
import { RabbitMQEventPublisher } from '../../infrastructure/messaging/rabbitmq.publisher'
import { redis } from '../../infrastructure/cache/redis'

// Initialize dependencies
const folderRepository = new FolderRepository()
const fileRepository = new FileRepository()
const cache = new RedisCacheAdapter(redis)
const eventPublisher = new RabbitMQEventPublisher()

// Initialize service with all dependencies
const folderService = new FolderService(folderRepository, fileRepository, cache, eventPublisher)

/**
 * Folder routes - RESTful API endpoints for folder operations
 * Prefix: /api/v1/folders
 */
export const folderRoutes = new Elysia({ prefix: '/api/v1/folders' })
  // Get all folders (flat list)
  .get(
    '/',
    async () => {
      const folders = await folderService.getAllFolders()
      return {
        success: true,
        data: folders,
      }
    },
    {
      detail: {
        summary: 'Get all folders',
        description: 'Returns a flat list of all folders ordered by name',
        tags: ['Folders'],
      },
    },
  )

  // Get folder tree structure
  .get(
    '/tree',
    async () => {
      const tree = await folderService.getFolderTree()
      return {
        success: true,
        data: tree,
      }
    },
    {
      detail: {
        summary: 'Get folder tree',
        description: 'Returns hierarchical folder tree structure with nested children (cached)',
        tags: ['Folders'],
      },
    },
  )

  // Get folder by ID
  .get(
    '/:id',
    async ({ params }) => {
      const folder = await folderService.getFolderById(params.id)
      return {
        success: true,
        data: folder,
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Folder UUID' }),
      }),
      detail: {
        summary: 'Get folder by ID',
        description: 'Returns a single folder by its ID (cached)',
        tags: ['Folders'],
      },
    },
  )

  // Get folder children (both folders and files)
  .get(
    '/:id/children',
    async ({ params }) => {
      const result = await folderService.getFolderChildren(params.id)
      return {
        success: true,
        data: result,
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Parent folder UUID' }),
      }),
      detail: {
        summary: 'Get folder children',
        description: 'Returns immediate children (subfolders and files) of a folder (cached)',
        tags: ['Folders'],
      },
    },
  )

  // Create folder
  .post(
    '/',
    async ({ body }) => {
      const folder = await folderService.createFolder(body)
      return {
        success: true,
        data: folder,
        message: 'Folder created successfully',
      }
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          description: 'Folder name (required, non-empty)',
        }),
        parentId: t.Optional(
          t.Nullable(t.String({ description: 'Parent folder UUID (null for root)' })),
        ),
      }),
      detail: {
        summary: 'Create folder',
        description: 'Creates a new folder. Invalidates cache and publishes folder.created event',
        tags: ['Folders'],
      },
    },
  )

  // Update folder
  .put(
    '/:id',
    async ({ params, body }) => {
      const folder = await folderService.updateFolder(params.id, body)
      return {
        success: true,
        data: folder,
        message: 'Folder updated successfully',
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Folder UUID' }),
      }),
      body: t.Object({
        name: t.Optional(
          t.String({
            minLength: 1,
            description: 'New folder name (optional)',
          }),
        ),
        parentId: t.Optional(
          t.String({
            description: 'New parent folder UUID (optional)',
          }),
        ),
      }),
      detail: {
        summary: 'Update folder',
        description:
          'Updates folder properties (name and/or parent). Invalidates cache and publishes folder.updated event',
        tags: ['Folders'],
      },
    },
  )

  // Delete folder
  .delete(
    '/:id',
    async ({ params }) => {
      await folderService.deleteFolder(params.id)
      return {
        success: true,
        message: 'Folder deleted successfully',
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Folder UUID' }),
      }),
      detail: {
        summary: 'Delete folder',
        description:
          'Deletes a folder and all its children (cascade). Invalidates cache and publishes folder.deleted event',
        tags: ['Folders'],
      },
    },
  )
