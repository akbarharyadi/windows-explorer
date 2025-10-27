/**
 * Type definitions for the Window Explorer Worker Service
 *
 * This module defines the types used throughout the worker service,
 * particularly for message handling and event processing.
 *
 * @module WorkerTypes
 */

import {
  FolderCreatedPayload,
  FolderUpdatedPayload,
  FolderDeletedPayload,
  FileCreatedPayload,
  FileUpdatedPayload,
  FileDeletedPayload,
  CacheInvalidatePayload,
  CacheWarmPayload,
  SearchIndexFolderPayload,
  SearchIndexFilePayload,
  SearchRemovePayload,
} from '@window-explorer/shared'

/**
 * Generic interface for messages consumed from RabbitMQ
 *
 * The message contains a type (event name) and payload (event data)
 */
export interface RabbitMQMessage<T = unknown> {
  /** The event type (e.g., 'folder.created', 'file.updated') */
  type: string
  /** The event payload containing the relevant data */
  payload: T
  /** Optional metadata for the event */
  metadata?: Record<string, unknown>
}

/**
 * Type aliases for specific message types used in the worker
 */
export type FolderCreatedMessage = RabbitMQMessage<FolderCreatedPayload>
export type FolderUpdatedMessage = RabbitMQMessage<FolderUpdatedPayload>
export type FolderDeletedMessage = RabbitMQMessage<FolderDeletedPayload>
export type FileCreatedMessage = RabbitMQMessage<FileCreatedPayload>
export type FileUpdatedMessage = RabbitMQMessage<FileUpdatedPayload>
export type FileDeletedMessage = RabbitMQMessage<FileDeletedPayload>
export type CacheInvalidateMessage = RabbitMQMessage<CacheInvalidatePayload>
export type CacheWarmMessage = RabbitMQMessage<CacheWarmPayload>
export type SearchIndexFolderMessage = RabbitMQMessage<SearchIndexFolderPayload>
export type SearchIndexFileMessage = RabbitMQMessage<SearchIndexFilePayload>
export type SearchRemoveMessage = RabbitMQMessage<SearchRemovePayload>

/**
 * Union type for all possible message types handled by the worker
 */
export type WorkerMessage =
  | FolderCreatedMessage
  | FolderUpdatedMessage
  | FolderDeletedMessage
  | FileCreatedMessage
  | FileUpdatedMessage
  | FileDeletedMessage
  | CacheInvalidateMessage
  | CacheWarmMessage
  | SearchIndexFolderMessage
  | SearchIndexFileMessage
  | SearchRemoveMessage
