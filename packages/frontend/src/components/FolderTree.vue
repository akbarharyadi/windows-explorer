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

    <!-- Pending events section (optimistic UI) -->
    <div v-if="pendingEvents && pendingEvents.size > 0" class="pending-events">
      <div class="pending-events-header">
        <span>Processing...</span>
      </div>
      <div
        v-for="[eventId, event] in pendingEvents"
        :key="eventId"
        :class="['pending-event', `status-${event.status}`]"
      >
        <span class="pending-icon">
          <span v-if="event.status === 'pending'">⏳</span>
          <span v-else-if="event.status === 'processing'">🔄</span>
          <span v-else-if="event.status === 'completed'">✅</span>
          <span v-else-if="event.status === 'failed'">❌</span>
        </span>
        <span class="pending-name">{{ event.entityName }}</span>
        <span class="pending-status">{{ event.status }}</span>
        <span v-if="event.error" class="pending-error" :title="event.error">⚠️</span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading folders...
    </div>

    <div v-else-if="folders.length === 0 && (!pendingEvents || pendingEvents.size === 0)" class="empty">
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
import type { EventStatus } from '@window-explorer/shared'

/** Pending event for optimistic UI */
interface PendingEvent {
  eventId: string
  status: EventStatus
  entityId?: string
  error?: string
  entityType?: string
  entityName?: string
}

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
  /** Map of pending events for optimistic UI */
  pendingEvents?: Map<string, PendingEvent>
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

/* Pending events section */
.pending-events {
  border-bottom: 1px solid #ddd;
  background: #f9f9f9;
  padding: 8px;
}

.pending-events-header {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pending-event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.pending-event.status-pending {
  background: #fff3cd;
  border-left: 3px solid #ffc107;
}

.pending-event.status-processing {
  background: #d1ecf1;
  border-left: 3px solid #17a2b8;
}

.pending-event.status-completed {
  background: #d4edda;
  border-left: 3px solid #28a745;
  animation: fadeOut 1s ease 0.5s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(10px);
  }
}

.pending-event.status-failed {
  background: #f8d7da;
  border-left: 3px solid #dc3545;
}

.pending-icon {
  font-size: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-processing .pending-icon {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pending-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.pending-status {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pending-error {
  color: #dc3545;
  font-size: 14px;
  cursor: help;
}
</style>