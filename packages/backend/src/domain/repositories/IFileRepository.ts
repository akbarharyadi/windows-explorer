import { FileEntity } from '../entities/File'

/**
 * Repository interface (port) for file persistence operations
 * Defines the contract that infrastructure adapters must implement
 * Following Repository pattern and Dependency Inversion Principle
 */
export interface IFileRepository {
  /** Retrieve all files ordered by name */
  findAll(): Promise<FileEntity[]>

  /** Find file by ID, returns null if not found */
  findById(id: string): Promise<FileEntity | null>

  /** Find all files in a specific folder */
  findByFolderId(folderId: string): Promise<FileEntity[]>

  /** Search files by name (case-insensitive) */
  search(query: string): Promise<FileEntity[]>

  /** Create a new file */
  create(data: Omit<FileEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FileEntity>

  /** Update file properties */
  update(id: string, data: Partial<Omit<FileEntity, 'id'>>): Promise<FileEntity>

  /** Delete file */
  delete(id: string): Promise<void>
}
