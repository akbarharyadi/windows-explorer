/**
 * Folder Consumer - Processes folder-related events from RabbitMQ
 *
 * This consumer handles messages related to folder operations (creation, updates, deletion)
 * and coordinates with processors and indexers to maintain consistency across the system.
 *
 * @module FolderConsumer
 */

import rabbitmq from '../infrastructure/queue/rabbitmq'
import { FolderProcessor } from '../processors/FolderProcessor'
import { SearchIndexer } from '../processors/SearchIndexer'
import { Queues } from '@window-explorer/shared'
import {
  WorkerMessage,
  FolderCreatedPayload,
  FolderUpdatedPayload,
  FolderDeletedPayload,
} from '../types'

/**
 * Consumer class that handles folder-related events
 *
 * This class listens to the folder queue and processes events related to
 * folder creation, updates, and deletion. It coordinates with other services
 * to ensure proper cache invalidation and search indexing.
 */
export class FolderConsumer {
  private processor: FolderProcessor
  private searchIndexer: SearchIndexer

  /**
   * Creates a new instance of FolderConsumer
   * Initializes dependencies for processing folder events
   */
  constructor() {
    this.processor = new FolderProcessor()
    this.searchIndexer = new SearchIndexer()
  }

  /**
   * Starts the folder consumer to listen for messages
   *
   * This method connects to the RabbitMQ folder queue and processes incoming messages
   * related to folder operations, coordinating with processors and indexers as needed.
   *
   * @returns Promise that resolves when the consumer is started
   * @throws Error if connection to RabbitMQ fails
   */
  async start(): Promise<void> {
    console.log('👂 Starting Folder Consumer...')

    await rabbitmq.consume(Queues.FOLDER.name, async (message: WorkerMessage) => {
      const { type, payload } = message

      switch (type) {
        case 'folder.created':
          // Process folder creation - update caches and index for search
          await this.processor.handleFolderCreated(payload as FolderCreatedPayload)
          await this.searchIndexer.indexFolder(payload)
          break

        case 'folder.updated':
          // Process folder update - update caches and re-index for search
          await this.processor.handleFolderUpdated(payload as FolderUpdatedPayload)
          await this.searchIndexer.indexFolder(payload)
          break

        case 'folder.deleted':
          // Process folder deletion - clean up caches and remove from search index
          await this.processor.handleFolderDeleted(payload as FolderDeletedPayload)
          await this.searchIndexer.removeFromIndex('folder', payload.folderId, payload.name)
          break

        default:
          console.warn(`⚠️ Unknown folder event type: ${type}`)
      }
    })

    console.log('✅ Folder Consumer started')
  }
}
