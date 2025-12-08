import { ref, readonly, type Ref, type DeepReadonly } from 'vue'

/**
 * Options for async operation execution
 */
export interface AsyncOperationOptions {
  /** Custom error message to show instead of the original error */
  errorMessage?: string
  /** Callback to run on success */
  onSuccess?: () => void
  /** Callback to run on error */
  onError?: (error: Error) => void
  /** Callback to run on completion (success or error) */
  onFinally?: () => void
}

/**
 * Return type for useAsyncOperation composable
 */
export interface UseAsyncOperationReturn<T> {
  /** Current data from the last successful operation */
  data: DeepReadonly<Ref<T | null>>
  /** Loading state */
  isLoading: DeepReadonly<Ref<boolean>>
  /** Error message from the last failed operation */
  error: DeepReadonly<Ref<string | null>>
  /** Whether the operation has been executed at least once */
  hasExecuted: DeepReadonly<Ref<boolean>>
  /** Execute an async operation */
  execute: (operation: () => Promise<T>, options?: AsyncOperationOptions) => Promise<T | null>
  /** Reset the state to initial values */
  reset: () => void
  /** Clear the error state */
  clearError: () => void
}

/**
 * Composable for handling async operations with loading and error states
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, execute } = useAsyncOperation<User[]>()
 *
 * // Execute an async operation
 * await execute(async () => {
 *   const response = await api.getUsers()
 *   return response.data
 * })
 *
 * // With options
 * await execute(
 *   () => api.deleteUser(id),
 *   {
 *     errorMessage: 'Failed to delete user',
 *     onSuccess: () => showToast('User deleted'),
 *     onError: (err) => console.error(err)
 *   }
 * )
 * ```
 */
export const useAsyncOperation = <T>(): UseAsyncOperationReturn<T> => {
  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasExecuted = ref(false)

  /**
   * Execute an async operation with automatic loading and error handling
   */
  const execute = async (
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {},
  ): Promise<T | null> => {
    const { errorMessage, onSuccess, onError, onFinally } = options

    isLoading.value = true
    error.value = null
    hasExecuted.value = true

    try {
      const result = await operation()
      data.value = result
      onSuccess?.()
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = errorMessage ?? err.message
      onError?.(err)
      return null
    } finally {
      isLoading.value = false
      onFinally?.()
    }
  }

  /**
   * Reset the state to initial values
   */
  const reset = () => {
    data.value = null
    isLoading.value = false
    error.value = null
    hasExecuted.value = false
  }

  /**
   * Clear the error state
   */
  const clearError = () => {
    error.value = null
  }

  return {
    data: readonly(data),
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasExecuted: readonly(hasExecuted),
    execute,
    reset,
    clearError,
  }
}

/**
 * Create multiple async operations with shared loading state
 *
 * @example
 * ```typescript
 * const { isAnyLoading, operations } = useMultipleAsyncOperations({
 *   fetchUsers: useAsyncOperation<User[]>(),
 *   fetchPosts: useAsyncOperation<Post[]>(),
 * })
 * ```
 */
export const useMultipleAsyncOperations = <
  T extends Record<string, UseAsyncOperationReturn<unknown>>,
>(
  operations: T,
): {
  operations: T
  isAnyLoading: Ref<boolean>
  hasAnyError: Ref<boolean>
  resetAll: () => void
} => {
  const isAnyLoading = ref(false)
  const hasAnyError = ref(false)

  // Watch for loading state changes
  const checkLoadingState = () => {
    isAnyLoading.value = Object.values(operations).some(op => op.isLoading.value)
  }

  const checkErrorState = () => {
    hasAnyError.value = Object.values(operations).some(op => op.error.value !== null)
  }

  // Create proxied operations that update shared state
  const proxiedOperations = Object.fromEntries(
    Object.entries(operations).map(([key, op]) => {
      const originalExecute = op.execute
      return [
        key,
        {
          ...op,
          execute: async (...args: Parameters<typeof originalExecute>) => {
            const result = await originalExecute(...args)
            checkLoadingState()
            checkErrorState()
            return result
          },
        },
      ]
    }),
  ) as T

  const resetAll = () => {
    Object.values(operations).forEach(op => op.reset())
    isAnyLoading.value = false
    hasAnyError.value = false
  }

  return {
    operations: proxiedOperations,
    isAnyLoading,
    hasAnyError,
    resetAll,
  }
}
