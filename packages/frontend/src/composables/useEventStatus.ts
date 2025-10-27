/**
 * Composable for tracking async event status via WebSocket
 * Provides real-time updates for folder/file operations
 *
 * @module useEventStatus
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { EventStatus, EventStatusUpdate } from '@window-explorer/shared'

/**
 * Event status state for UI tracking
 */
interface TrackedEvent {
  eventId: string
  status: EventStatus
  entityId?: string
  error?: string
  entityType?: string
  entityName?: string
}

/**
 * Composable function for WebSocket-based event status tracking
 */
export function useEventStatus() {
  const socket: Ref<Socket | null> = ref(null)
  const connected = ref(false)
  const trackedEvents: Ref<Map<string, TrackedEvent>> = ref(new Map())
  const callbacks = new Map<string, (status: EventStatusUpdate) => void>()

  /**
   * Initialize WebSocket connection
   */
  function connect() {
    if (socket.value?.connected) return

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

    socket.value = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection established
    socket.value.on('connected', (data) => {
      console.log('✅ Connected to event status updates:', data.message)
      connected.value = true
    })

    // Receive status updates
    socket.value.on('event:status', (update: EventStatusUpdate) => {
      console.log('📡 Received event status update:', update)

      // Update tracked event
      const tracked = trackedEvents.value.get(update.eventId)
      if (tracked) {
        tracked.status = update.status
        tracked.entityId = update.entityId
        tracked.error = update.error
      }

      // Call registered callback
      const callback = callbacks.get(update.eventId)
      if (callback) {
        callback(update)
      }
    })

    // Connection lost
    socket.value.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from event status updates:', reason)
      connected.value = false
    })

    // Reconnection
    socket.value.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to event status updates (attempt ${attemptNumber})`)
      connected.value = true
    })

    // Connection error
    socket.value.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
    })
  }

  /**
   * Track an event and register callback for updates
   */
  function trackEvent(
    eventId: string,
    entityType: string,
    entityName: string,
    onUpdate: (status: EventStatusUpdate) => void
  ) {
    // Add to tracked events
    trackedEvents.value.set(eventId, {
      eventId,
      status: 'pending' as EventStatus,
      entityType,
      entityName,
    })

    // Register callback
    callbacks.set(eventId, onUpdate)

    // Subscribe to specific event updates
    if (socket.value?.connected) {
      socket.value.emit('subscribe:event', eventId)
    }

    console.log(`📝 Tracking event: ${eventId}`)
  }

  /**
   * Stop tracking an event
   */
  function untrackEvent(eventId: string) {
    trackedEvents.value.delete(eventId)
    callbacks.delete(eventId)

    // Unsubscribe from event updates
    if (socket.value?.connected) {
      socket.value.emit('unsubscribe:event', eventId)
    }

    console.log(`📝 Stopped tracking event: ${eventId}`)
  }

  /**
   * Get status of a tracked event
   */
  function getEventStatus(eventId: string): TrackedEvent | undefined {
    return trackedEvents.value.get(eventId)
  }

  /**
   * Get all tracked events
   */
  function getAllTrackedEvents(): TrackedEvent[] {
    return Array.from(trackedEvents.value.values())
  }

  /**
   * Clear completed/failed events
   */
  function clearTerminalEvents() {
    for (const [eventId, event] of trackedEvents.value.entries()) {
      if (event.status === 'completed' || event.status === 'failed') {
        untrackEvent(eventId)
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  // Auto-connect on mount
  onMounted(() => {
    connect()
  })

  // Auto-disconnect on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    connected,
    trackedEvents,
    trackEvent,
    untrackEvent,
    getEventStatus,
    getAllTrackedEvents,
    clearTerminalEvents,
    connect,
    disconnect,
  }
}
