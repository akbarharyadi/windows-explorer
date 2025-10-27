import Redis from 'ioredis'
import { WorkerConfig } from '../../config'

const redis = new Redis(WorkerConfig.REDIS.URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redis.on('connect', () => {
  console.log('📦 Worker Redis: Connected')
})

redis.on('ready', () => {
  console.log('✅ Worker Redis: Ready')
})

redis.on('error', (err) => {
  console.error('❌ Worker Redis Error:', err)
})

export default redis
