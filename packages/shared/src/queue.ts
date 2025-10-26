// ============================================================================
// Exchange Configuration
// ============================================================================

export const Exchanges = {
  FOLDER: {
    name: 'folder.exchange',
    type: 'topic' as const,
    options: { durable: true },
  },
  FILE: {
    name: 'file.exchange',
    type: 'topic' as const,
    options: { durable: true },
  },
  CACHE: {
    name: 'cache.exchange',
    type: 'fanout' as const,
    options: { durable: true },
  },
  SEARCH: {
    name: 'search.exchange',
    type: 'topic' as const,
    options: { durable: true },
  },
} as const

// ============================================================================
// Queue Configuration
// ============================================================================

export const Queues = {
  FOLDER: {
    name: 'folder.queue',
    options: { durable: true },
    bindings: [
      {
        exchange: Exchanges.FOLDER.name,
        routingKey: 'folder.*',
      },
    ],
  },
  FILE: {
    name: 'file.queue',
    options: { durable: true },
    bindings: [
      {
        exchange: Exchanges.FILE.name,
        routingKey: 'file.*',
      },
    ],
  },
  CACHE: {
    name: 'cache.queue',
    options: { durable: true },
    bindings: [
      {
        exchange: Exchanges.CACHE.name,
        routingKey: '',
      },
    ],
  },
  SEARCH: {
    name: 'search.queue',
    options: { durable: true },
    bindings: [
      {
        exchange: Exchanges.SEARCH.name,
        routingKey: 'search.*',
      },
    ],
  },
} as const

// ============================================================================
// Routing Keys
// ============================================================================

export const RoutingKeys = {
  FOLDER: {
    CREATED: 'folder.created',
    UPDATED: 'folder.updated',
    DELETED: 'folder.deleted',
    MOVED: 'folder.moved',
  },
  FILE: {
    CREATED: 'file.created',
    UPDATED: 'file.updated',
    DELETED: 'file.deleted',
    MOVED: 'file.moved',
  },
  CACHE: {
    INVALIDATE: 'cache.invalidate',
    WARM: 'cache.warm',
    CLEAR_ALL: 'cache.clear.all',
  },
  SEARCH: {
    INDEX_FOLDER: 'search.index.folder',
    INDEX_FILE: 'search.index.file',
    REMOVE_FOLDER: 'search.remove.folder',
    REMOVE_FILE: 'search.remove.file',
    REBUILD_INDEX: 'search.rebuild.index',
  },
} as const

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface QueueConfig {
  readonly name: string
  readonly options: {
    readonly durable: boolean
    readonly autoDelete?: boolean
    readonly exclusive?: boolean
    readonly arguments?: Record<string, unknown>
  }
  readonly bindings: ReadonlyArray<{
    readonly exchange: string
    readonly routingKey: string
  }>
}

export interface ExchangeConfig {
  readonly name: string
  readonly type: 'direct' | 'topic' | 'fanout' | 'headers'
  readonly options: {
    readonly durable: boolean
    readonly autoDelete?: boolean
    readonly internal?: boolean
    readonly arguments?: Record<string, unknown>
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all queue configurations
 * @returns Array of queue configurations
 */
export function getAllQueueConfigs(): QueueConfig[] {
  return Object.values(Queues) as QueueConfig[]
}

/**
 * Get all exchange configurations
 * @returns Array of exchange configurations
 */
export function getAllExchangeConfigs(): ExchangeConfig[] {
  return Object.values(Exchanges) as ExchangeConfig[]
}
