/**
 * Composable for managing tree view expansion state
 * 
 * This composable provides reactive state and methods for tracking which
 * folders in the tree view are expanded or collapsed.
 * 
 * @module useTreeState
 */

import { ref, type Ref } from 'vue'
import type { FolderNode } from '../types'

/**
 * Composable function that provides state and methods for tree view expansion management
 * 
 * @returns Object containing reactive state and methods for tree expansion
 */
export function useTreeState() {
  /** Reactive reference to a set of expanded folder IDs */
  const expandedFolders: Ref<Set<string>> = ref(new Set())

  /**
   * Toggles the expansion state of a folder
   * 
   * If the folder is expanded, it will be collapsed; if collapsed, it will be expanded.
   * 
   * @param folderId - ID of the folder to toggle
   */
  function toggleFolder(folderId: string) {
    if (expandedFolders.value.has(folderId)) {
      expandedFolders.value.delete(folderId)
    } else {
      expandedFolders.value.add(folderId)
    }
    // Trigger reactivity
    expandedFolders.value = new Set(expandedFolders.value)
  }

  /**
   * Expands a folder in the tree view
   * 
   * @param folderId - ID of the folder to expand
   */
  function expandFolder(folderId: string) {
    expandedFolders.value.add(folderId)
    expandedFolders.value = new Set(expandedFolders.value)
  }

  /**
   * Collapses a folder in the tree view
   * 
   * @param folderId - ID of the folder to collapse
   */
  function collapseFolder(folderId: string) {
    expandedFolders.value.delete(folderId)
    expandedFolders.value = new Set(expandedFolders.value)
  }

  /**
   * Checks if a folder is currently expanded
   * 
   * @param folderId - ID of the folder to check
   * @returns True if the folder is expanded, false otherwise
   */
  function isExpanded(folderId: string): boolean {
    return expandedFolders.value.has(folderId)
  }

  /**
   * Expands all folders in the provided tree structure
   * 
   * @param folders - Array of folder nodes to expand recursively
   */
  function expandAll(folders: FolderNode[]) {
    folders.forEach(folder => {
      expandedFolders.value.add(folder.id)
      if (folder.children && folder.children.length > 0) {
        expandAll(folder.children)
      }
    })
    expandedFolders.value = new Set(expandedFolders.value)
  }

  /**
   * Collapses all folders in the tree view
   */
  function collapseAll() {
    expandedFolders.value.clear()
    expandedFolders.value = new Set(expandedFolders.value)
  }

  return {
    expandedFolders,
    toggleFolder,
    expandFolder,
    collapseFolder,
    isExpanded,
    expandAll,
    collapseAll,
  }
}