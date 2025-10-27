import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FolderTree from '../../src/components/FolderTree.vue'
import TreeNode from '../../src/components/TreeNode.vue'
import type { FolderNode } from '../../src/types'

describe('FolderTree.vue', () => {
  const mockFolder: FolderNode = {
    id: '1',
    name: 'Test Folder',
    parentId: null,
    level: 0,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockFolders: FolderNode[] = [mockFolder]

  it('renders properly with folders', () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: mockFolders,
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: false
      }
    })

    expect(wrapper.find('.folder-tree-header').text()).toContain('Folders')
    expect(wrapper.findComponent(TreeNode).exists()).toBe(true)
  })

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: mockFolders,
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: true
      }
    })

    expect(wrapper.text()).toContain('Loading folders...')
  })

  it('shows empty state when no folders exist', () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: [],
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: false
      }
    })

    expect(wrapper.text()).toContain('No folders found')
  })

  it('emits toggle event when TreeNode emits toggle', async () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: mockFolders,
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: false
      }
    })

    // Find the TreeNode component and emit the toggle event
    const treeNode = wrapper.findComponent(TreeNode)
    await treeNode.vm.$emit('toggle', '1')
    
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('toggle')?.[0]).toEqual(['1'])
  })

  it('emits select event when TreeNode emits select', async () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: mockFolders,
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: false
      }
    })

    const treeNode = wrapper.findComponent(TreeNode)
    await treeNode.vm.$emit('select', mockFolder)
    
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')?.[0]).toEqual([mockFolder])
  })

  it('emits expandAll event when expand all button is clicked', async () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: mockFolders,
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: false
      }
    })

    await wrapper.find('.tree-actions button:first-child').trigger('click')
    
    expect(wrapper.emitted('expandAll')).toHaveLength(1)
  })

  it('emits collapseAll event when collapse all button is clicked', async () => {
    const wrapper = mount(FolderTree, {
      props: {
        folders: mockFolders,
        expandedFolders: new Set(),
        selectedFolderId: null,
        loading: false
      }
    })

    await wrapper.find('.tree-actions button:last-child').trigger('click')
    
    expect(wrapper.emitted('collapseAll')).toHaveLength(1)
  })
})