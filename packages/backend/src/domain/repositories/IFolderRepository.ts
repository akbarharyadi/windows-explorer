import { FolderEntity, FolderWithChildren } from '../entities/Folder'

/**
 * Repository interface (port) for folder persistence operations
 * Defines the contract that infrastructure adapters must implement
 * Following Repository pattern and Dependency Inversion Principle
 */
export interface IFolderRepository {
  /** Retrieve all folders ordered by name */
  findAll(): Promise<FolderEntity[]>

  /** Find folder by ID, returns null if not found */
  findById(id: string): Promise<FolderEntity | null>

  /** Find folders by parent ID (null for root folders) */
  findByParentId(parentId: string | null): Promise<FolderEntity[]>

  /** Find immediate children of a folder */
  findChildren(parentId: string): Promise<FolderEntity[]>

  /** Build complete folder tree with nested children */
  buildTree(): Promise<FolderWithChildren[]>

  /** Search folders by name (case-insensitive) */
  search(query: string): Promise<FolderEntity[]>

  /** Create a new folder */
  create(data: Omit<FolderEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FolderEntity>

  /** Update folder properties */
  update(id: string, data: Partial<Omit<FolderEntity, 'id'>>): Promise<FolderEntity>

  /** Delete folder (cascades to children and files) */
  delete(id: string): Promise<void>
}
