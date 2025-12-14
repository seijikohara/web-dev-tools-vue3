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
 * Configuration for API client
 */
const API_CONFIG = {
  baseURL: `${import.meta.env.VUE_APP_API_BASE_URL}api/`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const satisfies Parameters<typeof axios.create>[0]

/**
 * Extract error message from axios error
 */
const extractErrorMessage = (error: AxiosError): string =>
  (error.response?.data as { message?: string } | undefined)?.message ?? error.message

/**
 * Handle API errors consistently
 */
const handleApiError = (error: AxiosError): never => {
  throw new ApiError(extractErrorMessage(error), error.response?.status, error.code)
}

/**
 * Create configured axios instance
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create(API_CONFIG)

  client.interceptors.response.use(
    response => response,
    (error: AxiosError) => handleApiError(error),
  )

  return client
}

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient()
