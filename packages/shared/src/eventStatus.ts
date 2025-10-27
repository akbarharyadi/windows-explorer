import { z } from 'zod'

// ============================================================================
// Event Status Enums and Types
// ============================================================================

/**
 * Status of an event in the async processing pipeline
 */
export enum EventStatus {
  PENDING = 'pending',       // Published, waiting for worker to pick up
  PROCESSING = 'processing', // Worker is currently processing
  COMPLETED = 'completed',   // Successfully processed
  FAILED = 'failed',         // Processing failed
}

/**
 * Event tracker interface for database storage
 */
export interface EventTracker {
  id: string
  eventId: string
  eventType: string
  status: EventStatus
  entityId?: string          // Created resource ID (if applicable)
  error?: string             // Error message if failed
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

/**
 * Event status update payload for real-time notifications
 */
export interface EventStatusUpdate {
  eventId: string
  status: EventStatus
  entityId?: string
  error?: string
  timestamp: Date
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const EventStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'])

export const EventTrackerSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  eventType: z.string(),
  status: EventStatusSchema,
  entityId: z.string().uuid().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
})

export const EventStatusUpdateSchema = z.object({
  eventId: z.string().uuid(),
  status: EventStatusSchema,
  entityId: z.string().uuid().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an event status is terminal (completed or failed)
 */
export function isTerminalStatus(status: EventStatus): boolean {
  return status === EventStatus.COMPLETED || status === EventStatus.FAILED
}

/**
 * Check if an event status is in progress
 */
export function isInProgressStatus(status: EventStatus): boolean {
  return status === EventStatus.PENDING || status === EventStatus.PROCESSING
}

/**
 * Get a human-readable status message
 */
export function getStatusMessage(status: EventStatus, entityType: string = 'item'): string {
  switch (status) {
    case EventStatus.PENDING:
      return `Creating ${entityType}...`
    case EventStatus.PROCESSING:
      return `Processing ${entityType}...`
    case EventStatus.COMPLETED:
      return `${entityType} created successfully`
    case EventStatus.FAILED:
      return `Failed to create ${entityType}`
    default:
      return 'Unknown status'
  }
}

/**
 * Get status icon emoji
 */
export function getStatusIcon(status: EventStatus): string {
  switch (status) {
    case EventStatus.PENDING:
      return '⏳'
    case EventStatus.PROCESSING:
      return '🔄'
    case EventStatus.COMPLETED:
      return '✅'
    case EventStatus.FAILED:
      return '❌'
    default:
      return '❓'
  }
}
