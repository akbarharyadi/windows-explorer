import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeNode from '../../src/components/TreeNode.vue'
import type { FolderNode } from '../../src/types'

describe('TreeNode.vue', () => {
  const mockFolder: FolderNode = {
    id: '1',
    name: 'Test Folder',
    parentId: null,
    level: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('renders folder name properly', () => {
    const wrapper = mount(TreeNode, {
      props: {
        folder: mockFolder,
        isExpanded: false,
        isSelected: false
      }
    })
    expect(wrapper.text()).toContain('Test Folder')
  })

  it('emits toggle event when expand icon is clicked', async () => {
    const folderWithChildren = {
      ...mockFolder,
      children: [{...mockFolder, id: '2', name: 'Child Folder'}]
    }
    
    const wrapper = mount(TreeNode, {
      props: {
        folder: folderWithChildren,
        isExpanded: false,
        isSelected: false
      }
    })

    await wrapper.find('.expand-icon').trigger('click')
    
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('toggle')?.[0]).toEqual(['1'])
  })

  it('emits select event when node is clicked', async () => {
    const wrapper = mount(TreeNode, {
      props: {
        folder: mockFolder,
        isExpanded: false,
        isSelected: false
      }
    })

    await wrapper.find('.tree-node-content').trigger('click')
    
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')?.[0]).toEqual([mockFolder])
  })

  it('shows expand icon for folders with children', () => {
    const folderWithChildren = {
      ...mockFolder,
      children: [{...mockFolder, id: '2', name: 'Child Folder'}]
    }
    
    const wrapper = mount(TreeNode, {
      props: {
        folder: folderWithChildren,
        isExpanded: false,
        isSelected: false
      }
    })

    expect(wrapper.find('.expand-icon').exists()).toBe(true)
    expect(wrapper.find('.expand-icon-placeholder').exists()).toBe(false)
  })

  it('shows placeholder for folders without children', () => {
    const wrapper = mount(TreeNode, {
      props: {
        folder: mockFolder,
        isExpanded: false,
        isSelected: false
      }
    })

    expect(wrapper.find('.expand-icon').exists()).toBe(false)
    expect(wrapper.find('.expand-icon-placeholder').exists()).toBe(true)
  })
})