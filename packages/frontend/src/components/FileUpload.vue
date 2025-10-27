<template>
  <div class="file-upload-panel">
    <div class="upload-area" @dragover="handleDragOver" @drop="handleDrop" @click="triggerFileInput">
      <input
        ref="fileInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <p class="upload-text">Drag & drop files here or click to browse</p>
      </div>
    </div>

    <div v-if="uploads.length > 0" class="upload-queue">
      <div class="queue-header">
        <h3>Upload Queue</h3>
        <span class="queue-count">({{ uploads.length }})</span>
      </div>
      
      <div class="upload-list">
        <div
          v-for="upload in uploads"
          :key="upload.id"
          class="upload-item"
          :class="upload.status"
        >
          <div class="upload-info">
            <div class="upload-name">{{ upload.name }}</div>
            <div class="upload-meta">
              <span class="upload-size">{{ formatFileSize(upload.size) }}</span>
              <span class="upload-status">{{ upload.status }}</span>
            </div>
          </div>
          
          <div v-if="upload.status === 'uploading'" class="upload-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: upload.progress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ upload.progress }}%</span>
          </div>
          
          <div class="upload-actions">
            <button 
              v-if="upload.status !== 'uploading'" 
              class="remove-btn"
              @click="removeUpload(upload.id)"
              title="Remove from queue"
            >
              ✕
            </button>
            <button 
              v-else
              class="cancel-btn"
              @click="removeUpload(upload.id)"
              title="Cancel upload"
            >
              🗙
            </button>
          </div>
        </div>
      </div>
      
      <div class="queue-actions">
        <button 
          v-if="hasCompletedUploads" 
          class="clear-btn"
          @click="clearCompletedUploads"
        >
          Clear Completed
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * File Upload component for uploading files to a folder
 * 
 * This component provides a drag-and-drop interface for uploading files,
 * with visual feedback for upload progress and management of the upload queue.
 */

import { ref, computed } from 'vue'
import { useFileUpload } from '../composables/useFileUpload'
import type { FileUpload } from '../types'

/** Props interface for FileUpload component */
interface Props {
  /** ID of the current folder where files should be uploaded */
  currentFolderId: string
}

const props = defineProps<Props>()

/** Define emits for component events */
const emit = defineEmits<{
  /** Emitted when a file has been successfully uploaded */
  'file-uploaded': []
}>()

/** Composable for handling file upload operations */
const { uploads, addUpload, uploadFiles, removeUpload, clearCompletedUploads } = useFileUpload()
/** Reference to the file input element */
const fileInputRef = ref<HTMLInputElement | null>(null)

/** Check if there are any completed uploads to show the clear button */
const hasCompletedUploads = computed(() => {
  return uploads.value.some(upload => upload.status === 'success' || upload.status === 'error');
})

/**
 * Triggers the file input to open the file selection dialog
 */
function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

/**
 * Handles the selection of files through the file input
 *
 * @param event - The change event from the file input
 */
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    console.log('📤 Starting file upload...')
    await uploadFiles(target.files, props.currentFolderId, () => {
      // Emit event to parent to refresh folder view
      console.log('📤 Emitting file-uploaded event')
      emit('file-uploaded')
    })
    console.log('✅ All files uploaded')
  }
}

/**
 * Handles drag over events to allow dropping files
 *
 * @param event - The drag event
 */
function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

/**
 * Handles the drop of files onto the upload area
 *
 * @param event - The drop event
 */
async function handleDrop(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    console.log('📤 Starting file upload (drag & drop)...')
    await uploadFiles(event.dataTransfer.files, props.currentFolderId, () => {
      // Emit event to parent to refresh folder view
      console.log('📤 Emitting file-uploaded event')
      emit('file-uploaded')
    })
    console.log('✅ All files uploaded')
  }
}

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
</script>

<style scoped>
.file-upload-panel {
  padding: 16px;
  background: #f8f9fa;
  border-top: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.upload-area {
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
}

.upload-area:hover {
  border-color: #4299e1;
  background-color: #f7fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.7;
}

.upload-text {
  margin: 0;
  color: #4a5568;
  font-size: 14px;
}

.upload-queue {
  margin-top: 24px;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.queue-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.queue-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
}

.queue-count {
  margin-left: 8px;
  background: #bee3f8;
  color: #2c5282;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.upload-list {
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
}

.upload-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f7fafc;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.upload-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.upload-item.pending {
  background-color: #fff9db;
  border-color: #ffd43b;
}

.upload-item.uploading {
  background-color: #d3f9f3;
  border-color: #51cf66;
}

.upload-item.success {
  background-color: #d3f9e8;
  border-color: #51cf66;
}

.upload-item.error {
  background-color: #ffe3e3;
  border-color: #ff6b6b;
}

.upload-info {
  flex: 1;
  min-width: 0;
}

.upload-name {
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.upload-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #718096;
}

.upload-status {
  text-transform: capitalize;
  font-weight: 500;
}

.upload-progress {
  display: flex;
  align-items: center;
  margin: 0 12px;
  min-width: 140px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  flex: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  transition: width 0.3s ease;
}

.progress-text {
  margin-left: 8px;
  font-size: 12px;
  min-width: 30px;
  font-weight: 600;
  color: #2d3748;
}

.upload-actions {
  display: flex;
  align-items: center;
}

.remove-btn, .cancel-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.remove-btn {
  background: #fed7d7;
  color: #c53030;
}

.remove-btn:hover {
  background: #f56565;
  color: white;
}

.cancel-btn {
  background: #d3f9f3;
  color: #38a169;
}

.cancel-btn:hover {
  background: #38a169;
  color: white;
}

.queue-actions {
  margin-top: 16px;
  text-align: right;
}

.clear-btn {
  padding: 8px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.clear-btn:hover {
  background: #3182ce;
}

.clear-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}
</style>