import { ApiError } from '@/api/client'

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `API Error (${error.status || 'unknown'}): ${error.message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

/**
 * Log error to console with context
 */
export function logError(error: unknown, context?: string): void {
  const message = context ? `[${context}] ${formatErrorMessage(error)}` : formatErrorMessage(error)
  console.error(message, error)
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && (error.code === 'ERR_NETWORK' || !error.status)
}

/**
 * Check if error is an authorization error
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}
