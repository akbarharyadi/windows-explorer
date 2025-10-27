import { Elysia, t } from 'elysia'
import { FolderService } from '../../application/services/FolderService'
import { FileService } from '../../application/services/FileService'
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

// Initialize services with all dependencies
const folderService = new FolderService(folderRepository, fileRepository, cache, eventPublisher)
const fileService = new FileService(fileRepository, folderRepository, cache, eventPublisher)

/**
 * Search routes - RESTful API endpoints for searching folders and files
 * Prefix: /api/v1/search
 */
export const searchRoutes = new Elysia({ prefix: '/api/v1/search' })
  // Search folders and files by name
  .get(
    '/',
    async ({ query }) => {
      // Search both folders and files concurrently
      const [folders, files] = await Promise.all([
        folderService.searchFolders(query.q),
        fileService.searchFiles(query.q),
      ])

      return {
        success: true,
        data: {
          folders,
          files,
          total: {
            folders: folders.length,
            files: files.length,
            combined: folders.length + files.length,
          },
        },
      }
    },
    {
      query: t.Object({
        q: t.String({
          minLength: 1,
          description: 'Search query (required, min 1 character)',
        }),
      }),
      detail: {
        summary: 'Search folders and files',
        description: 'Searches for folders and files by name (case-insensitive, cached)',
        tags: ['Search'],
      },
    },
  )

  // Search only folders
  .get(
    '/folders',
    async ({ query }) => {
      const folders = await folderService.searchFolders(query.q)

      return {
        success: true,
        data: folders,
        total: folders.length,
      }
    },
    {
      query: t.Object({
        q: t.String({
          minLength: 1,
          description: 'Search query (required, min 1 character)',
        }),
      }),
      detail: {
        summary: 'Search folders only',
        description: 'Searches for folders by name (case-insensitive, cached)',
        tags: ['Search'],
      },
    },
  )

  // Search only files
  .get(
    '/files',
    async ({ query }) => {
      const files = await fileService.searchFiles(query.q)

      return {
        success: true,
        data: files,
        total: files.length,
      }
    },
    {
      query: t.Object({
        q: t.String({
          minLength: 1,
          description: 'Search query (required, min 1 character)',
        }),
      }),
      detail: {
        summary: 'Search files only',
        description: 'Searches for files by name (case-insensitive, cached)',
        tags: ['Search'],
      },
    },
  )
