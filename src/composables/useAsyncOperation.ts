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
 * Pure function: Convert unknown error to Error instance
 */
const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)))

/**
 * Pure function: Extract error message from Error or use fallback
 */
const getErrorMessage = (err: Error, fallback?: string): string => fallback ?? err.message

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
      const err = toError(e)
      error.value = getErrorMessage(err, errorMessage)
      onError?.(err)
      return null
    } finally {
      isLoading.value = false
      onFinally?.()
    }
  }

  const reset = () => {
    data.value = null
    isLoading.value = false
    error.value = null
    hasExecuted.value = false
  }

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
 * Pure function: Check if any operation is loading
 */
const checkAnyLoading = (operations: Record<string, UseAsyncOperationReturn<unknown>>): boolean =>
  Object.values(operations).some(op => op.isLoading.value)

/**
 * Pure function: Check if any operation has error
 */
const checkAnyError = (operations: Record<string, UseAsyncOperationReturn<unknown>>): boolean =>
  Object.values(operations).some(op => op.error.value !== null)

/**
 * Pure function: Create proxied operation with state update callbacks
 */
const createProxiedOperation = <T>(
  op: UseAsyncOperationReturn<T>,
  onStateChange: () => void,
): UseAsyncOperationReturn<T> => ({
  ...op,
  execute: async (...args: Parameters<typeof op.execute>) => {
    const result = await op.execute(...args)
    onStateChange()
    return result
  },
})

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

  const updateSharedState = () => {
    isAnyLoading.value = checkAnyLoading(operations)
    hasAnyError.value = checkAnyError(operations)
  }

  const proxiedOperations = Object.fromEntries(
    Object.entries(operations).map(([key, op]) => [
      key,
      createProxiedOperation(op, updateSharedState),
    ]),
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
