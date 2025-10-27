<template>
  <div class="folder-tree">
    <div class="folder-tree-header">
      <h2>Folders</h2>
      <div class="tree-actions">
        <button @click="emit('createFolder')" class="create-folder-btn" title="New Folder">➕</button>
        <button @click="emit('expandAll')" title="Expand All">▼</button>
        <button @click="emit('collapseAll')" title="Collapse All">▶</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading folders...
    </div>

    <div v-else-if="folders.length === 0" class="empty">
      No folders found
    </div>

    <div v-else class="tree-content">
      <TreeNode
        v-for="folder in folders"
        :key="folder.id"
        :folder="folder"
        :level="0"
        :is-expanded="isExpanded(folder.id)"
        :is-selected="isSelected(folder.id)"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
        @contextmenu="(event, folder) => emit('contextmenu', event, folder)"
        @dblclick="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Folder Tree component for displaying hierarchical folder structure
 * 
 * This component renders the folder tree with expand/collapse functionality
 * and selection support. It uses TreeNode components recursively to render
 * the hierarchical structure.
 */

import TreeNode from './TreeNode.vue'
import type { FolderNode } from '../types'

/** Props interface for FolderTree component */
interface Props {
  /** Array of root-level folders to display */
  folders: FolderNode[]
  /** Set of folder IDs that are currently expanded */
  expandedFolders: Set<string>
  /** ID of the currently selected folder */
  selectedFolderId: string | null
  /** Whether the component is currently loading */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

/** Emits interface defining events that the component can emit */
const emit = defineEmits<{
  /** Emitted when a folder's expansion state is toggled */
  toggle: [folderId: string]
  /** Emitted when a folder is selected */
  select: [folder: FolderNode]
  /** Emitted when user clicks 'Expand All' */
  expandAll: []
  /** Emitted when user clicks 'Collapse All' */
  collapseAll: []
  /** Emitted when context menu is requested for a folder */
  contextmenu: [event: MouseEvent, folder: FolderNode]
  /** Emitted when user wants to create a new folder */
  createFolder: []
}>()

/**
 * Checks if a folder is currently expanded
 * 
 * @param folderId - ID of the folder to check
 * @returns True if the folder is expanded, false otherwise
 */
function isExpanded(folderId: string): boolean {
  return props.expandedFolders.has(folderId)
}

/**
 * Checks if a folder is currently selected
 * 
 * @param folderId - ID of the folder to check
 * @returns True if the folder is selected, false otherwise
 */
function isSelected(folderId: string): boolean {
  return props.selectedFolderId === folderId
}
</script>

<style scoped>
.folder-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  border-right: 1px solid #ddd;
}

.folder-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.folder-tree-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.tree-actions {
  display: flex;
  gap: 8px;
}

.tree-actions button {
  padding: 4px 8px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.tree-actions button:hover {
  background: #e0e0e0;
}

.create-folder-btn {
  background: #4caf50 !important;
  font-size: 14px;
}

.create-folder-btn:hover {
  background: #45a049 !important;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading,
.empty {
  padding: 16px;
  text-align: center;
  color: #666;
}
</style>