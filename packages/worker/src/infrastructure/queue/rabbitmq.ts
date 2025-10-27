import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib'
import { WorkerConfig } from '../../config'

// Define interface for the message from RabbitMQ (before JSON parsing)
interface RawRabbitMQMessage {
  type: string
  payload: unknown
  metadata?: Record<string, unknown>
}

class RabbitMQConsumer {
  private connection: Connection | null = null
  private channel: Channel | null = null

  async connect(): Promise<void> {
    try {
      console.log('🐰 Worker: Connecting to RabbitMQ...')
      this.connection = await amqp.connect(WorkerConfig.RABBITMQ.URL)
      this.channel = await this.connection.createChannel()

      // Set prefetch for fair distribution among workers
      await this.channel.prefetch(WorkerConfig.RABBITMQ.PREFETCH_COUNT)

      console.log('✅ Worker: RabbitMQ connected')

      // Handle errors
      this.connection.on('error', (err) => {
        console.error('❌ Worker RabbitMQ Connection Error:', err)
      })

      this.connection.on('close', () => {
        console.log('🔌 Worker: RabbitMQ connection closed')
        this.reconnect()
      })
    } catch (error) {
      console.error('❌ Worker: Failed to connect to RabbitMQ:', error)
      setTimeout(() => this.reconnect(), WorkerConfig.RABBITMQ.RETRY_DELAY)
    }
  }

  private async reconnect(): Promise<void> {
    console.log('🔄 Worker: Attempting to reconnect to RabbitMQ...')
    await this.connect()
  }

  async consume(
    queue: string,
    handler: (message: RawRabbitMQMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized')
    }

    console.log(`👂 Worker: Listening to queue: ${queue}`)

    await this.channel.consume(
      queue,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return

        try {
          const content = JSON.parse(msg.content.toString())
          console.log(`📨 Worker: Processing message from ${queue}:`, content.type)

          await handler(content)

          // Acknowledge successful processing
          this.channel!.ack(msg)
          console.log(`✅ Worker: Message processed successfully`)
        } catch (error) {
          console.error(`❌ Worker: Error processing message:`, error)

          // Check retry count
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1

          if (retryCount < WorkerConfig.RABBITMQ.MAX_RETRIES) {
            // Requeue with incremented retry count
            console.log(`🔄 Worker: Requeuing message (retry ${retryCount})`)
            this.channel!.nack(msg, false, false)

            // Republish with retry count
            await this.channel!.sendToQueue(msg.fields.routingKey, msg.content, {
              ...msg.properties,
              headers: {
                ...msg.properties.headers,
                'x-retry-count': retryCount,
              },
            })
          } else {
            // Max retries exceeded, move to dead letter queue or discard
            console.error(`💀 Worker: Max retries exceeded, message discarded`)
            this.channel!.ack(msg) // Remove from queue
          }
        }
      },
      { noAck: false },
    )
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close()
      await this.connection?.close()
      console.log('✅ Worker: RabbitMQ connection closed gracefully')
    } catch (error) {
      console.error('❌ Worker: Error closing RabbitMQ:', error)
    }
  }

  getChannel(): Channel | null {
    return this.channel
  }
}

export const rabbitmq = new RabbitMQConsumer()
export default rabbitmq
