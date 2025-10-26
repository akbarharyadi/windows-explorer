import { prisma } from '../prisma'
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository'
import { FolderEntity, FolderWithChildren } from '../../../domain/entities/Folder'
import { DatabaseError, NotFoundError } from '../../../domain/errors'

/**
 * Prisma implementation (adapter) of IFolderRepository
 * Handles folder persistence using Prisma ORM and PostgreSQL
 * Part of Infrastructure layer in Clean Architecture
 */
export class FolderRepository implements IFolderRepository {
  async findAll(): Promise<FolderEntity[]> {
    try {
      return await prisma.folder.findMany({
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch folders: ${error}`)
    }
  }

  async findById(id: string): Promise<FolderEntity | null> {
    try {
      return await prisma.folder.findUnique({ where: { id } })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch folder: ${error}`)
    }
  }

  async findByParentId(parentId: string | null): Promise<FolderEntity[]> {
    try {
      return await prisma.folder.findMany({
        where: { parentId },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch folders by parent: ${error}`)
    }
  }

  async findChildren(parentId: string): Promise<FolderEntity[]> {
    try {
      return await prisma.folder.findMany({
        where: { parentId },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch children: ${error}`)
    }
  }

  async buildTree(): Promise<FolderWithChildren[]> {
    try {
      const allFolders = await this.findAll()

      // Build a map for quick lookup
      const folderMap = new Map<string, FolderWithChildren>()

      allFolders.forEach((folder) => {
        folderMap.set(folder.id, { ...folder, children: [], level: 0 })
      })

      const rootFolders: FolderWithChildren[] = []

      // Build the tree structure
      allFolders.forEach((folder) => {
        const currentFolder = folderMap.get(folder.id)!

        if (folder.parentId === null) {
          rootFolders.push(currentFolder)
        } else {
          const parent = folderMap.get(folder.parentId)
          if (parent) {
            currentFolder.level = parent.level + 1
            parent.children.push(currentFolder)
          }
        }
      })

      return rootFolders
    } catch (error) {
      throw new DatabaseError(`Failed to build folder tree: ${error}`)
    }
  }

  async search(query: string): Promise<FolderEntity[]> {
    try {
      return await prisma.folder.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to search folders: ${error}`)
    }
  }

  async create(data: Omit<FolderEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FolderEntity> {
    try {
      return await prisma.folder.create({ data })
    } catch (error) {
      throw new DatabaseError(`Failed to create folder: ${error}`)
    }
  }

  async update(id: string, data: Partial<Omit<FolderEntity, 'id'>>): Promise<FolderEntity> {
    try {
      const folder = await this.findById(id)
      if (!folder) {
        throw new NotFoundError(`Folder with id ${id} not found`)
      }

      return await prisma.folder.update({
        where: { id },
        data,
      })
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to update folder: ${error}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const folder = await this.findById(id)
      if (!folder) {
        throw new NotFoundError(`Folder with id ${id} not found`)
      }

      await prisma.folder.delete({ where: { id } })
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to delete folder: ${error}`)
    }
  }
}
