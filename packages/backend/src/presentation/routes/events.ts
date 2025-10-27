import { Elysia, t } from 'elysia'
import { EventStatusRepository } from '../../infrastructure/tracking/EventStatusRepository'

const eventStatusRepo = new EventStatusRepository()

/**
 * Event status routes for tracking async operations
 * Provides endpoints to check status of events and cleanup
 */
export const eventRoutes = new Elysia({ prefix: '/api/v1/events' })
  /**
   * GET /api/v1/events/:eventId/status
   * Get the status of a specific event
   */
  .get(
    '/:eventId/status',
    async ({ params }) => {
      const status = await eventStatusRepo.getStatus(params.eventId)

      if (!status) {
        return {
          success: false,
          error: 'Event not found',
        }
      }

      return {
        success: true,
        data: status,
      }
    },
    {
      params: t.Object({
        eventId: t.String(),
      }),
    }
  )

  /**
   * GET /api/v1/events/entity/:entityId
   * Get all events for a specific entity (folder/file)
   */
  .get(
    '/entity/:entityId',
    async ({ params }) => {
      const events = await eventStatusRepo.getByEntityId(params.entityId)
      return {
        success: true,
        data: events,
      }
    },
    {
      params: t.Object({
        entityId: t.String(),
      }),
    }
  )

  /**
   * GET /api/v1/events/pending
   * Get all pending/processing events (for monitoring)
   */
  .get('/pending', async () => {
    const events = await eventStatusRepo.getPendingEvents()
    return {
      success: true,
      data: events,
      count: events.length,
    }
  })

  /**
   * GET /api/v1/events/stats
   * Get event statistics (for monitoring dashboard)
   */
  .get('/stats', async () => {
    const stats = await eventStatusRepo.getStats()
    return {
      success: true,
      data: stats,
    }
  })

  /**
   * DELETE /api/v1/events/cleanup
   * Clean up old completed/failed events
   * Query param: daysOld (default: 7)
   */
  .delete(
    '/cleanup',
    async ({ query }) => {
      const daysOld = query.daysOld ? parseInt(query.daysOld) : 7
      const result = await eventStatusRepo.deleteOldEvents(daysOld)
      return {
        success: true,
        message: `Cleaned up events older than ${daysOld} days`,
        deleted: result.count,
      }
    },
    {
      query: t.Object({
        daysOld: t.Optional(t.String()),
      }),
    }
  )
