import { prisma } from '../prisma'
import { IFileRepository } from '../../../domain/repositories/IFileRepository'
import { FileEntity } from '../../../domain/entities/File'
import { DatabaseError, NotFoundError } from '../../../domain/errors'

/**
 * Prisma implementation (adapter) of IFileRepository
 * Handles file persistence using Prisma ORM and PostgreSQL
 * Part of Infrastructure layer in Clean Architecture
 */
export class FileRepository implements IFileRepository {
  async findAll(): Promise<FileEntity[]> {
    try {
      return await prisma.file.findMany({
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch files: ${error}`)
    }
  }

  async findById(id: string): Promise<FileEntity | null> {
    try {
      return await prisma.file.findUnique({ where: { id } })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch file: ${error}`)
    }
  }

  async findByFolderId(folderId: string): Promise<FileEntity[]> {
    try {
      return await prisma.file.findMany({
        where: { folderId },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch files by folder: ${error}`)
    }
  }

  async search(query: string): Promise<FileEntity[]> {
    try {
      return await prisma.file.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      throw new DatabaseError(`Failed to search files: ${error}`)
    }
  }

  async create(data: Omit<FileEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FileEntity> {
    try {
      return await prisma.file.create({ data })
    } catch (error) {
      throw new DatabaseError(`Failed to create file: ${error}`)
    }
  }

  async update(id: string, data: Partial<Omit<FileEntity, 'id'>>): Promise<FileEntity> {
    try {
      const file = await this.findById(id)
      if (!file) {
        throw new NotFoundError(`File with id ${id} not found`)
      }

      return await prisma.file.update({
        where: { id },
        data,
      })
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to update file: ${error}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const file = await this.findById(id)
      if (!file) {
        throw new NotFoundError(`File with id ${id} not found`)
      }

      await prisma.file.delete({ where: { id } })
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to delete file: ${error}`)
    }
  }
}
