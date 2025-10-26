import { describe, it, expect, beforeEach } from 'bun:test'
import { FolderRepository } from '../../src/infrastructure/database/repositories/FolderRepository'

describe('FolderRepository', () => {
  let repository: FolderRepository

  beforeEach(() => {
    repository = new FolderRepository()
  })

  it('should find all folders', async () => {
    const folders = await repository.findAll()
    expect(folders).toBeDefined()
    expect(Array.isArray(folders)).toBe(true)
    expect(folders.length).toBeGreaterThan(0)
  })

  it('should find folder by id', async () => {
    const allFolders = await repository.findAll()
    const firstFolder = allFolders[0]

    const folder = await repository.findById(firstFolder.id)
    expect(folder).toBeDefined()
    expect(folder?.id).toBe(firstFolder.id)
    expect(folder?.name).toBe(firstFolder.name)
  })

  it('should return null for non-existent folder', async () => {
    const folder = await repository.findById('non-existent-id')
    expect(folder).toBeNull()
  })

  it('should find root folders', async () => {
    const rootFolders = await repository.findByParentId(null)
    expect(rootFolders).toBeDefined()
    expect(rootFolders.length).toBeGreaterThan(0)
    rootFolders.forEach((folder) => {
      expect(folder.parentId).toBeNull()
    })
  })

  it('should build folder tree', async () => {
    const tree = await repository.buildTree()
    expect(tree).toBeDefined()
    expect(Array.isArray(tree)).toBe(true)
    expect(tree.length).toBeGreaterThan(0)

    // Check that root folders have level 0
    tree.forEach((root) => {
      expect(root.level).toBe(0)
      expect(root.parentId).toBeNull()

      // Check children have correct level
      if (root.children.length > 0) {
        root.children.forEach((child) => {
          expect(child.level).toBe(1)
        })
      }
    })
  })

  it('should search folders by name', async () => {
    const results = await repository.search('work')
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)

    if (results.length > 0) {
      results.forEach((folder) => {
        expect(folder.name.toLowerCase()).toContain('work')
      })
    }
  })

  it('should create a new folder', async () => {
    const newFolder = await repository.create({
      name: 'Test Folder',
      parentId: null,
    })

    expect(newFolder).toBeDefined()
    expect(newFolder.id).toBeDefined()
    expect(newFolder.name).toBe('Test Folder')
    expect(newFolder.parentId).toBeNull()

    // Cleanup
    await repository.delete(newFolder.id)
  })

  it('should update a folder', async () => {
    // Create a test folder
    const folder = await repository.create({
      name: 'Original Name',
      parentId: null,
    })

    // Update it
    const updated = await repository.update(folder.id, {
      name: 'Updated Name',
    })

    expect(updated.name).toBe('Updated Name')
    expect(updated.id).toBe(folder.id)

    // Cleanup
    await repository.delete(folder.id)
  })

  it('should delete a folder', async () => {
    // Create a test folder
    const folder = await repository.create({
      name: 'To Be Deleted',
      parentId: null,
    })

    // Delete it
    await repository.delete(folder.id)

    // Verify it's gone
    const deleted = await repository.findById(folder.id)
    expect(deleted).toBeNull()
  })
})
