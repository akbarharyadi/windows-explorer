/**
 * Event publisher port (interface) for publishing domain events
 * Part of Application layer in Clean Architecture
 * Implementations (adapters) should be in Infrastructure layer
 */
export interface EventPublisherPort<TPayload = unknown> {
  /**
   * Publish an event to the message queue
   * @param event Event to publish
   */
  publish(event: {
    type: string
    payload: TPayload
    metadata?: Record<string, unknown>
  }): Promise<void>

  /**
   * Publish multiple events in batch
   * @param events Array of events to publish
   */
  publishBatch(
    events: Array<{
      type: string
      payload: TPayload
      metadata?: Record<string, unknown>
    }>,
  ): Promise<void>
}
