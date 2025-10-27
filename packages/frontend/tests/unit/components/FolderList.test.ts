import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FolderList from '../../src/components/FolderList.vue'
import type { FolderNode, FileItem, FolderChildren } from '../../src/types'

describe('FolderList.vue', () => {
  const mockFolder: FolderNode = {
    id: '1',
    name: 'Test Folder',
    parentId: null,
    level: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockFile: FileItem = {
    id: '1',
    name: 'test.txt',
    folderId: '1',
    size: 1024,
    mimeType: 'text/plain',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockChildren: FolderChildren = {
    folders: [mockFolder],
    files: [mockFile]
  }

  it('renders properly with children', () => {
    const wrapper = mount(FolderList, {
      props: {
        selectedFolder: mockFolder,
        children: mockChildren,
        loading: false
      }
    })

    expect(wrapper.text()).toContain('Test Folder')
    expect(wrapper.text()).toContain('test.txt')
  })

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(FolderList, {
      props: {
        selectedFolder: mockFolder,
        children: mockChildren,
        loading: true
      }
    })

    expect(wrapper.text()).toContain('Loading contents...')
  })

  it('emits selectFolder event when folder is double clicked', async () => {
    const wrapper = mount(FolderList, {
      props: {
        selectedFolder: mockFolder,
        children: mockChildren,
        loading: false
      }
    })

    await wrapper.find('.folder-item').trigger('dblclick')
    
    expect(wrapper.emitted('selectFolder')).toHaveLength(1)
    expect(wrapper.emitted('selectFolder')?.[0]).toEqual([mockFolder])
  })

  it('formats file size correctly', () => {
    const wrapper = mount(FolderList, {
      props: {
        selectedFolder: mockFolder,
        children: mockChildren,
        loading: false
      }
    })

    // The component formats 1024 bytes as "1.0 KB"
    expect(wrapper.text()).toContain('1.0 KB')
  })

  it('emits moveItem event on drag and drop', async () => {
    // Mock the drag and drop data
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(JSON.stringify({ id: '1', type: 'file', name: 'test.txt' }))
    } as unknown as DataTransfer

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer
    } as DragEvent

    const wrapper = mount(FolderList, {
      props: {
        selectedFolder: mockFolder,
        children: mockChildren,
        loading: false
      }
    })

    // Trigger drop event
    const folderItem = wrapper.find('.folder-item')
    await folderItem.trigger('drop', mockEvent)

    expect(wrapper.emitted('moveItem')).toHaveLength(1)
    expect(wrapper.emitted('moveItem')?.[0]).toEqual(['1', 'file', '1'])
  })
})