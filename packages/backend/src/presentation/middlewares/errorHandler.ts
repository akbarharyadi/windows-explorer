import { Elysia } from 'elysia'
import { NotFoundError, ValidationError, DatabaseError } from '../../domain/errors'

/**
 * Global error handler middleware for Elysia
 * Maps domain errors to appropriate HTTP status codes
 * Returns consistent error response format
 */
export const errorHandler = new Elysia().onError(({ code, error, set }) => {
  console.error('Error:', error)

  // Handle domain-specific errors
  if (error instanceof ValidationError) {
    set.status = 400
    return {
      success: false,
      error: 'Validation Error',
      message: error.message,
    }
  }

  if (error instanceof NotFoundError) {
    set.status = 404
    return {
      success: false,
      error: 'Not Found',
      message: error.message,
    }
  }

  if (error instanceof DatabaseError) {
    set.status = 500
    return {
      success: false,
      error: 'Database Error',
      message: 'An error occurred while processing your request',
      // Don't expose internal database errors to clients
    }
  }

  // Handle Elysia built-in error codes
  if (code === 'VALIDATION') {
    set.status = 400
    return {
      success: false,
      error: 'Validation Error',
      message: error.message || 'Invalid request data',
    }
  }

  if (code === 'NOT_FOUND') {
    set.status = 404
    return {
      success: false,
      error: 'Not Found',
      message: 'Resource not found',
    }
  }

  if (code === 'PARSE') {
    set.status = 400
    return {
      success: false,
      error: 'Parse Error',
      message: 'Invalid request format',
    }
  }

  if (code === 'INTERNAL_SERVER_ERROR') {
    set.status = 500
    return {
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }
  }

  // Default error response
  set.status = 500
  return {
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  }
})
