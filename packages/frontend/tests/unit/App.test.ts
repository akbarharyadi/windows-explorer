import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createApp } from 'vue'
import App from '../../src/App.vue'
import { useFolders } from '../../src/composables/useFolders'

// Mock the composables
vi.mock('../../src/composables/useFolders', () => ({
  useFolders: vi.fn()
}))

vi.mock('../../src/composables/useTreeState', () => ({
  useTreeState: vi.fn(() => ({
    expandedFolders: new Set(),
    toggleFolder: vi.fn(),
    isExpanded: vi.fn(() => false),
    expandAll: vi.fn(),
    collapseAll: vi.fn()
  }))
}))

vi.mock('../../src/composables/useSearch', () => ({
  useSearch: vi.fn(() => ({
    searchQuery: { value: '' },
    searchResults: { value: null },
    searching: { value: false },
    searchError: { value: null },
    performSearch: vi.fn(),
    clearSearch: vi.fn()
  }))
}))

vi.mock('../../src/composables/useDragAndDrop', () => ({
  useDragAndDrop: vi.fn(() => ({
    handleDrop: vi.fn()
  }))
}))

vi.mock('../../src/services/api', () => ({
  api: {
    moveItem: vi.fn().mockResolvedValue(true)
  }
}))

describe('App.vue', () => {
  const mockFolderTree = [
    {
      id: '1',
      name: 'Test Folder',
      parentId: null,
      level: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Mock the useFolders composable
    (useFolders as vi.Mock).mockReturnValue({
      folderTree: { value: mockFolderTree },
      selectedFolder: { value: null },
      folderChildren: { value: null },
      loading: { value: false },
      error: { value: null },
      loadFolderTree: vi.fn().mockResolvedValue(undefined),
      selectFolder: vi.fn(),
      createNewFolder: vi.fn(),
      deleteItem: vi.fn()
    })
  })

  it('renders properly', async () => {
    const wrapper = mount(App)
    await flushPromises() // Wait for async operations
    
    expect(wrapper.find('.app-header h1').text()).toBe('📁 Windows Explorer')
    expect(wrapper.find('.search-bar').exists()).toBe(true)
  })

  it('loads folder tree on mount', async () => {
    const mockLoadFolderTree = vi.fn().mockResolvedValue(undefined)
    (useFolders as vi.Mock).mockReturnValue({
      folderTree: { value: mockFolderTree },
      selectedFolder: { value: null },
      folderChildren: { value: null },
      loading: { value: false },
      error: { value: null },
      loadFolderTree: mockLoadFolderTree,
      selectFolder: vi.fn(),
      createNewFolder: vi.fn(),
      deleteItem: vi.fn()
    })

    mount(App)
    await flushPromises()
    
    expect(mockLoadFolderTree).toHaveBeenCalledTimes(1)
  })

  it('handles folder selection', async () => {
    const mockSelectFolder = vi.fn()
    const mockClearSearch = vi.fn()
    
    (useFolders as vi.Mock).mockReturnValue({
      folderTree: { value: mockFolderTree },
      selectedFolder: { value: null },
      folderChildren: { value: null },
      loading: { value: false },
      error: { value: null },
      loadFolderTree: vi.fn().mockResolvedValue(undefined),
      selectFolder: mockSelectFolder,
      createNewFolder: vi.fn(),
      deleteItem: vi.fn(),
    })
    
    // Mock the useSearch composable
    vi.mocked('../../src/composables/useSearch').useSearch = vi.fn(() => ({
      searchQuery: { value: 'test' },
      searchResults: { value: null },
      searching: { value: false },
      searchError: { value: null },
      performSearch: vi.fn(),
      clearSearch: mockClearSearch
    }))

    const wrapper = mount(App)
    await flushPromises()

    // Simulate folder selection (this would typically come from FolderTree)
    const appVm = wrapper.vm as any
    await appVm.handleSelectFolder(mockFolderTree[0])

    expect(mockSelectFolder).toHaveBeenCalledWith(mockFolderTree[0])
    expect(mockClearSearch).toHaveBeenCalledTimes(1)
  })

  it('handles search', async () => {
    const mockPerformSearch = vi.fn()
    
    // Mock the useSearch composable
    vi.mocked('../../src/composables/useSearch').useSearch = vi.fn(() => ({
      searchQuery: { value: 'test' },
      searchResults: { value: null },
      searching: { value: false },
      searchError: { value: null },
      performSearch: mockPerformSearch,
      clearSearch: vi.fn()
    }))

    const wrapper = mount(App)
    await flushPromises()

    // Simulate search (this would typically come from SearchBar)
    const appVm = wrapper.vm as any
    await appVm.handleSearch()

    expect(mockPerformSearch).toHaveBeenCalledTimes(1)
  })
})