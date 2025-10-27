<template>
  <div class="tree-node">
    <div
      class="tree-node-content"
      :class="{ selected: isSelected }"
      :style="indentStyle"
      @click="handleSelect"
      @contextmenu="showContextMenu"
      @dblclick="handleDoubleClick"
    >
      <span
        v-if="hasChildren"
        class="expand-icon"
        @click.stop="handleToggle"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="expand-icon-placeholder"></span>
      <span class="folder-icon">📁</span>
      <span class="folder-name">{{ folder.name }}</span>
    </div>

    <div v-if="isExpanded && hasChildren" class="tree-node-children">
      <TreeNode
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :level="level + 1"
        :is-expanded="isExpandedMap?.get(child.id) || false"
        :is-selected="isSelectedMap?.get(child.id) || false"
        :is-child-expanded="isExpandedMap"
        :is-child-selected="isSelectedMap"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
        @contextmenu="(event, folder) => emit('contextmenu', event, folder)"
        @dblclick="emit('dblclick', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Tree Node component for rendering individual nodes in the folder tree
 * 
 * This component displays a single folder in the hierarchical tree view,
 * with support for expansion, selection, and context menus.
 */

import { computed, type ComputedRef } from 'vue'
import type { FolderNode } from '../types'

/** Props interface for TreeNode component */
interface Props {
  /** The folder data to display */
  folder: FolderNode
  /** Nesting level of the node (for indentation) */
  level?: number
  /** Whether the node is currently expanded */
  isExpanded: boolean
  /** Whether the node is currently selected */
  isSelected: boolean
  /** Map of child folder expansion states */
  isChildExpanded?: Map<string, boolean> | ComputedRef<Map<string, boolean>>
  /** Map of child folder selection states */
  isChildSelected?: Map<string, boolean> | ComputedRef<Map<string, boolean>>
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
})

/** Emits interface defining events that the component can emit */
const emit = defineEmits<{
  /** Emitted when the expansion state of the folder should be toggled */
  toggle: [folderId: string]
  /** Emitted when the folder is selected */
  select: [folder: FolderNode]
  /** Emitted when context menu is requested for the folder */
  contextmenu: [event: MouseEvent, folder: FolderNode]
  /** Emitted when the folder is double-clicked */
  dblclick: [folder: FolderNode]
}>()

/**
 * Computed property to check if the folder has children
 * 
 * @returns True if the folder has child folders, false otherwise
 */
const hasChildren = computed(() => {
  return props.folder.children && props.folder.children.length > 0
})

/**
 * Computed style for indentation based on nesting level
 * 
 * @returns Style object with appropriate padding for the nesting level
 */
const indentStyle = computed(() => ({
  paddingLeft: `${props.level * 20}px`,
}))

// Properly handle the maps for child expansion/selection states
const isExpandedMap = computed(() => {
  if (props.isChildExpanded instanceof Map) {
    return props.isChildExpanded;
  } else if (typeof props.isChildExpanded === 'object' && 'value' in props.isChildExpanded) {
    return props.isChildExpanded.value;
  }
  return new Map<string, boolean>();
});

const isSelectedMap = computed(() => {
  if (props.isChildSelected instanceof Map) {
    return props.isChildSelected;
  } else if (typeof props.isChildSelected === 'object' && 'value' in props.isChildSelected) {
    return props.isChildSelected.value;
  }
  return new Map<string, boolean>();
});

/**
 * Handles the toggle action for expanding/collapsing the folder
 * 
 * Emits a toggle event if the folder has children
 */
function handleToggle() {
  if (hasChildren.value) {
    emit('toggle', props.folder.id)
  }
}

/**
 * Handles the selection of the folder
 * 
 * Emits a select event with the folder data
 */
function handleSelect() {
  emit('select', props.folder)
}

/**
 * Handles the context menu event for the folder
 * 
 * @param event - The context menu event
 */
function showContextMenu(event: MouseEvent) {
  event.preventDefault()
  emit('contextmenu', event, props.folder)
}

/**
 * Handles the double-click event on the folder
 * 
 * Emits a dblclick event with the folder data
 */
function handleDoubleClick() {
  emit('dblclick', props.folder)
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
  margin: 2px 0;
}

.tree-node-content:hover {
  background-color: #f0f0f0;
}

.tree-node-content.selected {
  background-color: #e3f2fd;
  font-weight: 500;
}

.expand-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  cursor: pointer;
  font-size: 10px;
  color: #666;
}

.expand-icon:hover {
  color: #333;
}

.expand-icon-placeholder {
  width: 16px;
  height: 16px;
  display: inline-block;
  margin-right: 4px;
}

.folder-icon {
  margin-right: 6px;
  font-size: 16px;
}

.folder-name {
  flex: 1;
  font-size: 14px;
}

.tree-node-children {
  margin-left: 0;
}
</style>