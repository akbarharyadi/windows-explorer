import { cors } from '@elysiajs/cors'

/**
 * CORS middleware for Elysia
 * Enables Cross-Origin Resource Sharing for frontend access
 * Uses official @elysiajs/cors plugin
 */
export const corsMiddleware = cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
})
