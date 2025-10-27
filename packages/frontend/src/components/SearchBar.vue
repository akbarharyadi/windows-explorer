<template>
  <div class="search-bar">
    <form @submit.prevent="handleSubmit">
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        placeholder="Search folders and files..."
        @input="handleInput"
      />
      <button
        v-if="modelValue"
        type="button"
        class="clear-btn"
        @click="handleClear"
      >
        ✕
      </button>
      <button type="submit" :disabled="searching || !modelValue">
        {{ searching ? '🔍 ...' : '🔍 Search' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * Search Bar component for searching folders and files
 * 
 * This component provides an input field with search functionality
 * and allows clearing the search query.
 */

import { ref } from 'vue'

/** Props interface for SearchBar component */
interface Props {
  /** Current search query value (v-model) */
  modelValue: string
  /** Whether a search operation is currently in progress */
  searching?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searching: false,
})

/** Emits interface defining events that the component can emit */
const emit = defineEmits<{
  /** Emitted when the search query changes (v-model update) */
  'update:modelValue': [value: string]
  /** Emitted when the search form is submitted */
  search: []
  /** Emitted when the search query is cleared */
  clear: []
}>()

/** Reference to the search input element */
const inputRef = ref<HTMLInputElement | null>(null)

/**
 * Handles input events to update the search query
 * 
 * @param event - The input event
 */
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

/**
 * Handles the form submission event
 * 
 * Emits the search event to trigger the search operation
 */
function handleSubmit() {
  emit('search')
}

/**
 * Handles clearing the search query
 * 
 * Emits events to clear the query and focuses the input field
 */
function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}
</script>

<style scoped>
.search-bar {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #ddd;
}

.search-bar form {
  display: flex;
  gap: 8px;
  position: relative;
}

.search-bar input {
  flex: 1;
  padding: 10px 40px 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-bar input:focus {
  outline: none;
  border-color: #2196f3;
}

.clear-btn {
  position: absolute;
  right: 120px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 16px;
}

.clear-btn:hover {
  color: #666;
}

.search-bar button[type="submit"] {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.search-bar button[type="submit"]:hover:not(:disabled) {
  background: #1976d2;
}

.search-bar button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>