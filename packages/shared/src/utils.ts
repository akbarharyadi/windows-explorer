/**
 * Current event schema version
 * Format: major.minor.patch
 * - Major: Breaking changes (field removed/renamed)
 * - Minor: New fields added (backward compatible)
 * - Patch: Bug fixes (no schema change)
 */
export const EVENT_SCHEMA_VERSION = '1.0.0'

/**
 * Generate a unique correlation ID for distributed tracing
 * Format: timestamp-uuid
 * @returns Correlation ID string
 *
 * @example
 * const correlationId = generateCorrelationId()
 * // "1234567890123-550e8400-e29b-41d4-a716-446655440000"
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`
}

/**
 * Create event metadata object
 * Includes correlation ID for tracing and optional user/source info
 *
 * @param userId - Optional user ID who triggered the event
 * @param source - Optional source of the event (e.g., 'api', 'worker', 'cron')
 * @returns Event metadata object
 *
 * @example
 * const metadata = createEventMetadata('user-123', 'api')
 * // {
 * //   correlationId: "1234567890123-uuid",
 * //   userId: "user-123",
 * //   source: "api"
 * // }
 */
export function createEventMetadata(
  userId?: string,
  source?: string,
): {
  correlationId: string
  userId?: string
  source?: string
} {
  return {
    correlationId: generateCorrelationId(),
    userId,
    source,
  }
}
