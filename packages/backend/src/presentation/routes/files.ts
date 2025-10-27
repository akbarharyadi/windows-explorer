import { Elysia, t } from 'elysia'
import { FileService } from '../../application/services/FileService'
import { FileRepository } from '../../infrastructure/database/repositories/FileRepository'
import { FolderRepository } from '../../infrastructure/database/repositories/FolderRepository'
import { RedisCacheAdapter } from '../../infrastructure/cache/redis.adapter'
import { RabbitMQEventPublisher } from '../../infrastructure/messaging/rabbitmq.publisher'
import { redis } from '../../infrastructure/cache/redis'

// Initialize dependencies
const fileRepository = new FileRepository()
const folderRepository = new FolderRepository()
const cache = new RedisCacheAdapter(redis)
const eventPublisher = new RabbitMQEventPublisher()

// Initialize service with all dependencies
const fileService = new FileService(fileRepository, folderRepository, cache, eventPublisher)

/**
 * File routes - RESTful API endpoints for file operations
 * Prefix: /api/v1/files
 */
export const fileRoutes = new Elysia({ prefix: '/api/v1/files' })
  // Get all files (flat list)
  .get(
    '/',
    async () => {
      const files = await fileService.getAllFiles()
      return {
        success: true,
        data: files,
      }
    },
    {
      detail: {
        summary: 'Get all files',
        description: 'Returns a flat list of all files ordered by name',
        tags: ['Files'],
      },
    },
  )

  // Get file by ID
  .get(
    '/:id',
    async ({ params }) => {
      const file = await fileService.getFileById(params.id)
      return {
        success: true,
        data: file,
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'File UUID' }),
      }),
      detail: {
        summary: 'Get file by ID',
        description: 'Returns a single file by its ID (cached)',
        tags: ['Files'],
      },
    },
  )

  // Get files by folder ID
  .get(
    '/folder/:folderId',
    async ({ params }) => {
      const files = await fileService.getFilesByFolderId(params.folderId)
      return {
        success: true,
        data: files,
      }
    },
    {
      params: t.Object({
        folderId: t.String({ description: 'Folder UUID' }),
      }),
      detail: {
        summary: 'Get files by folder',
        description: 'Returns all files in a specific folder (cached)',
        tags: ['Files'],
      },
    },
  )

  // Create file
  .post(
    '/',
    async ({ body }) => {
      const file = await fileService.createFile(body)
      return {
        success: true,
        data: file,
        message: 'File created successfully',
      }
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          description: 'File name (required, non-empty)',
        }),
        folderId: t.String({
          description: 'Parent folder UUID (required)',
        }),
        size: t.Optional(
          t.Number({
            minimum: 0,
            description: 'File size in bytes (optional, default: 0)',
          }),
        ),
        mimeType: t.Optional(
          t.String({
            description: 'MIME type (optional, e.g., "image/png")',
          }),
        ),
      }),
      detail: {
        summary: 'Create file',
        description:
          'Creates a new file in a folder. Invalidates cache and publishes file.created event',
        tags: ['Files'],
      },
    },
  )

  // Update file
  .put(
    '/:id',
    async ({ params, body }) => {
      const file = await fileService.updateFile(params.id, body)
      return {
        success: true,
        data: file,
        message: 'File updated successfully',
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'File UUID' }),
      }),
      body: t.Object({
        name: t.Optional(
          t.String({
            minLength: 1,
            description: 'New file name (optional)',
          }),
        ),
        folderId: t.Optional(
          t.String({
            description: 'New parent folder UUID (optional)',
          }),
        ),
      }),
      detail: {
        summary: 'Update file',
        description:
          'Updates file properties (name and/or folder). Invalidates cache and publishes file.updated event',
        tags: ['Files'],
      },
    },
  )

  // Delete file
  .delete(
    '/:id',
    async ({ params }) => {
      await fileService.deleteFile(params.id)
      return {
        success: true,
        message: 'File deleted successfully',
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'File UUID' }),
      }),
      detail: {
        summary: 'Delete file',
        description: 'Deletes a file. Invalidates cache and publishes file.deleted event',
        tags: ['Files'],
      },
    },
  )

  // Upload file
  .post(
    '/upload',
    async ({ body }) => {
      const { file, folderId } = body

      // Upload file (saves to disk and creates database record)
      const fileRecord = await fileService.uploadFile(file, folderId)

      return {
        success: true,
        data: fileRecord,
        message: 'File uploaded successfully',
      }
    },
    {
      body: t.Object({
        file: t.File({
          description: 'File to upload',
        }),
        folderId: t.String({
          description: 'Parent folder UUID',
        }),
      }),
      detail: {
        summary: 'Upload file',
        description: 'Uploads a file to a specific folder and stores it on disk',
        tags: ['Files'],
      },
    },
  )

  // Preview file (for displaying in browser)
  .get(
    '/:id/preview',
    async ({ params, set }) => {
      const { buffer, file } = await fileService.getFileContent(params.id)

      // Set response headers for preview
      set.headers['Content-Type'] = file.mimeType || 'application/octet-stream'
      set.headers['Content-Disposition'] = `inline; filename="${file.name}"`
      set.headers['Content-Length'] = buffer.length.toString()

      return new Response(buffer)
    },
    {
      params: t.Object({
        id: t.String({ description: 'File UUID' }),
      }),
      detail: {
        summary: 'Preview file',
        description: 'Returns file content for preview in browser',
        tags: ['Files'],
      },
    },
  )

  // Download file
  .get(
    '/:id/download',
    async ({ params, set }) => {
      const { buffer, file } = await fileService.getFileContent(params.id)

      // Set response headers
      set.headers['Content-Type'] = file.mimeType || 'application/octet-stream'
      set.headers['Content-Disposition'] = `attachment; filename="${file.name}"`
      set.headers['Content-Length'] = buffer.length.toString()

      return new Response(buffer)
    },
    {
      params: t.Object({
        id: t.String({ description: 'File UUID' }),
      }),
      detail: {
        summary: 'Download file',
        description: 'Downloads the file content',
        tags: ['Files'],
      },
    },
  )
