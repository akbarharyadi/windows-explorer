import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import redis from '../cache/redis'
import { EventStatusUpdate } from '@window-explorer/shared'

/**
 * EventNotifier - WebSocket server for real-time event status updates
 * Uses Socket.IO with HTTP server for bi-directional communication
 * Subscribes to Redis pub/sub for worker status updates
 */
export class EventNotifier {
  private io: SocketIOServer
  private httpServer: ReturnType<typeof createServer>
  private redisSubscriber: typeof redis

  constructor(port: number = 3001) {
    // Create HTTP server for Socket.IO
    this.httpServer = createServer()

    // Initialize Socket.IO
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      // Optimize for real-time updates
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    })

    // Start HTTP server
    this.httpServer.listen(port, () => {
      console.log(`✅ WebSocket server listening on port ${port}`)
    })

    // Create Redis subscriber client with lazyConnect to control connection timing
    this.redisSubscriber = redis.duplicate({
      lazyConnect: true,
    })

    this.setupRedisSubscription()
    this.setupSocketHandlers()

    console.log('✅ WebSocket Event Notifier initialized')
  }

  /**
   * Subscribe to Redis pub/sub channel for event updates
   * Worker publishes to 'event:status:updates' when processing completes
   */
  private async setupRedisSubscription() {
    try {
      await this.redisSubscriber.connect()

      await this.redisSubscriber.subscribe('event:status:updates', (message) => {
        try {
          const update: EventStatusUpdate = JSON.parse(message)

          // Validate the parsed update object
          if (!update || typeof update !== 'object' || !update.eventId) {
            console.warn('⚠️ Received invalid event status update:', message)
            return
          }

          // Broadcast to all connected clients
          this.io.emit('event:status', update)
          console.log(`📡 Broadcasting event status update: ${update.eventId} -> ${update.status}`)
        } catch (error) {
          console.error('❌ Error parsing event status update:', error, 'Message:', message)
        }
      })

      console.log('📻 Subscribed to Redis event:status:updates channel')
    } catch (error) {
      console.error('❌ Failed to setup Redis subscription:', error)
    }
  }

  /**
   * Setup Socket.IO connection handlers
   */
  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // Handle client disconnect
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id} (${reason})`)
      })

      // Handle client subscribing to specific event updates
      socket.on('subscribe:event', (eventId: string) => {
        socket.join(`event:${eventId}`)
        console.log(`📝 Client ${socket.id} subscribed to event ${eventId}`)
      })

      // Handle client unsubscribing from event updates
      socket.on('unsubscribe:event', (eventId: string) => {
        socket.leave(`event:${eventId}`)
        console.log(`📝 Client ${socket.id} unsubscribed from event ${eventId}`)
      })

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to event status updates',
        timestamp: new Date().toISOString(),
      })
    })
  }

  /**
   * Manually notify status change (can be called from backend directly)
   * @param eventId Event ID
   * @param status Event status update
   */
  async notifyStatusChange(eventId: string, status: EventStatusUpdate) {
    // Publish to Redis (for worker and other backend instances)
    await redis.publish('event:status:updates', JSON.stringify(status))

    // Also broadcast directly to connected clients
    this.io.emit('event:status', status)

    // Send to specific event room if anyone is subscribed
    this.io.to(`event:${eventId}`).emit('event:status', status)
  }

  /**
   * Get number of connected clients
   */
  getConnectedClients(): number {
    return this.io.engine.clientsCount
  }

  /**
   * Close WebSocket server and Redis subscription
   */
  async close() {
    await this.redisSubscriber.quit()
    await this.io.close()
    this.httpServer.close()
    console.log('🔌 WebSocket Event Notifier closed')
  }
}
