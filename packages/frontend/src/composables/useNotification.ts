/**
 * Composable for showing notifications/toasts
 * Simple notification system for user feedback
 *
 * @module useNotification
 */

import { ref, type Ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

const notifications: Ref<Notification[]> = ref([])
let idCounter = 0

/**
 * Composable for managing notifications
 */
export function useNotification() {
  /**
   * Show a notification
   */
  function notify(type: Notification['type'], message: string, duration = 3000) {
    const id = `notification-${++idCounter}`

    const notification: Notification = {
      id,
      type,
      message,
      duration,
    }

    notifications.value.push(notification)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  /**
   * Remove a notification by ID
   */
  function removeNotification(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll() {
    notifications.value = []
  }

  // Convenience methods
  const success = (message: string, duration?: number) => notify('success', message, duration)
  const error = (message: string, duration?: number) => notify('error', message, duration)
  const info = (message: string, duration?: number) => notify('info', message, duration)
  const warning = (message: string, duration?: number) => notify('warning', message, duration)

  return {
    notifications,
    notify,
    removeNotification,
    clearAll,
    success,
    error,
    info,
    warning,
  }
}
