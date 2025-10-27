<template>
  <div class="folder-list">
    <div class="folder-list-header">
      <h2>{{ selectedFolder ? selectedFolder.name : 'Select a folder' }}</h2>
      <div v-if="selectedFolder" class="header-actions">
        <button class="action-btn" @click="emit('createFolder')" title="New Folder">
          📁 New Folder
        </button>
        <button class="action-btn" @click="triggerFileUpload" title="Upload File">
          📤 Upload File
        </button>
        <input
          ref="fileInput"
          type="file"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="loading" key="loading" class="loading">
        <div class="spinner"></div>
        <span>Loading contents...</span>
      </div>

      <div v-else-if="!selectedFolder" key="no-folder" class="empty">
        Select a folder from the tree to view its contents
      </div>

      <div v-else-if="!hasContent" key="empty" class="empty">
        This folder is empty
      </div>

      <div v-else key="content" class="content-grid">
        <!-- Folders -->
        <div
          v-for="folder in children?.folders"
          :key="folder.id"
          class="grid-item folder-item"
          draggable="true"
          @dragstart="startDrag($event, folder, 'folder')"
          @dragover="allowDrop"
          @drop="drop($event, folder, 'folder')"
          @dblclick="emit('selectFolder', folder)"
          @contextmenu="showContextMenu($event, folder, 'folder')"
        >
          <div class="item-icon">📁</div>
          <div class="item-info">
            <div class="item-name">{{ folder.name }}</div>
            <div class="item-meta">Folder</div>
          </div>
        </div>

        <!-- Files -->
        <div
          v-for="file in children?.files"
          :key="file.id"
          class="grid-item file-item"
          draggable="true"
          @dragstart="startDrag($event, file, 'file')"
          @dragover="allowDrop"
          @drop="drop($event, file, 'file')"
          @click="openFilePreview(file)"
          @contextmenu="showContextMenu($event, file, 'file')"
          :title="getClickAction(file)"
        >
          <div class="item-icon">📄</div>
          <div class="item-info">
            <div class="item-name">{{ file.name }}</div>
            <div class="item-meta">{{ formatFileSize(file.size) }}</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- File Preview Modal -->
    <FilePreview
      :show="showPreview"
      :file-id="previewFile?.id || ''"
      :file-name="previewFile?.name || ''"
      :mimeType="previewFile?.mimeType || null"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FolderNode, FileItem, FolderChildren } from '../types'
import { api } from '../services/api'
import FilePreview from './FilePreview.vue'

interface Props {
  selectedFolder: FolderNode | null
  children: FolderChildren | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  selectFolder: [folder: FolderNode]
  contextmenu: [event: MouseEvent, item: FolderNode | FileItem, type: 'folder' | 'file']
  moveItem: [id: string, type: 'folder' | 'file', targetId: string]
  createFolder: []
  fileUploaded: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

// File preview state
const showPreview = ref(false)
const previewFile = ref<FileItem | null>(null)

const hasContent = computed(() => {
  return props.children && (props.children.folders.length > 0 || props.children.files.length > 0)
})

/**
 * Formats file size in bytes to human-readable format (B, KB, MB)
 * 
 * @param bytes - Size in bytes to format
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Formats a date to a localized string
 * 
 * @param date - Date object to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString()
}

/**
 * Handles the start of a drag operation for a folder or file
 * 
 * @param event - The drag event
 * @param item - The folder or file being dragged
 * @param type - The type of item ('folder' or 'file')
 */
function startDrag(event: DragEvent, item: FolderNode | FileItem, type: 'folder' | 'file') {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', item.id)
    event.dataTransfer.setData('application/x-folder-explorer-item', JSON.stringify({ id: item.id, type, name: item.name }))
  }
}

/**
 * Allows a drop operation by preventing the default behavior
 * 
 * @param event - The drag event
 */
function allowDrop(event: DragEvent) {
  event.preventDefault()
}

/**
 * Handles the drop operation when an item is dropped on a target
 * 
 * @param event - The drop event
 * @param targetItem - The target folder or file
 * @param targetType - The type of the target ('folder' or 'file')
 */
function drop(event: DragEvent, targetItem: FolderNode | FileItem, targetType: 'folder' | 'file') {
  event.preventDefault()
  
  const data = event.dataTransfer?.getData('application/x-folder-explorer-item')
  if (data) {
    try {
      const sourceItem = JSON.parse(data)
      // Only allow dropping on folders, not files
      if (targetType === 'folder') {
        emit('moveItem', sourceItem.id, sourceItem.type, targetItem.id)
      }
    } catch (e) {
      console.error('Error parsing drag data:', e)
    }
  }
}

/**
 * Shows the context menu for a folder or file
 * 
 * @param event - The context menu event
 * @param item - The folder or file to show context menu for
 * @param type - The type of item ('folder' or 'file')
 */
function showContextMenu(event: MouseEvent, item: FolderNode | FileItem, type: 'folder' | 'file') {
  event.preventDefault()
  emit('contextmenu', event, item, type)
}

/**
 * Downloads a file directly to the user's device
 * 
 * @param file - The file to download
 */
function downloadFile(file: FileItem) {
  // Create a download link
  const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/files/${file.id}/download`

  // Create a temporary link element and trigger download
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = file.name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Determines if a file can be previewed in the browser
 * 
 * @param file - The file to check
 * @returns True if the file can be previewed, false otherwise
 */
function isPreviewableFile(file: FileItem): boolean {
  const mime = file.mimeType?.toLowerCase() || ''
  const ext = file.name.toLowerCase().split('.').pop() || ''

  return (
    mime === 'application/pdf' || ext === 'pdf' ||  // PDF
    mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) ||  // Images
    mime.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'ts', 'html', 'css', 'py', 'java', 'c', 'cpp', 'sh'].includes(ext) ||  // Text files
    mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext) ||  // Video
    mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)  // Audio
  )
}

/**
 * Gets the appropriate tooltip text for a file based on whether it can be previewed
 * 
 * @param file - The file to get the action text for
 * @returns The appropriate tooltip text
 */
function getClickAction(file: FileItem): string {
  return isPreviewableFile(file) ? 'Click to preview' : 'Click to download'
}

/**
 * Opens a file preview modal for previewable files or downloads non-previewable files
 * 
 * @param file - The file to open preview for or download
 */
function openFilePreview(file: FileItem) {
  if (isPreviewableFile(file)) {
    // Show preview in modal
    previewFile.value = file
    showPreview.value = true
  } else {
    // Download the file directly
    downloadFile(file)
  }
}

/**
 * Triggers the file upload input to open the file selection dialog
 */
function triggerFileUpload() {
  fileInput.value?.click()
}

/**
 * Handles the file selection and upload when a file is chosen
 * 
 * @param event - The file input change event
 */
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file || !props.selectedFolder) {
    return
  }

  try {
    await api.uploadFile(file, props.selectedFolder.id)

    // Reset input
    input.value = ''

    // Notify parent to refresh
    emit('fileUploaded')

    alert(`File "${file.name}" uploaded successfully!`)
  } catch (error) {
    console.error('Upload error:', error)
    alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
</script>

<style scoped>
.folder-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.folder-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.folder-list-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #1976d2;
}

.action-btn:active {
  transform: translateY(1px);
}

.content-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  align-content: start;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.grid-item:hover {
  background: #f5f5f5;
  border-color: #ccc;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grid-item:active {
  transform: translateY(0);
}

.file-item:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  cursor: pointer;
}

.item-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.item-info {
  text-align: center;
  width: 100%;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  word-break: break-word;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: #666;
}

.loading,
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 12px;
}

/* Spinner animation */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Fade transition for smooth content loading */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Smooth grid item appearance */
.content-grid {
  animation: fadeInUp 0.4s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation for grid items */
.grid-item {
  animation: fadeIn 0.3s ease backwards;
}

.grid-item:nth-child(1) { animation-delay: 0.05s; }
.grid-item:nth-child(2) { animation-delay: 0.1s; }
.grid-item:nth-child(3) { animation-delay: 0.15s; }
.grid-item:nth-child(4) { animation-delay: 0.2s; }
.grid-item:nth-child(5) { animation-delay: 0.25s; }
.grid-item:nth-child(n+6) { animation-delay: 0.3s; }

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>