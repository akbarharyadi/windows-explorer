import { Elysia } from 'elysia'

/**
 * CORS middleware for Elysia
 * Enables Cross-Origin Resource Sharing for frontend access
 * Handles preflight OPTIONS requests
 */
export const corsMiddleware = new Elysia()
  .onBeforeHandle(({ set }) => {
    // Set CORS headers for all requests
    set.headers['Access-Control-Allow-Origin'] = '*'
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    set.headers['Access-Control-Max-Age'] = '86400' // 24 hours
  })
  // Handle preflight OPTIONS requests
  .options('/*', ({ set }) => {
    set.status = 204
    return ''
  })
