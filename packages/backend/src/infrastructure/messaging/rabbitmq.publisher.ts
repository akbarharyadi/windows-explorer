import type { EventPublisherPort } from '../../application/ports/event-publisher.port'
import { rabbitMQ, RABBITMQ_CONFIG } from './rabbitmq'
import { RoutingKeys } from '@window-explorer/shared'

/**
 * RabbitMQ publisher adapter implementing EventPublisherPort interface
 * Part of Infrastructure layer - adapts RabbitMQ to our domain interface
 */
export class RabbitMQEventPublisher implements EventPublisherPort {
  /**
   * Publish a single event to RabbitMQ
   */
  async publish(event: {
    type: string
    payload: unknown
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      const channel = await rabbitMQ.getChannel()

      // Determine exchange and routing key based on event type
      const { exchange, routingKey } = this.getRouting(event.type)

      // Prepare message
      const message = {
        type: event.type,
        payload: event.payload,
        metadata: {
          ...event.metadata,
          timestamp: new Date().toISOString(),
          publishedBy: process.env.SERVICE_ROLE || 'api',
        },
      }

      // Publish to exchange
      const sent = channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      })

      if (!sent) {
        throw new Error('Failed to publish message to RabbitMQ')
      }

      console.log(`📤 Published event: ${event.type} to ${exchange}/${routingKey}`)
    } catch (error) {
      console.error(`Failed to publish event "${event.type}":`, error)
      throw error
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(
    events: Array<{
      type: string
      payload: unknown
      metadata?: Record<string, unknown>
    }>,
  ): Promise<void> {
    if (events.length === 0) return

    try {
      const channel = await rabbitMQ.getChannel()

      for (const event of events) {
        const { exchange, routingKey } = this.getRouting(event.type)

        const message = {
          type: event.type,
          payload: event.payload,
          metadata: {
            ...event.metadata,
            timestamp: new Date().toISOString(),
            publishedBy: process.env.SERVICE_ROLE || 'api',
          },
        }

        channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        })
      }

      console.log(`📤 Published ${events.length} events in batch`)
    } catch (error) {
      console.error('Failed to publish batch events:', error)
      throw error
    }
  }

  /**
   * Determine exchange and routing key based on event type
   */
  private getRouting(eventType: string): {
    exchange: string
    routingKey: string
  } {
    const { EXCHANGES } = RABBITMQ_CONFIG

    // Map event types to exchanges and routing keys using shared configuration
    const routingMap: Record<string, { exchange: string; routingKey: string }> = {
      'folder.created': {
        exchange: EXCHANGES.FOLDER,
        routingKey: RoutingKeys.FOLDER.CREATED,
      },
      'folder.updated': {
        exchange: EXCHANGES.FOLDER,
        routingKey: RoutingKeys.FOLDER.UPDATED,
      },
      'folder.deleted': {
        exchange: EXCHANGES.FOLDER,
        routingKey: RoutingKeys.FOLDER.DELETED,
      },
      'file.created': {
        exchange: EXCHANGES.FILE,
        routingKey: RoutingKeys.FILE.CREATED,
      },
      'file.updated': {
        exchange: EXCHANGES.FILE,
        routingKey: RoutingKeys.FILE.UPDATED,
      },
      'file.deleted': {
        exchange: EXCHANGES.FILE,
        routingKey: RoutingKeys.FILE.DELETED,
      },
      'cache.invalidate': {
        exchange: EXCHANGES.CACHE,
        routingKey: RoutingKeys.CACHE.INVALIDATE,
      },
      'search.index': {
        exchange: EXCHANGES.SEARCH,
        routingKey: RoutingKeys.SEARCH.INDEX_FOLDER,
      },
      'search.index.folder': {
        exchange: EXCHANGES.SEARCH,
        routingKey: RoutingKeys.SEARCH.INDEX_FOLDER,
      },
      'search.index.file': {
        exchange: EXCHANGES.SEARCH,
        routingKey: RoutingKeys.SEARCH.INDEX_FILE,
      },
    }

    const routing = routingMap[eventType]

    if (!routing) {
      // Default to FOLDER exchange for unknown event types
      console.warn(`Unknown event type "${eventType}", using default routing to FOLDER exchange`)
      return {
        exchange: EXCHANGES.FOLDER,
        routingKey: eventType,
      }
    }

    return routing
  }
}
