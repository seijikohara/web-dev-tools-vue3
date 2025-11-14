import { useAsyncState, type UseAsyncStateReturn } from '@vueuse/core'
import { ApiError } from '@/api/client'

interface UseApiOptions {
  immediate?: boolean
  resetOnExecute?: boolean
  onError?: (error: ApiError) => void
}

/**
 * Composable for API calls with loading, error states
 * Wraps VueUse's useAsyncState with API-specific error handling
 */
export const useApi = <T>(
  apiFunction: () => Promise<T>,
  initialState: T,
  options: UseApiOptions = {},
): UseAsyncStateReturn<T, [], true> => {
  const { immediate = true, resetOnExecute = false, onError } = options

  const asyncState = useAsyncState(apiFunction, initialState, {
    immediate,
    resetOnExecute,
    onError: error => {
      // Handle API errors
      if (error instanceof ApiError) {
        console.error(`API Error [${error.status}]:`, error.message)
        onError?.(error)
      } else {
        console.error('Unexpected error:', error)
      }
    },
  })

  return asyncState
}
