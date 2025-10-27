import { prisma } from '../database/prisma'
import { EventStatus } from '@window-explorer/shared'

/**
 * Repository for managing event status tracking in the database
 * Provides CRUD operations for EventStatus model
 */
export class EventStatusRepository {
  /**
   * Create a new event status record
   */
  async create(data: {
    eventId: string
    eventType: string
    status: EventStatus
    metadata?: any
  }) {
    return await prisma.eventStatus.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType,
        status: data.status,
        metadata: data.metadata || {},
      },
    })
  }

  /**
   * Update event status
   */
  async updateStatus(
    eventId: string,
    status: EventStatus,
    entityId?: string,
    error?: string
  ) {
    const isTerminal = status === EventStatus.COMPLETED || status === EventStatus.FAILED

    return await prisma.eventStatus.update({
      where: { eventId },
      data: {
        status,
        entityId,
        error,
        completedAt: isTerminal ? new Date() : undefined,
      },
    })
  }

  /**
   * Get event status by eventId
   */
  async getStatus(eventId: string) {
    return await prisma.eventStatus.findUnique({
      where: { eventId },
    })
  }

  /**
   * Get all events for a specific entity (folder/file)
   */
  async getByEntityId(entityId: string) {
    return await prisma.eventStatus.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get pending or processing events (not completed or failed)
   */
  async getPendingEvents() {
    return await prisma.eventStatus.findMany({
      where: {
        status: {
          in: [EventStatus.PENDING, EventStatus.PROCESSING],
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Delete old completed/failed events (cleanup)
   * @param daysOld Number of days to keep (default: 7)
   */
  async deleteOldEvents(daysOld: number = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return await prisma.eventStatus.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: [EventStatus.COMPLETED, EventStatus.FAILED] },
      },
    })
  }

  /**
   * Get event statistics (for monitoring)
   */
  async getStats() {
    const [total, pending, processing, completed, failed] = await Promise.all([
      prisma.eventStatus.count(),
      prisma.eventStatus.count({ where: { status: EventStatus.PENDING } }),
      prisma.eventStatus.count({ where: { status: EventStatus.PROCESSING } }),
      prisma.eventStatus.count({ where: { status: EventStatus.COMPLETED } }),
      prisma.eventStatus.count({ where: { status: EventStatus.FAILED } }),
    ])

    return {
      total,
      pending,
      processing,
      completed,
      failed,
    }
  }
}
