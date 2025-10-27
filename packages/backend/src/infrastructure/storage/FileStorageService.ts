import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

/**
 * Service for handling file storage operations on disk
 * Stores files in the uploads directory organized by date
 */
export class FileStorageService {
  private readonly uploadsDir: string

  constructor(uploadsDir: string = 'uploads') {
    this.uploadsDir = uploadsDir
  }

  /**
   * Initialize the uploads directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (!existsSync(this.uploadsDir)) {
      await mkdir(this.uploadsDir, { recursive: true })
    }
  }

  /**
   * Save a file to disk and return the file path
   * @param file - The file object from the request
   * @param originalName - Original filename
   * @returns The relative path where the file was stored
   */
  async saveFile(file: File, originalName: string): Promise<string> {
    // Ensure uploads directory exists
    await this.initialize()

    // Create a date-based folder structure (e.g., uploads/2025/10/27)
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    const dateFolder = join(this.uploadsDir, year, month, day)

    // Create the date folder if it doesn't exist
    if (!existsSync(dateFolder)) {
      await mkdir(dateFolder, { recursive: true })
    }

    // Generate a unique filename to prevent collisions
    const fileExtension = originalName.split('.').pop() || ''
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    const filePath = join(dateFolder, uniqueFilename)

    // Convert File to ArrayBuffer and save
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

    // Return relative path from project root
    return filePath
  }

  /**
   * Delete a file from disk
   * @param filePath - The path to the file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
  }

  /**
   * Read a file from disk
   * @param filePath - The path to the file to read
   * @returns The file buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    return await readFile(filePath)
  }

  /**
   * Check if a file exists
   * @param filePath - The path to check
   * @returns True if the file exists
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath)
  }
}
