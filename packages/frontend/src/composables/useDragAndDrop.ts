/**
 * Composable for managing drag and drop functionality
 * 
 * This composable provides reactive state and methods for handling
 * drag and drop operations between folders and files in the UI.
 * 
 * @module useDragAndDrop
 */

import { ref, type Ref } from 'vue'
import type { DragAndDropEvent } from '../types'

/**
 * Composable function that provides state and methods for drag and drop operations
 * 
 * @returns Object containing reactive state and methods for drag and drop
 */
export function useDragAndDrop() {
  /** Reactive reference to the data being dragged */
  const dragData: Ref<DragAndDropEvent | null> = ref(null)
  /** Reactive reference indicating if a drag operation is currently in progress */
  const isDragging = ref(false)

  /**
   * Handles the start of a drag operation
   * 
   * @param event - The drag event
   * @param data - The drag and drop event data
   */
  function handleDragStart(event: DragEvent, data: DragAndDropEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', data.id)
      event.dataTransfer.setData('application/x-folder-explorer-item', JSON.stringify(data))
      dragData.value = data
      isDragging.value = true
    }
  }

  /**
   * Handles the end of a drag operation (when item is dropped or cancelled)
   */
  function handleDragEnd() {
    dragData.value = null
    isDragging.value = false
  }

  /**
   * Handles drag over events to allow dropping
   * 
   * @param event - The drag over event
   */
  function handleDragOver(event: DragEvent) {
    event.preventDefault() // Necessary to allow dropping
  }

  /**
   * Handles the drop operation
   * 
   * @param event - The drop event
   * @param targetId - The ID of the target item
   * @param targetType - The type of the target item ('folder' or 'file')
   * @returns The drop information or null if no drag data exists
   */
  function handleDrop(event: DragEvent, targetId: string, targetType: 'folder' | 'file') {
    event.preventDefault()
    
    if (!dragData.value) return null
    
    const sourceData = dragData.value
    dragData.value = null
    isDragging.value = false
    
    // Return the drop information for the parent component to handle
    return {
      source: sourceData,
      target: { id: targetId, type: targetType }
    }
  }

  return {
    dragData,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  }
}