/**
 * Domain entity representing a file in the file system
 * Pure TypeScript interface with no dependencies on infrastructure
 */
export interface FileEntity {
  /** Unique identifier (UUID) */
  id: string
  /** File name with extension */
  name: string
  /** Parent folder ID (foreign key to FolderEntity) */
  folderId: string
  /** File size in bytes */
  size: number
  /** MIME type of the file (e.g., 'image/jpeg', 'application/pdf') */
  mimeType: string | null
  /** Path to the stored file on disk */
  filePath: string | null
  /** Timestamp when file was created */
  createdAt: Date
  /** Timestamp when file was last updated */
  updatedAt: Date
}
