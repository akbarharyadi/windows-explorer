/**
 * Search Consumer - Processes search index management events from RabbitMQ
 *
 * This consumer handles messages related to search indexing operations like
 * adding, updating, and removing items from the search index.
 *
 * @module SearchConsumer
 */

import rabbitmq from '../infrastructure/queue/rabbitmq'
import { SearchIndexer } from '../processors/SearchIndexer'
import { Queues } from '@window-explorer/shared'
import {
  WorkerMessage,
  SearchIndexFolderPayload,
  SearchIndexFilePayload,
  SearchRemovePayload,
} from '../types'

/**
 * Consumer class that handles search index management events
 *
 * This class listens to the search queue and processes events related to
 * search index operations, ensuring the search functionality stays current.
 */
export class SearchConsumer {
  private searchIndexer: SearchIndexer

  /**
   * Creates a new instance of SearchConsumer
   * Initializes dependencies for processing search events
   */
  constructor() {
    this.searchIndexer = new SearchIndexer()
  }

  /**
   * Starts the search consumer to listen for messages
   *
   * This method connects to the RabbitMQ search queue and processes incoming messages
   * related to search index management operations.
   *
   * @returns Promise that resolves when the consumer is started
   * @throws Error if connection to RabbitMQ fails
   */
  async start(): Promise<void> {
    console.log('👂 Starting Search Consumer...')

    await rabbitmq.consume(Queues.SEARCH.name, async (message: WorkerMessage) => {
      const { type, payload } = message

      switch (type) {
        case 'search.index.folder':
          // Index the folder for search functionality
          await this.searchIndexer.indexFolder(payload as SearchIndexFolderPayload)
          break

        case 'search.index.file':
          // Index the file for search functionality
          await this.searchIndexer.indexFile(payload as SearchIndexFilePayload)
          break

        case 'search.remove.folder':
        case 'search.remove.file': {
          // Remove the item from search index
          const searchPayload = payload as SearchRemovePayload
          const typeForIndex = type === 'search.remove.folder' ? 'folder' : 'file'
          await this.searchIndexer.removeFromIndex(
            typeForIndex,
            searchPayload.id,
            searchPayload.name,
          )
          break
        }

        default:
          console.warn(`⚠️ Unknown search event type: ${type}`)
      }
    })

    console.log('✅ Search Consumer started')
  }
}
