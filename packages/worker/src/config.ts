/**
 * Configuration for the Window Explorer Worker Service
 *
 * This module defines all configuration values for the worker service,
 * including connection details, cache settings, and operational parameters.
 *
 * @module WorkerConfig
 */

export const WorkerConfig = {
  /**
   * Role identifier for this service instance
   * Used to identify the service in logs and metrics
   */
  SERVICE_ROLE: 'worker',

  // RabbitMQ Configuration
  /** Configuration for RabbitMQ message queue */
  RABBITMQ: {
    /** Connection URL for RabbitMQ server */
    URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    /** Number of messages to prefetch for processing (concurrency level) */
    PREFETCH_COUNT: parseInt(process.env.WORKER_CONCURRENCY || '10'),
    /** Delay in milliseconds before retrying failed message processing */
    RETRY_DELAY: 5000, // 5 seconds
    /** Maximum number of retry attempts for failed message processing */
    MAX_RETRIES: 3,
  },

  // Redis Configuration
  /** Configuration for Redis cache */
  REDIS: {
    /** Connection URL for Redis server */
    URL: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Database Configuration
  /** Configuration for database connection */
  DATABASE: {
    /** Connection URL for the database */
    URL: process.env.DATABASE_URL || '',
  },

  // Cache TTL (seconds)
  /** Time-to-live settings for different cache entries (in seconds) */
  CACHE_TTL: {
    /** TTL for folder tree cache (5 minutes) */
    FOLDER_TREE: 300, // 5 minutes
    /** TTL for folder children cache (2 minutes) */
    FOLDER_CHILDREN: 120, // 2 minutes
    /** TTL for search results cache (1 minute) */
    SEARCH_RESULTS: 60, // 1 minute
  },

  // Worker Behavior
  /** Timeout for graceful shutdown (in milliseconds) */
  GRACEFUL_SHUTDOWN_TIMEOUT: 30000, // 30 seconds
}
