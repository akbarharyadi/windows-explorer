/**
 * API service module for the Window Explorer frontend application
 * 
 * This module provides a centralized way to interact with the backend API,
 * handling requests, responses, and error handling consistently across the application.
 * 
 * @module api
 */

import type { FolderNode, FolderChildren, ApiResponse, SearchResults } from '../types'

/** Base URL for the API, either from environment variable or default local URL */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Generic function to make API requests with error handling
 * 
 * @template T - Type of the expected response data
 * @param endpoint - The API endpoint to call (e.g., '/api/v1/folders/tree')
 * @returns Promise resolving to the response data
 * @throws Error if the API request fails
 */
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  const data: ApiResponse<T> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Unknown error')
  }

  return data.data
}

/**
 * Function to make API requests with progress tracking (used for file uploads)
 * 
 * This function uses XMLHttpRequest instead of fetch to allow progress tracking
 * during file uploads.
 * 
 * @template T - Type of the expected response data
 * @param endpoint - The API endpoint to call
 * @param options - Request options including method, headers, and body
 * @param onProgress - Optional callback to track upload progress (0-100%)
 * @returns Promise resolving to the response data
 * @throws Error if the upload fails
 */
function fetchApiWithProgress<T>(
  endpoint: string,
  options: RequestInit,
  onProgress?: (progress: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress(progress)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText) as ApiResponse<T>
        if (response.success && response.data) {
          resolve(response.data)
        } else {
          reject(new Error(response.message || 'Upload failed'))
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload request failed'))
    })
    
    xhr.open('POST', `${API_BASE_URL}${endpoint}`)
    
    // Add headers if provided in options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value as string)
      })
    }
    
    xhr.send(options.body)
  })
}

/**
 * API client object providing methods for all backend interactions
 * 
 * This includes methods for folder operations, file operations, search, and item management.
 */
export const api = {
  /**
   * Retrieves the complete folder tree structure from the backend
   * 
   * @returns Promise resolving to an array of root-level FolderNode objects
   */
  async getFolderTree(): Promise<FolderNode[]> {
    return fetchApi<FolderNode[]>('/api/v1/folders/tree')
  },

  /**
   * Gets the children (folders and files) of a specific folder
   * 
   * @param folderId - The ID of the parent folder
   * @returns Promise resolving to FolderChildren object containing subfolders and files
   */
  async getFolderChildren(folderId: string): Promise<FolderChildren> {
    return fetchApi<FolderChildren>(`/api/v1/folders/${folderId}/children`)
  },

  /**
   * Searches for folders and files that match the given query
   * 
   * @param query - The search term to look for
   * @returns Promise resolving to SearchResults object containing matching folders and files
   */
  async search(query: string): Promise<SearchResults> {
    const encodedQuery = encodeURIComponent(query)
    return fetchApi<SearchResults>(`/api/v1/search?q=${encodedQuery}`)
  },

  /**
   * Creates a new folder
   * 
   * @param folderData - Object containing the folder name and parent ID
   * @returns Promise resolving to the created FolderNode object
   */
  async createFolder(folderData: { name: string; parentId: string | null }): Promise<FolderNode> {
    const response = await fetch(`${API_BASE_URL}/api/v1/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`)
    }

    const data: ApiResponse<FolderNode> = await response.json()
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to create folder')
    }

    return data.data
  },

  /**
   * Uploads a file to a specified folder
   * 
   * @param file - The File object to upload
   * @param folderId - The ID of the folder to upload to
   * @param onProgress - Optional callback to track upload progress (0-100%)
   * @returns Promise resolving to the created file object from the backend
   */
  async uploadFile(file: File, folderId: string, onProgress?: (progress: number) => void): Promise<{ id: string; name: string; size: number; folderId: string; mimeType: string | null; createdAt: Date; updatedAt: Date }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folderId', folderId)

    return fetchApiWithProgress<{ id: string; name: string; size: number; folderId: string; mimeType: string | null; createdAt: Date; updatedAt: Date }>(
      '/api/v1/files/upload',
      {
        method: 'POST',
        body: formData,
      },
      onProgress
    )
  },

  /**
   * Deletes a folder or file
   * 
   * @param id - The ID of the item to delete
   * @param type - The type of item to delete ('folder' or 'file')
   * @returns Promise resolving to true if successful
   */
  async deleteItem(id: string, type: 'folder' | 'file'): Promise<boolean> {
    const endpoint = type === 'folder' 
      ? `/api/v1/folders/${id}` 
      : `/api/v1/files/${id}`
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete ${type}: ${response.statusText}`)
    }

    const data: ApiResponse<boolean> = await response.json()
    return data.success
  },

  /**
   * Moves a folder or file to a new parent location
   * 
   * @param id - The ID of the item to move
   * @param type - The type of item to move ('folder' or 'file')
   * @param newParentId - The ID of the new parent folder
   * @returns Promise resolving to true if successful
   */
  async moveItem(
    id: string, 
    type: 'folder' | 'file', 
    newParentId: string
  ): Promise<boolean> {
    const endpoint = type === 'folder' 
      ? `/api/v1/folders/${id}/move` 
      : `/api/v1/files/${id}/move`
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newParentId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to move ${type}: ${response.statusText}`)
    }

    const data: ApiResponse<boolean> = await response.json()
    return data.success
  },
}