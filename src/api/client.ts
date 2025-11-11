import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: AxiosError): never {
  const status = error.response?.status
  const message = (error.response?.data as { message?: string })?.message ?? error.message

  throw new ApiError(message, status, error.code)
}

/**
 * Create configured axios instance
 */
export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${import.meta.env.VUE_APP_API_BASE_URL}api`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    error => handleApiError(error),
  )

  return client
}

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient()
