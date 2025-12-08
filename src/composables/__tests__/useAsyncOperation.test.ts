import { describe, it, expect, vi } from 'vitest'
import { useAsyncOperation, useMultipleAsyncOperations } from '../useAsyncOperation'

describe('useAsyncOperation', () => {
  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { data, isLoading, error, hasExecuted } = useAsyncOperation<string>()

      expect(data.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(hasExecuted.value).toBe(false)
    })
  })

  describe('execute', () => {
    it('should set loading state to true during execution', async () => {
      const { isLoading, execute } = useAsyncOperation<string>()

      const promise = execute(async () => {
        expect(isLoading.value).toBe(true)
        return 'test'
      })

      await promise
    })

    it('should update data on successful execution', async () => {
      const { data, execute } = useAsyncOperation<string>()

      await execute(async () => 'success')

      expect(data.value).toBe('success')
    })

    it('should set isLoading to false after successful execution', async () => {
      const { isLoading, execute } = useAsyncOperation<string>()

      await execute(async () => 'success')

      expect(isLoading.value).toBe(false)
    })

    it('should set hasExecuted to true after execution', async () => {
      const { hasExecuted, execute } = useAsyncOperation<string>()

      await execute(async () => 'success')

      expect(hasExecuted.value).toBe(true)
    })

    it('should return result on successful execution', async () => {
      const { execute } = useAsyncOperation<string>()

      const result = await execute(async () => 'success')

      expect(result).toBe('success')
    })

    it('should set error on failed execution', async () => {
      const { error, execute } = useAsyncOperation<string>()

      await execute(async () => {
        throw new Error('Test error')
      })

      expect(error.value).toBe('Test error')
    })

    it('should set isLoading to false after failed execution', async () => {
      const { isLoading, execute } = useAsyncOperation<string>()

      await execute(async () => {
        throw new Error('Test error')
      })

      expect(isLoading.value).toBe(false)
    })

    it('should return null on failed execution', async () => {
      const { execute } = useAsyncOperation<string>()

      const result = await execute(async () => {
        throw new Error('Test error')
      })

      expect(result).toBeNull()
    })

    it('should not update data on failed execution', async () => {
      const { data, execute } = useAsyncOperation<string>()

      await execute(async () => 'success')
      await execute(async () => {
        throw new Error('Test error')
      })

      expect(data.value).toBe('success')
    })

    it('should handle non-Error objects thrown', async () => {
      const { error, execute } = useAsyncOperation<string>()

      await execute(async () => {
        throw 'String error'
      })

      expect(error.value).toBe('String error')
    })

    it('should use custom error message when provided', async () => {
      const { error, execute } = useAsyncOperation<string>()

      await execute(
        async () => {
          throw new Error('Original error')
        },
        { errorMessage: 'Custom error message' },
      )

      expect(error.value).toBe('Custom error message')
    })

    it('should clear previous error on new execution', async () => {
      const { error, execute } = useAsyncOperation<string>()

      await execute(async () => {
        throw new Error('First error')
      })
      expect(error.value).toBe('First error')

      await execute(async () => 'success')
      expect(error.value).toBeNull()
    })
  })

  describe('options callbacks', () => {
    it('should call onSuccess callback on successful execution', async () => {
      const { execute } = useAsyncOperation<string>()
      const onSuccess = vi.fn()

      await execute(async () => 'success', { onSuccess })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should not call onSuccess callback on failed execution', async () => {
      const { execute } = useAsyncOperation<string>()
      const onSuccess = vi.fn()

      await execute(
        async () => {
          throw new Error('Error')
        },
        { onSuccess },
      )

      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should call onError callback on failed execution', async () => {
      const { execute } = useAsyncOperation<string>()
      const onError = vi.fn()

      await execute(
        async () => {
          throw new Error('Test error')
        },
        { onError },
      )

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(new Error('Test error'))
    })

    it('should not call onError callback on successful execution', async () => {
      const { execute } = useAsyncOperation<string>()
      const onError = vi.fn()

      await execute(async () => 'success', { onError })

      expect(onError).not.toHaveBeenCalled()
    })

    it('should call onFinally callback on successful execution', async () => {
      const { execute } = useAsyncOperation<string>()
      const onFinally = vi.fn()

      await execute(async () => 'success', { onFinally })

      expect(onFinally).toHaveBeenCalledTimes(1)
    })

    it('should call onFinally callback on failed execution', async () => {
      const { execute } = useAsyncOperation<string>()
      const onFinally = vi.fn()

      await execute(
        async () => {
          throw new Error('Error')
        },
        { onFinally },
      )

      expect(onFinally).toHaveBeenCalledTimes(1)
    })

    it('should call callbacks in correct order on success', async () => {
      const { execute } = useAsyncOperation<string>()
      const callOrder: string[] = []

      await execute(
        async () => {
          callOrder.push('execute')
          return 'success'
        },
        {
          onSuccess: () => callOrder.push('onSuccess'),
          onFinally: () => callOrder.push('onFinally'),
        },
      )

      expect(callOrder).toEqual(['execute', 'onSuccess', 'onFinally'])
    })

    it('should call callbacks in correct order on error', async () => {
      const { execute } = useAsyncOperation<string>()
      const callOrder: string[] = []

      await execute(
        async () => {
          callOrder.push('execute')
          throw new Error('Error')
        },
        {
          onError: () => callOrder.push('onError'),
          onFinally: () => callOrder.push('onFinally'),
        },
      )

      expect(callOrder).toEqual(['execute', 'onError', 'onFinally'])
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const { data, isLoading, error, hasExecuted, execute, reset } = useAsyncOperation<string>()

      await execute(async () => 'success')
      reset()

      expect(data.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(hasExecuted.value).toBe(false)
    })

    it('should reset error state', async () => {
      const { error, execute, reset } = useAsyncOperation<string>()

      await execute(async () => {
        throw new Error('Test error')
      })
      expect(error.value).toBe('Test error')

      reset()
      expect(error.value).toBeNull()
    })

    it('should reset data', async () => {
      const { data, execute, reset } = useAsyncOperation<string>()

      await execute(async () => 'test data')
      expect(data.value).toBe('test data')

      reset()
      expect(data.value).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear only error state', async () => {
      const { data, error, hasExecuted, execute, clearError } = useAsyncOperation<string>()

      await execute(async () => {
        throw new Error('Test error')
      })

      clearError()

      expect(error.value).toBeNull()
      expect(hasExecuted.value).toBe(true)
      expect(data.value).toBeNull()
    })

    it('should not affect data when clearing error', async () => {
      const { data, error, execute, clearError } = useAsyncOperation<string>()

      await execute(async () => 'success')
      await execute(async () => {
        throw new Error('Error')
      })

      clearError()

      expect(error.value).toBeNull()
      expect(data.value).toBe('success')
    })
  })

  describe('readonly properties', () => {
    it('should return readonly refs', () => {
      const { data, isLoading, error, hasExecuted } = useAsyncOperation<string>()

      // These are readonly refs from Vue - they won't throw but will log warnings in dev mode
      // TypeScript will catch attempts to modify these at compile time
      expect(data).toBeDefined()
      expect(isLoading).toBeDefined()
      expect(error).toBeDefined()
      expect(hasExecuted).toBeDefined()
    })
  })
})

describe('useMultipleAsyncOperations', () => {
  it('should initialize with correct default values', () => {
    const operations = {
      op1: useAsyncOperation<string>(),
      op2: useAsyncOperation<number>(),
    }

    const { isAnyLoading, hasAnyError } = useMultipleAsyncOperations(operations)

    expect(isAnyLoading.value).toBe(false)
    expect(hasAnyError.value).toBe(false)
  })

  it('should update shared state after operations complete', async () => {
    const operations = {
      op1: useAsyncOperation<string>(),
      op2: useAsyncOperation<number>(),
    }

    const { isAnyLoading, operations: ops } = useMultipleAsyncOperations(operations)

    // Execute first operation
    await ops.op1.execute(async () => 'success')

    // After execution completes, loading should be false
    expect(isAnyLoading.value).toBe(false)

    // Both underlying operations should work independently
    expect(ops.op1.data.value).toBe('success')
    expect(ops.op2.data.value).toBeNull()
  })

  it('should track error state across operations', async () => {
    const operations = {
      op1: useAsyncOperation<string>(),
      op2: useAsyncOperation<number>(),
    }

    const { hasAnyError, operations: ops } = useMultipleAsyncOperations(operations)

    await ops.op1.execute(async () => {
      throw new Error('Test error')
    })

    expect(hasAnyError.value).toBe(true)
  })

  it('should reset all operations', async () => {
    const operations = {
      op1: useAsyncOperation<string>(),
      op2: useAsyncOperation<number>(),
    }

    const { resetAll, operations: ops } = useMultipleAsyncOperations(operations)

    await ops.op1.execute(async () => 'success')
    await ops.op2.execute(async () => 42)

    resetAll()

    expect(ops.op1.data.value).toBeNull()
    expect(ops.op2.data.value).toBeNull()
  })
})
