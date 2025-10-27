import { Elysia } from 'elysia'
import { config } from 'dotenv'
import { errorHandler } from './presentation/middlewares/errorHandler'
import { corsMiddleware } from './presentation/middlewares/cors'
import { folderRoutes } from './presentation/routes/folders'
import { fileRoutes } from './presentation/routes/files'
import { searchRoutes } from './presentation/routes/search'

// Load environment variables
config()

const PORT = process.env.PORT || 3000
const API_VERSION = process.env.API_VERSION || 'v1'
const NODE_ENV = process.env.NODE_ENV || 'development'

/**
 * Window Explorer Backend API
 * Built with Elysia, following Clean Architecture principles
 * Features: Redis caching, RabbitMQ events, PostgreSQL database
 */
const app = new Elysia()
  // Apply middlewares
  .use(corsMiddleware)
  .use(errorHandler)

  // Root endpoint - API information
  .get('/', () => ({
    success: true,
    message: 'Window Explorer API',
    version: API_VERSION,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      docs: '/swagger',
      folders: `/api/${API_VERSION}/folders`,
      files: `/api/${API_VERSION}/files`,
      search: `/api/${API_VERSION}/search`,
    },
  }))

  // Health check endpoint
  .get('/health', () => ({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    services: {
      api: 'operational',
      database: 'operational', // TODO: Add actual DB health check
      redis: 'operational', // TODO: Add actual Redis health check
      rabbitmq: 'operational', // TODO: Add actual RabbitMQ health check
    },
  }))

  // API Routes
  .use(folderRoutes)
  .use(fileRoutes)
  .use(searchRoutes)

  // Start server
  .listen(PORT)

// Server startup logging
console.log('🚀 Window Explorer API Server Started')
console.log(`📍 URL: http://${app.server?.hostname}:${app.server?.port}`)
console.log(`🌍 Environment: ${NODE_ENV}`)
console.log(`📦 Version: ${API_VERSION}`)
console.log(`⚡ Runtime: Bun ${process.versions.bun}`)
console.log('\n📚 Available Endpoints:')
console.log(`   GET  /                           - API info`)
console.log(`   GET  /health                      - Health check`)
console.log(`   GET  /api/${API_VERSION}/folders              - List all folders`)
console.log(`   GET  /api/${API_VERSION}/folders/tree         - Folder tree`)
console.log(`   GET  /api/${API_VERSION}/folders/:id          - Get folder`)
console.log(`   GET  /api/${API_VERSION}/folders/:id/children - Folder contents`)
console.log(`   POST /api/${API_VERSION}/folders              - Create folder`)
console.log(`   PUT  /api/${API_VERSION}/folders/:id          - Update folder`)
console.log(`   DEL  /api/${API_VERSION}/folders/:id          - Delete folder`)
console.log(`   GET  /api/${API_VERSION}/files                - List all files`)
console.log(`   GET  /api/${API_VERSION}/files/:id            - Get file`)
console.log(`   GET  /api/${API_VERSION}/files/folder/:id     - Files by folder`)
console.log(`   POST /api/${API_VERSION}/files                - Create file`)
console.log(`   PUT  /api/${API_VERSION}/files/:id            - Update file`)
console.log(`   DEL  /api/${API_VERSION}/files/:id            - Delete file`)
console.log(`   GET  /api/${API_VERSION}/search?q=query       - Search all`)
console.log(`   GET  /api/${API_VERSION}/search/folders?q=query - Search folders`)
console.log(`   GET  /api/${API_VERSION}/search/files?q=query   - Search files`)
console.log('\n✨ Server ready to accept connections\n')

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...')
  process.exit(0)
})

export default app
