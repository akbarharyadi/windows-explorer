import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFolders } from '../../src/composables/useFolders'
import * as apiModule from '../../src/services/api'

// Mock the entire api module
vi.mock('../../src/services/api', () => {
  return {
    api: {
      getFolderTree: vi.fn(),
      getFolderChildren: vi.fn(),
      createFolder: vi.fn(),
      search: vi.fn(),
      deleteItem: vi.fn(),
      uploadFile: vi.fn(),
      moveItem: vi.fn(),
    },
  }
})

// Get the mocked api
const mockedApi = apiModule.api

describe('useFolders Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads folder tree', async () => {
    const mockTree = [
      {
        id: '1',
        name: 'Test',
        parentId: null,
        children: [],
        level: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockedApi.getFolderTree.mockResolvedValue(mockTree)

    const { folderTree, loadFolderTree, loading } = useFolders()

    expect(loading.value).toBe(false)
    await loadFolderTree()

    expect(loading.value).toBe(false)
    expect(folderTree.value).toEqual(mockTree)
  })

  it('creates a new folder', async () => {
    const newFolder = {
      id: '3',
      name: 'New Folder',
      parentId: null,
      children: [],
      level: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // API returns { folder, eventId }, not just the folder
    mockedApi.createFolder.mockResolvedValue({
      folder: newFolder,
      eventId: 'event-123',
    })

    const { folderTree, createNewFolder } = useFolders()
    await createNewFolder('New Folder', null)

    expect(folderTree.value).toContainEqual(newFolder)
  })

  it('selects folder and loads children', async () => {
    const mockFolder = {
      id: '1',
      name: 'Test Folder',
      parentId: null,
      children: [],
      level: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockChildren = {
      folders: [],
      files: [],
    }

    mockedApi.getFolderChildren.mockResolvedValue(mockChildren)

    const { selectedFolder, folderChildren, selectFolder } = useFolders()
    await selectFolder(mockFolder)

    expect(selectedFolder.value).toEqual(mockFolder)
    expect(folderChildren.value).toEqual(mockChildren)
  })
})
