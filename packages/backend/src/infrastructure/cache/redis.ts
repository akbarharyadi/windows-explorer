import Redis from 'ioredis'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../../../../../.env') })

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

/**
 * Redis singleton connection
 * Configured with retry strategy and connection event handlers
 */
export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError(err) {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        return true
      }
      return false
    },
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Handle connection events
redis.on('connect', () => {
  console.log('📦 Redis: Connecting...')
})

redis.on('ready', () => {
  console.log('✅ Redis: Ready')
})

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err.message)
})

redis.on('close', () => {
  console.log('🔌 Redis: Connection closed')
})

redis.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...')
})

/**
 * Test Redis connection
 * @throws Error if connection fails
 */
async function testRedisConnection() {
  try {
    await redis.ping()
    console.log('✅ Redis connection test successful')
  } catch (error) {
    console.error('❌ Redis connection test failed:', error)
    throw error
  }
}

// Test on startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  testRedisConnection().catch((err) => {
    console.error('Failed to connect to Redis:', err)
  })
}

export default redis
