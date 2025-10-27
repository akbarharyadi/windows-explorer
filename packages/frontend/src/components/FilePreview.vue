<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ fileName }}</h3>
        <div class="header-actions">
          <button @click="downloadFile" class="action-btn download-btn" title="Download">
            📥 Download
          </button>
          <button @click="$emit('close')" class="action-btn close-btn" title="Close">
            ✕
          </button>
        </div>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading">Loading preview...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else class="preview-container">
          <!-- PDF Preview -->
          <iframe
            v-if="fileType === 'pdf'"
            :src="previewUrl"
            class="preview-iframe"
            title="PDF Preview"
          ></iframe>

          <!-- Image Preview -->
          <img
            v-else-if="fileType === 'image'"
            :src="previewUrl"
            :alt="fileName"
            class="preview-image"
          />

          <!-- Text Preview -->
          <pre v-else-if="fileType === 'text'" class="preview-text">{{ textContent }}</pre>

          <!-- Video Preview -->
          <video
            v-else-if="fileType === 'video'"
            :src="previewUrl"
            controls
            class="preview-video"
          ></video>

          <!-- Audio Preview -->
          <audio
            v-else-if="fileType === 'audio'"
            :src="previewUrl"
            controls
            class="preview-audio"
          ></audio>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * File Preview component for displaying various file types in a modal
 * 
 * This component supports previewing PDFs, images, text files, videos, and audio files.
 * For other file types, it provides a download option.
 */

import { ref, watch, computed } from 'vue'

/** Props interface for FilePreview component */
interface Props {
  /** Whether to show the preview modal */
  show: boolean
  /** Unique identifier for the file to preview */
  fileId: string
  /** Name of the file to display in the header */
  fileName: string
  /** MIME type of the file (optional, used for detection) */
  mimeType: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  /** Emitted when the preview modal should be closed */
  close: []
}>()

/** Reactive state for loading status */
const loading = ref(false)
/** Reactive state for error messages */
const error = ref('')
/** Reactive state for text file content */
const textContent = ref('')

/** Base URL for API requests, from environment variable or default */
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
/** Computed URL for the file preview */
const previewUrl = computed(() => `${baseUrl}/api/v1/files/${props.fileId}/preview`)
/** Computed URL for downloading the file */
const downloadUrl = computed(() => `${baseUrl}/api/v1/files/${props.fileId}/download`)

/** 
 * Computed property that determines the file type for appropriate preview
 * 
 * @returns The detected file type ('pdf', 'image', 'text', 'video', 'audio') or null
 */
const fileType = computed(() => {
  const mime = props.mimeType?.toLowerCase() || ''
  const ext = props.fileName.toLowerCase().split('.').pop() || ''

  // PDF
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'

  // Images
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image'
  }

  // Text files
  if (
    mime.startsWith('text/') ||
    ['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'ts', 'html', 'css', 'py', 'java', 'c', 'cpp', 'sh'].includes(ext)
  ) {
    return 'text'
  }

  // Video
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
    return 'video'
  }

  // Audio
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
    return 'audio'
  }

  return null
})

/** Watcher that loads preview when modal is shown */
watch(
  () => props.show,
  async (show) => {
    if (show && props.fileId) {
      await loadPreview()
    }
  }
)

/**
 * Loads the preview content, primarily for text files
 * 
 * For text files, fetches the content and stores it in textContent.
 * For other file types, the browser will load them directly via the preview URL.
 */
async function loadPreview() {
  if (fileType.value === 'text') {
    loading.value = true
    error.value = ''
    try {
      const response = await fetch(previewUrl.value)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }
      textContent.value = await response.text()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load preview'
    } finally {
      loading.value = false
    }
  }
}

/**
 * Handles clicks on the modal overlay to close the preview
 */
function handleOverlayClick() {
  emit('close')
}

/**
 * Downloads the file directly to the user's device
 */
function downloadFile() {
  const link = document.createElement('a')
  link.href = downloadUrl.value
  link.download = props.fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ddd;
  background: #f5f5f5;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.download-btn {
  background: #4caf50;
  color: white;
}

.download-btn:hover {
  background: #45a049;
}

.close-btn {
  background: #f44336;
  color: white;
}

.close-btn:hover {
  background: #da190b;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading,
.error {
  padding: 32px;
  text-align: center;
  color: #666;
}

.error {
  color: #f44336;
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-text {
  width: 100%;
  height: 100%;
  padding: 24px;
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #fafafa;
}

.preview-video,
.preview-audio {
  max-width: 100%;
  max-height: 100%;
}

.preview-audio {
  width: 80%;
}
</style>
