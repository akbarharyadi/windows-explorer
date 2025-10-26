/**
 * Domain entity representing a folder in the file system hierarchy
 * Pure TypeScript interface with no dependencies on infrastructure
 */
export interface FolderEntity {
  /** Unique identifier (UUID) */
  id: string
  /** Folder name */
  name: string
  /** Parent folder ID for hierarchical structure (null for root folders) */
  parentId: string | null
  /** Timestamp when folder was created */
  createdAt: Date
  /** Timestamp when folder was last updated */
  updatedAt: Date
}

/**
 * Extended folder entity including nested children for tree structures
 * Used for building and representing folder hierarchies
 */
export interface FolderWithChildren extends FolderEntity {
  /** Nested child folders */
  children: FolderWithChildren[]
  /** Depth level in the hierarchy (0 for root) */
  level: number
}
