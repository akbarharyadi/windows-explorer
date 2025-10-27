<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-toast', `notification-${notification.type}`]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else-if="notification.type === 'info'">ℹ️</span>
        </div>
        <div class="notification-message">{{ notification.message }}</div>
        <button class="notification-close" @click.stop="removeNotification(notification.id)">
          ×
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '../composables/useNotification'

const { notifications, removeNotification } = useNotification()
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.notification-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 500px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-success {
  border-left: 4px solid #4caf50;
  background: #f1f8f4;
}

.notification-error {
  border-left: 4px solid #f44336;
  background: #fef1f0;
}

.notification-warning {
  border-left: 4px solid #ff9800;
  background: #fff8f0;
}

.notification-info {
  border-left: 4px solid #2196f3;
  background: #f0f7ff;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-message {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #333;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
