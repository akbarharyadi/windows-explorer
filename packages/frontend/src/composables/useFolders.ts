/**
 * Composable for managing folder-related state and operations
 * 
 * This composable provides reactive state and methods for interacting with
 * the folder tree structure, including loading, creating, and managing folders.
 * 
 * @module useFolders
 */

import { ref, type Ref } from 'vue'
import { api } from '../services/api'
import type { FolderNode, FolderChildren } from '../types'

/**
 * Composable function that provides state and methods for folder management
 * 
 * @returns Object containing reactive state and methods for folder operations
 */
export function useFolders() {
  /** Reactive reference to the complete folder tree structure */
  const folderTree: Ref<FolderNode[]> = ref([])
  /** Reactive reference to the currently selected folder */
  const selectedFolder: Ref<FolderNode | null> = ref(null)
  /** Reactive reference to the children (folders and files) of the selected folder */
  const folderChildren: Ref<FolderChildren | null> = ref(null)
  /** Reactive reference indicating if an operation is currently loading */
  const loading = ref(false)
  /** Reactive reference to any error that occurred during operations */
  const error: Ref<string | null> = ref(null)

  /**
   * Loads the complete folder tree structure from the API
   * 
   * Updates the folderTree reactive reference and handles any errors
   */
  async function loadFolderTree() {
    loading.value = true
    error.value = null
    try {
      folderTree.value = await api.getFolderTree()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load folders'
      console.error('Error loading folder tree:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Selects a folder and loads its children (subfolders and files)
   * 
   * Updates the selectedFolder and folderChildren reactive references
   * 
   * @param folder - The folder to select
   */
  async function selectFolder(folder: FolderNode) {
    selectedFolder.value = folder
    loading.value = true
    error.value = null
    try {
      folderChildren.value = await api.getFolderChildren(folder.id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load folder contents'
      console.error('Error loading folder children:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new folder in the specified parent folder (or at root level)
   * 
   * Updates the folder tree structure and refreshes the UI if needed
   * 
   * @param folderName - Name of the new folder
   * @param parentId - ID of the parent folder (null for root level)
   * @returns Promise resolving to the created FolderNode
   */
  async function createNewFolder(folderName: string, parentId: string | null = null) {
    try {
      const newFolder = await api.createFolder({ name: folderName, parentId })
      
      // Update the tree structure to include the new folder
      if (parentId) {
        // Find the parent folder in the tree and add the new folder to its children
        const addToChildren = (folders: FolderNode[]): boolean => {
          for (const folder of folders) {
            if (folder.id === parentId) {
              if (!folder.children) folder.children = []
              folder.children.push(newFolder)
              return true
            }
            if (folder.children && addToChildren(folder.children)) {
              return true
            }
          }
          return false
        }
        addToChildren(folderTree.value)
      } else {
        // Add to root level if no parent
        folderTree.value.push(newFolder)
      }
      
      // If the parent folder is currently selected, refresh its children
      if (selectedFolder.value?.id === parentId) {
        await selectFolder(selectedFolder.value)
      }
      
      return newFolder
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create folder'
      console.error('Error creating folder:', e)
      throw e
    }
  }

  /**
   * Uploads a file to the specified folder
   * 
   * Refreshes the folder contents after successful upload
   * 
   * @param file - The File object to upload
   * @param folderId - ID of the folder to upload to
   * @returns Promise resolving to the upload result
   */
  async function uploadFileToFolder(file: File, folderId: string) {
    try {
      // This would handle the actual upload via the API
      // For now, we'll just call the API function
      const result = await api.uploadFile(file, folderId)
      
      // Refresh the current folder's children to show the new file
      if (selectedFolder.value?.id === folderId) {
        await selectFolder(selectedFolder.value)
      }
      
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to upload file'
      console.error('Error uploading file:', e)
      throw e
    }
  }

  /**
   * Deletes a folder or file from the system
   * 
   * Updates the UI to reflect the deletion
   * 
   * @param id - ID of the item to delete
   * @param type - Type of item to delete ('folder' or 'file')
   * @returns Promise resolving to true if successful
   */
  async function deleteItem(id: string, type: 'folder' | 'file') {
    try {
      const success = await api.deleteItem(id, type)
      if (success) {
        // Remove the item from the UI
        if (type === 'folder') {
          // Remove from the tree structure
          const removeFromTree = (folders: FolderNode[]): boolean => {
            for (let i = 0; i < folders.length; i++) {
              if (folders[i].id === id) {
                folders.splice(i, 1)
                return true
              }
              if (folders[i].children && removeFromTree(folders[i].children!)) {
                return true
              }
            }
            return false
          }
          removeFromTree(folderTree.value)
        } else {
          // For files, remove from the current children if visible
          if (folderChildren.value) {
            folderChildren.value.files = folderChildren.value.files.filter(file => file.id !== id)
          }
        }
        
        // If we deleted the currently selected folder, clear the selection
        if (selectedFolder.value?.id === id && type === 'folder') {
          selectedFolder.value = null
          folderChildren.value = null
        }
      }
      return success
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete item'
      console.error(`Error deleting ${type}:`, e)
      throw e
    }
  }

  return {
    folderTree,
    selectedFolder,
    folderChildren,
    loading,
    error,
    loadFolderTree,
    selectFolder,
    createNewFolder,
    uploadFileToFolder,
    deleteItem,
  }
}