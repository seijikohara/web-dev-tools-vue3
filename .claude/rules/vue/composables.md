---
paths: src/composables/**/*.ts
---

# Composable Design Guidelines

## File Naming

- File: `useXxxx.ts`
- Export: `useXxxx` function as named export

See @rules/typescript.md for general naming conventions.

## Structure Pattern

```typescript
import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'

// ============================================================
// Constants (exported for external use)
// ============================================================
export const OPTIONS = ['option1', 'option2', 'option3'] as const
export type OptionType = (typeof OPTIONS)[number]

// ============================================================
// Pure Functions (exported for testing)
// ============================================================
export const transformData = (input: string, option: OptionType): string => {
  // Pure function - no side effects, same input = same output
  return /* transformation */
}

export const validateInput = (input: string): boolean => {
  return input.length > 0
}

// ============================================================
// Return Type Interface
// ============================================================
interface UseFeatureReturn {
  input: Ref<string>
  output: ComputedRef<string>
  selectedOption: Ref<OptionType>
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  execute: () => Promise<void>
  clear: () => void
}

// ============================================================
// Composable Function
// ============================================================
export const useFeature = (): UseFeatureReturn => {
  const input = ref('')
  const selectedOption = ref<OptionType>('option1')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const output = computed(() =>
    input.value ? transformData(input.value, selectedOption.value) : ''
  )

  const execute = async () => {
    isLoading.value = true
    error.value = null
    try {
      // async operation
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  const clear = () => {
    input.value = ''
    error.value = null
  }

  return {
    input,
    output,
    selectedOption,
    isLoading: readonly(isLoading),
    error: readonly(error),
    execute,
    clear,
  }
}
```

## Best Practices

### Pure Functions

- Extract pure logic as separate exported functions
- Enables independent unit testing without Vue context
- Allows reuse in non-Vue environments

### State Management

- Use `ref` for primitive values
- Use `computed` for derived values
- Wrap internal state with `readonly()` in return

### Error Handling

- Expose error as `Ref<string | null>`
- Clear errors at start of new operations
- See @rules/typescript.md for error extraction patterns

### Loading States

- Track async operations with `isLoading` ref
- Set loading true before, false in finally block

### Cleanup

```typescript
import { onUnmounted } from 'vue'

export const useTimer = () => {
  let intervalId: ReturnType<typeof setInterval> | null = null

  const start = () => {
    intervalId = setInterval(() => { /* ... */ }, 1000)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onUnmounted(stop)

  return { start, stop }
}
```

## Testing

Location: `src/composables/__tests__/useXxxx.test.ts`
- Test pure functions independently
- Test composable state initialization
- Test computed value reactivity
- Test action side effects
