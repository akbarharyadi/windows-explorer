<template>
  <div class="app">
    <!-- Notification Toast -->
    <NotificationToast />

    <header class="app-header">
      <h1>📁 Windows Explorer</h1>
      <SearchBar
        v-model="searchQuery"
        :searching="searching"
        @search="handleSearch"
        @clear="clearSearch"
      />
    </header>

    <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

    <div v-if="searchError" class="error-banner">⚠️ {{ searchError }}</div>

    <!-- Search Results -->
    <div v-if="searchResults" class="search-results">
      <div class="search-results-header">
        <h3>Search Results for "{{ searchQuery }}"</h3>
        <button @click="clearSearch">✕ Close</button>
      </div>
      <div class="search-results-content">
        <div v-if="searchResults.folders.length > 0" class="result-section">
          <h4>Folders ({{ searchResults.folders.length }})</h4>
          <div
            v-for="folder in searchResults.folders"
            :key="folder.id"
            class="result-item"
            @click="handleSelectFolder(folder)"
          >
            📁 {{ folder.name }}
          </div>
        </div>
        <div v-if="searchResults.files.length > 0" class="result-section">
          <h4>Files ({{ searchResults.files.length }})</h4>
          <div v-for="file in searchResults.files" :key="file.id" class="result-item">
            📄 {{ file.name }}
          </div>
        </div>
        <div
          v-if="searchResults.folders.length === 0 && searchResults.files.length === 0"
          class="no-results"
        >
          No results found
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="app-content">
      <div class="left-panel">
        <FolderTree
          :folders="folderTree"
          :expanded-folders="expandedFolders"
          :selected-folder-id="selectedFolder?.id ?? null"
          :loading="loading"
          :pending-events="pendingEvents"
          @toggle="toggleFolder"
          @select="handleSelectFolder"
          @expand-all="handleExpandAll"
          @collapse-all="collapseAll"
          @contextmenu="showFolderContextMenu"
          @create-folder="showCreateFolderModal = true"
        />
      </div>
      <div class="right-panel">
        <FolderList
          :selected-folder="selectedFolder"
          :children="folderChildren"
          :loading="loading"
          @select-folder="handleSelectFolder"
          @contextmenu="showItemContextMenu"
          @move-item="handleMoveItem"
          @create-folder="showCreateFolderModal = true"
        />
        <FileUpload
          v-if="selectedFolder"
          :current-folder-id="selectedFolder.id"
          @file-uploaded="refreshCurrentFolder"
        />
      </div>
    </div>

    <!-- Context Menu -->
    <ContextMenu
      :menu-items="contextMenuItems"
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      @close="contextMenuVisible = false"
    />

    <!-- Create Folder Modal -->
    <CreateFolderModal
      :show="showCreateFolderModal"
      title="Create New Folder"
      placeholder-text="Enter folder name..."
      @close="showCreateFolderModal = false"
      @submit="createNewFolder"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Main application component for the Window Explorer frontend
 * 
 * This component orchestrates all the major UI sections including folder tree,
 * file list, search functionality, and modals. It manages the state and
 * communication between different parts of the application.
 */

import { onMounted, ref, computed } from 'vue'
import FolderTree from './components/FolderTree.vue'
import FolderList from './components/FolderList.vue'
import SearchBar from './components/SearchBar.vue'
import ContextMenu from './components/ContextMenu.vue'
import CreateFolderModal from './components/CreateFolderModal.vue'
import FileUpload from './components/FileUpload.vue'
import NotificationToast from './components/NotificationToast.vue'
import { useFolders } from './composables/useFolders'
import { useTreeState } from './composables/useTreeState'
import { useSearch } from './composables/useSearch'
import { useDragAndDrop } from './composables/useDragAndDrop'
import { useEventStatus } from './composables/useEventStatus'
import { useNotification } from './composables/useNotification'
import type { FolderNode, FileItem, ContextMenuItem } from './types'
import type { EventStatusUpdate } from '@window-explorer/shared'
import { EventStatus, getStatusIcon, getStatusMessage } from '@window-explorer/shared'
import { api } from './services/api'

// Use folder composable for state and operations
const {
  folderTree,
  selectedFolder,
  folderChildren,
  loading,
  error,
  loadFolderTree,
  selectFolder,
  createNewFolder: createFolder,
  deleteItem,
} = useFolders()

// Use tree state composable for managing folder expansion
const { expandedFolders, toggleFolder, isExpanded, expandAll, collapseAll } = useTreeState()

// Use search composable for search functionality
const { searchQuery, searchResults, searching, searchError, performSearch, clearSearch } =
  useSearch()

// Use drag and drop composable
const { handleDrop } = useDragAndDrop()

// Use event status composable for WebSocket tracking
const { trackEvent, trackedEvents } = useEventStatus()

// Use notification composable
const { success, error: notifyError } = useNotification()

// Pending events for optimistic UI (convert trackedEvents Map to reactive)
const pendingEvents = computed(() => trackedEvents.value)

// Context menu state
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuItems = ref<ContextMenuItem[]>([])
const contextMenuTarget = ref<{ item: FolderNode | FileItem; type: 'folder' | 'file' } | null>(null)

// Create folder modal state
const showCreateFolderModal = ref(false)

// Load the folder tree when the component is mounted
onMounted(async () => {
  await loadFolderTree()
})

/**
 * Handles the selection of a folder
 * 
 * Selects the folder and clears any active search
 * 
 * @param folder - The folder to select
 */
function handleSelectFolder(folder: FolderNode) {
  selectFolder(folder)
  clearSearch()
}

/**
 * Handles the expand all action
 * 
 * Expands all folders in the tree view
 */
function handleExpandAll() {
  expandAll(folderTree.value)
}

/**
 * Handles the search action
 * 
 * Performs a search with the current query
 */
function handleSearch() {
  performSearch()
}

// Context menu handlers
/**
 * Shows the context menu for a folder
 * 
 * @param event - The context menu event
 * @param folder - The folder to show the menu for
 */
function showFolderContextMenu(event: MouseEvent, folder: FolderNode) {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuTarget.value = { item: folder, type: 'folder' }

  contextMenuItems.value = [
    {
      id: 'open',
      label: 'Open',
      action: () => handleSelectFolder(folder),
      icon: '📂',
    },
    {
      id: 'new-folder',
      label: 'New Folder',
      action: () => {
        showCreateFolderModal.value = true
      },
      icon: '📁',
    },
    {
      id: 'delete',
      label: 'Delete',
      action: () => deleteItem(folder.id, 'folder'),
      icon: '🗑️',
    },
  ]

  contextMenuVisible.value = true
}

/**
 * Shows the context menu for a folder or file
 * 
 * @param event - The context menu event
 * @param item - The folder or file to show the menu for
 * @param type - The type of item ('folder' or 'file')
 */
function showItemContextMenu(
  event: MouseEvent,
  item: FolderNode | FileItem,
  type: 'folder' | 'file',
) {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuTarget.value = { item, type }

  const menuItems: ContextMenuItem[] = [
    {
      id: 'properties',
      label: 'Properties',
      action: () => {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${item.name}`)
      },
      icon: 'ℹ️',
    },
  ]

  if (type === 'folder') {
    menuItems.push({
      id: 'open',
      label: 'Open',
      action: () => handleSelectFolder(item as FolderNode),
      icon: '📂',
    })
  }

  menuItems.push({
    id: 'delete',
    label: 'Delete',
    action: () => deleteItem(item.id, type),
    icon: '🗑️',
  })

  contextMenuItems.value = menuItems
  contextMenuVisible.value = true
}

/**
 * Handles the move operation for a folder or file
 * 
 * @param id - The ID of the item to move
 * @param type - The type of item ('folder' or 'file')
 * @param targetId - The ID of the target folder
 */
async function handleMoveItem(id: string, type: 'folder' | 'file', targetId: string) {
  try {
    await api.moveItem(id, type, targetId)
    // Refresh the view after moving
    if (selectedFolder.value) {
      await selectFolder(selectedFolder.value)
    }
  } catch (err) {
    console.error('Error moving item:', err)
    error.value = err instanceof Error ? err.message : 'Failed to move item'
  }
}

/**
 * Handles the creation of a new folder with real-time tracking
 *
 * @param name - The name of the new folder
 */
async function createNewFolder(name: string) {
  try {
    const parentId = selectedFolder.value?.id || null

    // Create folder - this now returns { folder, eventId }
    const result = await createFolder(name, parentId)

    if (!result) {
      throw new Error('Failed to create folder')
    }

    const { folder, eventId } = result

    // Track the event via WebSocket for real-time updates
    trackEvent(eventId, 'folder', folder.name, (statusUpdate: EventStatusUpdate) => {
      console.log(`Event ${eventId} status:`, statusUpdate.status)

      // Handle status updates
      if (statusUpdate.status === EventStatus.COMPLETED) {
        // Show success notification
        success(`Folder "${folder.name}" created successfully! ${getStatusIcon(EventStatus.COMPLETED)}`)

        // Refresh folder tree to ensure everything is synced
        setTimeout(() => {
          loadFolderTree()
        }, 500)
      } else if (statusUpdate.status === EventStatus.FAILED) {
        // Show error notification
        const errorMsg = statusUpdate.error || 'Unknown error'
        notifyError(`Failed to create folder "${folder.name}": ${errorMsg}`)
      }
    })

    // Close modal
    showCreateFolderModal.value = false

    // Show initial pending notification
    success(`Creating folder "${folder.name}"... ${getStatusIcon(EventStatus.PENDING)}`, 2000)

  } catch (err) {
    console.error('Error creating folder:', err)
    notifyError(err instanceof Error ? err.message : 'Failed to create folder')
  }
}

/**
 * Refreshes the current folder after a file upload
 * 
 * Reloads the selected folder and the folder tree
 */
async function refreshCurrentFolder() {
  console.log('🔄 Refreshing current folder after file upload...')
  if (selectedFolder.value) {
    await selectFolder(selectedFolder.value)
  }
  await loadFolderTree()
  console.log('✅ Folder refreshed')
}
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.app-header {
  background: #1976d2;
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.error-banner {
  padding: 12px 24px;
  background: #fff3cd;
  color: #856404;
  border-bottom: 1px solid #ffeaa7;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ddd;
}

.search-results-header h3 {
  margin: 0;
  font-size: 18px;
}

.search-results-header button {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.search-results-content {
  padding: 24px;
}

.result-section {
  margin-bottom: 32px;
}

.result-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #666;
}

.result-item {
  padding: 12px 16px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: #f0f0f0;
  border-color: #ccc;
}

.no-results {
  padding: 32px;
  text-align: center;
  color: #666;
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 300px;
  min-width: 200px;
  max-width: 500px;
  resize: horizontal;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
