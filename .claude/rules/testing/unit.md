---
paths: src/**/*.test.ts
---

# Unit Testing Guidelines (Vitest)

## File Location

Tests are co-located with source files in `__tests__` directories:

```
src/composables/
├── useFeature.ts
└── __tests__/
    └── useFeature.test.ts
```

## Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  pureFunction,
  CONSTANTS,
  useFeature,
} from '../useFeature'

describe('useFeature', () => {
  // ============================================================
  // Pure Functions (test first)
  // ============================================================

  describe('pureFunction', () => {
    it('should handle normal input', () => {
      expect(pureFunction('input')).toBe('expected')
    })

    it('should handle edge cases', () => {
      expect(pureFunction('')).toBe('')
    })
  })

  // ============================================================
  // Constants
  // ============================================================

  describe('CONSTANTS', () => {
    it('should have expected values', () => {
      expect.soft(CONSTANTS).toContain('value1')
      expect.soft(CONSTANTS).toContain('value2')
    })
  })

  // ============================================================
  // Composable
  // ============================================================

  describe('composable behavior', () => {
    let instance: ReturnType<typeof useFeature>

    beforeEach(() => {
      instance = useFeature()
    })

    it('should initialize with default values', () => {
      expect.soft(instance.input.value).toBe('')
      expect.soft(instance.isLoading.value).toBe(false)
    })

    it('should update computed when input changes', async () => {
      instance.input.value = 'test'
      await Promise.resolve() // Wait for computed

      expect(instance.output.value).toBe('expected')
    })

    it('should handle actions', () => {
      instance.execute()
      expect(instance.isLoading.value).toBe(true)
    })
  })
})
```

## Best Practices

### Use `expect.soft` for Multiple Assertions

```typescript
it('should return correct data', () => {
  const result = process('input')
  expect.soft(result.field1).toBe('value1')
  expect.soft(result.field2).toBe('value2')
  expect.soft(result.field3).toBe('value3')
})
```

### Test Organization Order

1. Pure functions - No setup needed
2. Constants - Verify shape
3. Composable state - Test initialization
4. Composable reactivity - Test computed
5. Composable actions - Test functions

### Async Reactivity Testing

```typescript
it('should update computed', async () => {
  const { input, output } = useFeature()
  input.value = 'test'
  await Promise.resolve()
  expect(output.value).toBe('expected')
})
```

### Mocking

```typescript
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: mockData }),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})
```

### Testing Errors

```typescript
it('should set error on invalid input', () => {
  const { validate, error } = useFeature()
  validate('invalid')
  expect(error.value).toBe('Invalid input')
})

it('should throw for malformed data', () => {
  expect(() => parse('{')).toThrow()
})
```

## Running Tests

```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:ui     # Visual UI
```

## Common Matchers

```typescript
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()
expect(value).toBeNull()
expect(str).toContain('substring')
expect(array).toHaveLength(n)
expect(obj).toHaveProperty('key')
expect(() => fn()).toThrow()
```
