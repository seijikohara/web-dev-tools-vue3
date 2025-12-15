---
paths: src/**/*.{ts,vue}
---

# TypeScript Guidelines

## Fundamental Principles

### Reference Compliance

- Always follow the latest TypeScript official documentation
- Consult the official reference before implementation
- Avoid deprecated patterns and legacy syntax

### Modern Syntax Enforcement

Always use the latest TypeScript syntax features:

```typescript
// ✅ Use `as const satisfies` for type-checked constants
export const CONFIG = {
  timeout: 30000,
  retries: 3,
} as const satisfies ConfigOptions

// ✅ Use `using` for resource management (TypeScript 5.2+)
using file = await openFile(path)

// ✅ Use Optional Chaining and Nullish Coalescing
const value = obj?.nested?.property ?? defaultValue

// ✅ Use `import type` for type-only imports
import type { ComponentProps } from 'vue'
```

## Type Definition Patterns

### Interface vs Type

```typescript
// Prefer interface for object shapes
interface DataModel {
  id: string
  name: string
  value: number
}

// Use type for unions, intersections, mapped types
type Status = 'pending' | 'active' | 'completed'
type Nullable<T> = T | null
```

### Constants and Derived Types

```typescript
// Type-checked constant with full inference
export const OPTIONS = ['option1', 'option2', 'option3'] as const

// Derive type from constant
export type OptionType = (typeof OPTIONS)[number]

// Object constant with satisfies
export const OPTION_INFO = {
  option1: { label: 'First', value: 1 },
  option2: { label: 'Second', value: 2 },
} as const satisfies Record<OptionType, { label: string; value: number }>
```

### Discriminated Unions

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

### Result Pattern

```typescript
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E }

const parse = <T>(input: string): Result<T> => {
  try {
    return { ok: true, value: JSON.parse(input) as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
```

## Type Assertions

### Safe Type Assertions

```typescript
// Prefer type guards over assertions
const isString = (value: unknown): value is string =>
  typeof value === 'string'

// Use satisfies for inference + checking
const config = {
  baseURL: '/api/',
  timeout: 30000,
} as const satisfies Config

// For dynamic index access, use Record type
const map: Record<string, string> = { a: '1', b: '2' }
return (map as Record<string, string>)[key] ?? 'default'
```

### Avoid These Patterns

```typescript
// ❌ Non-null assertion (forbidden: @typescript-eslint/no-non-null-assertion)
const value = array.find(x => x.id === id)!

// ✅ Use fallback
const value = array.find(x => x.id === id) ?? defaultValue

// ✅ Or throw explicit error
const value = array.find(x => x.id === id)
if (!value) throw new Error(`Item not found`)

// ❌ Unnecessary condition (forbidden: @typescript-eslint/no-unnecessary-condition)
const map = { a: 1 } as const
return map[key as keyof typeof map] ?? 'default'

// ✅ Widen type to allow dynamic access
return (map as Record<string, number>)[key] ?? 0
```

## Function Patterns

### Arrow Functions with Explicit Types

```typescript
// Export functions with explicit return types
export const transform = (input: string): string =>
  input.toUpperCase()

// Internal functions can use inference
const helper = (x: number) => x * 2
```

### Higher-Order Functions

```typescript
const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => R,
  errorRef: Ref<string | null>,
  defaultMessage: string,
) => (...args: T): R => {
  errorRef.value = null
  try {
    return fn(...args)
  } catch (e) {
    errorRef.value = e instanceof Error ? e.message : defaultMessage
    throw e
  }
}
```

### Early Returns (Mandatory)

Always use early returns to reduce nesting. Never use `else` after a return statement:

```typescript
// ❌ Avoid nested conditionals
const processData = (input: string | null): Result => {
  if (input) {
    if (input.length <= MAX_LENGTH) {
      return { data: transform(input) }
    } else {
      return { error: 'Too long' }
    }
  } else {
    return { error: 'Empty input' }
  }
}

// ✅ Use early returns
const processData = (input: string | null): Result => {
  if (!input) return { error: 'Empty input' }
  if (input.length > MAX_LENGTH) return { error: 'Too long' }
  return { data: transform(input) }
}
```

### Method Chaining (Mandatory)

Use method chaining instead of imperative loops for data transformation. Never use `for` or `while`:

```typescript
// ❌ Avoid imperative loops for data transformation
const result: number[] = []
for (const item of items) {
  if (item.active) {
    result.push(item.value * 2)
  }
}

// ✅ Use method chaining for transformation
const result = items
  .filter(item => item.active)
  .map(item => item.value * 2)

// ✅ Use reduce for aggregation
const total = items
  .filter(item => item.active)
  .reduce((sum, item) => sum + item.value, 0)
```

### forEach for Side Effects

Use `forEach` when performing side effects without producing a new value:

```typescript
// ✅ forEach is appropriate for side effects (no return value needed)
items.forEach(item => item.reset())
nodes.forEach(node => traverse(node, depth + 1))
Object.values(operations).forEach(op => op.cleanup())

// ❌ Avoid forEach when building a new array (use map instead)
const result: string[] = []
items.forEach(item => result.push(item.name))

// ✅ Prefer map for transformation
const result = items.map(item => item.name)
```

## Error Handling

### Custom Error Classes

```typescript
export class CustomError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'CustomError'
  }
}
```

### Error Message Extraction

```typescript
const getErrorMessage = (e: unknown, fallback = 'Unknown error'): string => {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  return fallback
}
```

## Generics

### Constrained Generics

```typescript
interface ApiEndpoint<T extends Record<string, unknown>> {
  url: string
  transform: (data: unknown) => T
}
```

### Mapped Types

```typescript
type PartialOptions<T> = {
  [K in keyof T]?: T[K]
}
```

## Code Organization

### Immutability

- Prefer `const` over `let`
- Never use `var`
- Use `readonly` types where applicable
- Avoid mutating function parameters

### General Principles

- Group imports: external → internal → types
- Export types separately from runtime code
- Keep functions small and focused (single responsibility)
- Use descriptive variable names over comments

## Module Organization

### Import Order

```typescript
// 1. External imports
import { ref, computed } from 'vue'
import axios from 'axios'

// 2. Internal imports (using @ alias)
import { feature } from '@/composables/useFeature'

// 3. Type imports (separate)
import type { Ref } from 'vue'
import type { FeatureType } from '@/composables/useFeature'
```

### Named Exports

```typescript
// Prefer named exports over default
export const helper = () => { ... }
export const CONSTANT = 'value'
export type MyType = { ... }
```

## String Handling

### Template Literals (Mandatory)

Always use template literals for string construction. Never use string concatenation:

```typescript
// ❌ Avoid string concatenation
const message = 'Hello, ' + name + '!'
const path = baseUrl + '/api/' + endpoint

// ✅ Use template literals
const message = `Hello, ${name}!`
const path = `${baseUrl}/api/${endpoint}`
```

### Multiline Strings (Mandatory)

Never use `\n` for line breaks. Always use template literals with actual line breaks:

```typescript
// ❌ Avoid escape sequences for newlines
const text = 'Line 1\nLine 2\nLine 3'
const sql = 'SELECT *\nFROM users\nWHERE active = true'

// ✅ Use template literals with actual line breaks
const text = `Line 1
Line 2
Line 3`

const sql = `
  SELECT *
  FROM users
  WHERE active = true
`

// ✅ For dynamic multiline content, use array join
const lines = [
  `Name: ${user.name}`,
  `Email: ${user.email}`,
  `Role: ${user.role}`,
].join('\n')
```

### Tagged Template Literals

Use tagged templates for specialized string processing:

```typescript
// ✅ Use tagged templates for SQL, HTML, etc.
const query = sql`SELECT * FROM ${table} WHERE id = ${id}`
const markup = html`<div class="${className}">${content}</div>`
```

## Documentation

All code comments, commit messages, and documentation must follow:

- **Language**: English only
- **Tone**: Formal and professional (avoid casual expressions)
- **Objectivity**: State facts only; no subjective opinions

```typescript
// ❌ Avoid
// This is a really nice helper  (subjective)
// Just a quick fix              (casual)
// この関数は...                  (non-English)

// ✅ Preferred
// Converts timestamp to ISO 8601 format
// Resolves edge case in date parsing
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Functions | camelCase | `transformData` |
| Types/Interfaces | PascalCase | `ApiResponse` |
| Components | PascalCase | `MyComponent.vue` |
| Composables | use + PascalCase | `useFeature.ts` |
| Stores | camelCase or use + PascalCase | `ui.ts`, `useSettingsStore.ts` |
| Other Files | kebab-case | `api-client.ts` |
