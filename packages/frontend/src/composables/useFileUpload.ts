/**
 * Composable for managing file upload operations
 * 
 * This composable provides reactive state and methods for handling
 * file uploads with progress tracking, status management, and queue management.
 * 
 * @module useFileUpload
 */

import { ref, type Ref } from 'vue'
import { api } from '../services/api'
import type { FileUpload } from '../types'

/**
 * Composable function that provides state and methods for file upload operations
 * 
 * @returns Object containing reactive state and methods for file uploads
 */
export function useFileUpload() {
  /** Reactive reference to the list of file uploads in progress */
  const uploads: Ref<FileUpload[]> = ref([])
  /** Reactive reference indicating if any upload is currently in progress */
  const isUploading = ref(false)

  /**
   * Adds a file to the upload queue
   * 
   * @param file - The File object to upload
   * @param folderId - The ID of the folder to upload to
   * @returns The generated upload ID
   */
  function addUpload(file: File, folderId: string): string {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newUpload: FileUpload = {
      id: uploadId,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      file,
      folderId
    }
    
    uploads.value.push(newUpload)
    return uploadId
  }

  /**
   * Starts the upload process for a single file
   * 
   * @param uploadId - The ID of the upload to start
   * @returns Promise resolving to true if successful
   */
  async function startUpload(uploadId: string) {
    const upload = uploads.value.find(u => u.id === uploadId)
    if (!upload) return false

    upload.status = 'uploading'
    isUploading.value = true

    try {
      await api.uploadFile(
        upload.file, 
        upload.folderId, 
        (progress) => {
          upload.progress = progress
        }
      )
      
      upload.status = 'success'
      return true
    } catch (error) {
      upload.status = 'error'
      console.error('Upload failed:', error)
      return false
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Initiates the upload of multiple files to the specified folder
   * 
   * @param files - List of files to upload
   * @param folderId - ID of the folder to upload to
   * @returns Promise resolving to array of upload results
   */
  async function uploadFiles(files: FileList, folderId: string) {
    const uploadIds: string[] = []

    // Add all files to the upload queue
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadId = addUpload(file, folderId)
      uploadIds.push(uploadId)
    }

    // Start all uploads
    const uploadPromises = uploadIds.map(id => startUpload(id))
    const results = await Promise.all(uploadPromises)
    
    return results
  }

  /**
   * Removes an upload from the queue
   * 
   * @param uploadId - The ID of the upload to remove
   */
  function removeUpload(uploadId: string) {
    const index = uploads.value.findIndex(u => u.id === uploadId)
    if (index !== -1) {
      uploads.value.splice(index, 1)
    }
  }

  /**
   * Clears completed uploads (success and error) from the queue
   */
  function clearCompletedUploads() {
    uploads.value = uploads.value.filter(upload => 
      upload.status !== 'success' && upload.status !== 'error'
    )
  }

  return {
    uploads,
    isUploading,
    addUpload,
    startUpload,
    uploadFiles,
    removeUpload,
    clearCompletedUploads
  }
}