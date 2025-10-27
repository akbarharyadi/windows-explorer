<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
  >
    <div
      v-for="item in menuItems"
      :key="item.id"
      class="menu-item"
      :class="{ disabled: item.disabled }"
      @click="handleClick(item)"
    >
      <span v-if="item.icon" class="menu-item-icon">{{ item.icon }}</span>
      <span class="menu-item-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Context Menu component for displaying context-sensitive menu options
 * 
 * This component displays a floating menu at a specific position with
 * customizable menu items that perform actions when clicked.
 */

import { ref, onMounted, onUnmounted, type PropType } from 'vue'
import type { ContextMenuItem } from '../types'

/** Interface for position coordinates */
interface Position {
  /** X coordinate for menu position */
  x: number
  /** Y coordinate for menu position */
  y: number
}

/** Props interface for ContextMenu component */
interface Props {
  /** Array of menu items to display in the context menu */
  menuItems: ContextMenuItem[]
  /** Whether the context menu should be visible */
  visible: boolean
  /** Position coordinates for the context menu */
  position: Position
}

const props = defineProps<Props>()

/** Emits interface defining events that the component can emit */
const emit = defineEmits<{
  /** Emitted when the context menu should be closed */
  close: []
}>()

/**
 * Handles the click event on a menu item
 * 
 * Executes the item's action if it's not disabled and closes the menu
 * 
 * @param item - The clicked menu item
 */
const handleClick = (item: ContextMenuItem) => {
  if (!item.disabled) {
    item.action()
    emit('close')
  }
}

/**
 * Handles clicks outside the context menu to close it
 * 
 * @param event - The click event
 */
const handleOutsideClick = (event: Event) => {
  const contextMenu = document.querySelector('.context-menu')
  if (contextMenu && !contextMenu.contains(event.target as Node)) {
    emit('close')
  }
}

// Add event listener to close menu when clicking outside
onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
})

// Remove event listener when component is unmounted
onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  max-width: 300px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover:not(.disabled) {
  background-color: #f5f5f5;
}

.menu-item.disabled {
  color: #aaa;
  cursor: not-allowed;
}

.menu-item-icon {
  margin-right: 8px;
  font-size: 16px;
}

.menu-item-label {
  flex: 1;
  font-size: 14px;
}
</style>