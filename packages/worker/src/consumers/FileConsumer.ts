/**
 * File Consumer - Processes file-related events from RabbitMQ
 *
 * This consumer handles messages related to file operations (creation, updates, deletion)
 * and manages cache invalidation and search indexing for files.
 *
 * @module FileConsumer
 */

import rabbitmq from '../infrastructure/queue/rabbitmq'
import redis from '../infrastructure/cache/redis'
import { SearchIndexer } from '../processors/SearchIndexer'
import { Queues } from '@window-explorer/shared'
import { WorkerMessage, FileCreatedPayload, FileUpdatedPayload, FileDeletedPayload } from '../types'

/**
 * Consumer class that handles file-related events
 *
 * This class listens to the file queue and processes events related to
 * file operations, maintaining cache consistency and search index updates.
 */
export class FileConsumer {
  private searchIndexer: SearchIndexer

  /**
   * Creates a new instance of FileConsumer
   * Initializes dependencies for processing file events
   */
  constructor() {
    this.searchIndexer = new SearchIndexer()
  }

  /**
   * Starts the file consumer to listen for messages
   *
   * This method connects to the RabbitMQ file queue and processes incoming messages
   * related to file operations, managing caching and search indexing.
   *
   * @returns Promise that resolves when the consumer is started
   * @throws Error if connection to RabbitMQ fails
   */
  async start(): Promise<void> {
    console.log('👂 Starting File Consumer...')

    await rabbitmq.consume(Queues.FILE.name, async (message: WorkerMessage) => {
      const { type, payload } = message

      switch (type) {
        case 'file.created':
          await this.handleFileCreated(payload as FileCreatedPayload)
          break

        case 'file.updated':
          await this.handleFileUpdated(payload as FileUpdatedPayload)
          break

        case 'file.deleted':
          await this.handleFileDeleted(payload as FileDeletedPayload)
          break

        default:
          console.warn(`⚠️ Unknown file event type: ${type}`)
      }
    })

    console.log('✅ File Consumer started')
  }

  /**
   * Handles the event when a new file is created
   *
   * This method invalidates relevant cache entries and indexes the new file
   * for search functionality.
   *
   * @param payload The file data from the event
   * @returns Promise that resolves when processing is complete
   */
  private async handleFileCreated(payload: FileCreatedPayload): Promise<void> {
    console.log(`📄 Processing file created: ${payload.fileId}`)

    // Invalidate folder's file list cache to ensure fresh data
    await redis.del(`folder:${payload.folderId}:files`)
    await redis.del(`folder:${payload.folderId}:children`)

    // Index file for search functionality
    await this.searchIndexer.indexFile(payload)

    console.log(`✅ File created processing complete`)
  }

  /**
   * Handles the event when a file is updated
   *
   * This method invalidates relevant cache entries and updates the file
   * in the search index.
   *
   * @param payload The updated file data from the event
   * @returns Promise that resolves when processing is complete
   */
  private async handleFileUpdated(payload: FileUpdatedPayload): Promise<void> {
    console.log(`📝 Processing file updated: ${payload.fileId}`)

    // Invalidate folder's file list cache to ensure fresh data
    await redis.del(`folder:${payload.folderId}:files`)
    await redis.del(`folder:${payload.folderId}:children`)

    // Re-index file for search functionality
    await this.searchIndexer.indexFile(payload)

    console.log(`✅ File updated processing complete`)
  }

  /**
   * Handles the event when a file is deleted
   *
   * This method invalidates relevant cache entries and removes the file
   * from the search index.
   *
   * @param payload The deleted file data from the event
   * @returns Promise that resolves when processing is complete
   */
  private async handleFileDeleted(payload: FileDeletedPayload): Promise<void> {
    console.log(`🗑️ Processing file deleted: ${payload.fileId}`)

    // Invalidate folder's file list cache to ensure fresh data
    await redis.del(`folder:${payload.folderId}:files`)
    await redis.del(`folder:${payload.folderId}:children`)

    // Remove from search index to keep it consistent
    await this.searchIndexer.removeFromIndex('file', payload.fileId, payload.name)

    console.log(`✅ File deleted processing complete`)
  }
}
