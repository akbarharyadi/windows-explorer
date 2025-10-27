<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="itemName">Folder Name</label>
            <input
              id="itemName"
              v-model="itemName"
              type="text"
              class="form-input"
              :placeholder="placeholderText"
              required
              autofocus
            />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Create Folder Modal component for prompting user input
 * 
 * This component displays a modal dialog for creating new folders,
 * with input validation and proper event handling.
 */

import { ref, watch } from 'vue'

/** Props interface for CreateFolderModal component */
interface Props {
  /** Whether the modal should be visible */
  show: boolean
  /** Title to display in the modal header */
  title: string
  /** Placeholder text for the input field */
  placeholderText: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Create New Item',
  placeholderText: 'Enter name...'
})

/** Emits interface defining events that the component can emit */
const emit = defineEmits<{
  /** Emitted when the modal should be closed */
  close: []
  /** Emitted when the form is submitted with a valid name */
  submit: [name: string]
}>()

/** Reactive reference for the folder name input */
const itemName = ref('')

// Watch for changes to the show prop to reset input when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    itemName.value = ''
  }
})

/**
 * Closes the modal by emitting the close event
 */
function closeModal() {
  emit('close')
}

/**
 * Handles the form submission
 * 
 * Emits the submit event with the trimmed input value if valid
 */
function submitForm() {
  if (itemName.value.trim()) {
    emit('submit', itemName.value.trim())
    closeModal()
  }
}

/**
 * Handles keyboard events, specifically escape key to close modal
 * 
 * @param event - The keyboard event
 */
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// Add event listener for escape key
// We'll handle this in the parent component to avoid duplicated logic
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel,
.btn-submit {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel {
  background: #f5f5f5;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.btn-submit:hover {
  background: #1976d2;
}
</style>