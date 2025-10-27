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
      <h3>Upload Queue ({{ uploads.length }})</h3>
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
          
          <button 
            v-if="upload.status !== 'uploading'" 
            class="remove-btn"
            @click="removeUpload(upload.id)"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div class="upload-actions">
        <button @click="clearCompletedUploads">Clear Completed</button>
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

import { ref, type PropType } from 'vue'
import { useFileUpload } from '../composables/useFileUpload'
import type { FileUpload } from '../types'

/** Props interface for FileUpload component */
interface Props {
  /** ID of the current folder where files should be uploaded */
  currentFolderId: string
}

const props = defineProps<Props>()

/** Composable for handling file upload operations */
const { uploads, addUpload, uploadFiles, removeUpload, clearCompletedUploads } = useFileUpload()
/** Reference to the file input element */
const fileInputRef = ref<HTMLInputElement | null>(null)

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
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    uploadFiles(target.files, props.currentFolderId)
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
function handleDrop(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    uploadFiles(event.dataTransfer.files, props.currentFolderId)
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
  background: #fafafa;
  border-top: 1px solid #ddd;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #2196f3;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  margin: 0;
  color: #666;
}

.upload-queue {
  margin-top: 16px;
}

.upload-queue h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.upload-list {
  max-height: 200px;
  overflow-y: auto;
}

.upload-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}

.upload-item.pending {
  background-color: #fff8e1;
}

.upload-item.uploading {
  background-color: #e3f2fd;
}

.upload-item.success {
  background-color: #e8f5e9;
}

.upload-item.error {
  background-color: #ffebee;
}

.upload-info {
  flex: 1;
}

.upload-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.upload-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.upload-status {
  text-transform: capitalize;
}

.upload-progress {
  display: flex;
  align-items: center;
  margin: 0 12px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s;
}

.progress-text {
  margin-left: 8px;
  font-size: 12px;
  min-width: 30px;
}

.remove-btn {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #d32f2f;
}

.upload-actions {
  margin-top: 12px;
  text-align: right;
}

.upload-actions button {
  padding: 6px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.upload-actions button:hover {
  background: #e0e0e0;
}
</style>