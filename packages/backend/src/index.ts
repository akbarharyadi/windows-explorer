import { Elysia } from 'elysia'
import { config } from 'dotenv'
import { errorHandler } from './presentation/middlewares/errorHandler'
import { corsMiddleware } from './presentation/middlewares/cors'
import { folderRoutes } from './presentation/routes/folders'
import { fileRoutes } from './presentation/routes/files'
import { searchRoutes } from './presentation/routes/search'
import { prisma } from './infrastructure/database/prisma'

// Load environment variables
config()

const PORT = process.env.PORT || 3000
const API_VERSION = process.env.API_VERSION || 'v1'
const NODE_ENV = process.env.NODE_ENV || 'development'

// Test database connection on startup
async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

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
  .get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      return {
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }
    }
  })

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

// Check database connection
checkDatabase()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

export default app
