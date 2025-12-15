# Web Dev Tools Vue3 - Project Instructions

## Project Overview

A collection of web development tools built with Vue 3, TypeScript, and PrimeVue.

See @README.md for detailed project documentation.
See @package.json for available npm commands and dependencies.

## Quick Reference

### Development Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Type-check and build for production
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint with auto-fix
npm run format       # Run Prettier formatting
npm run test         # Run unit tests in watch mode (Vitest)
npm run test:run     # Run unit tests once
npm run test:e2e     # Run Playwright E2E tests
```

### Project Structure

```
src/
├── api/              # API client and endpoint definitions
├── components/       # Reusable Vue components
├── composables/      # Vue Composition API composables
├── constants/        # Application constants
├── router/           # Vue Router configuration
├── stores/           # Pinia state management
├── types/            # TypeScript type definitions
├── views/            # Page components (organized by category)
└── workers/          # Web Workers
e2e/                  # Playwright E2E tests
```

## Technology Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript (strict mode)
- **Build**: Vite
- **UI Library**: PrimeVue
- **State**: Pinia
- **Router**: Vue Router
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint + Prettier
- **HTTP Client**: Axios
- **Utilities**: @vueuse/core, dayjs, crypto-js

## Architecture Principles

### Pure Functions First

Extract business logic as pure functions for testability:

```typescript
// Pure function (exported for testing)
export const transformData = (input: string): Result => { ... }

// Composable wraps pure functions with reactive state
export const useTransformer = () => {
  const input = ref('')
  const output = computed(() => transformData(input.value))
  return { input, output }
}
```

### Higher-Order Functions for Cross-Cutting Concerns

```typescript
const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => R,
  errorRef: Ref<string | null>,
  defaultMessage: string,
) => (...args: T): R => { ... }
```

### Type Safety

- Enable strict mode in tsconfig
- Use `as const` with `satisfies` for type-checked constants
- Derive types from constants: `type X = (typeof OPTIONS)[number]`
- Avoid `any`, use `unknown` for truly unknown types
- Prefer explicit return types on exported functions

### Component Composition

- Single responsibility per component
- Slot-based composition over prop drilling
- PrimeVue components for consistent UI
- Scoped styles with CSS custom properties

## Import Aliases

```typescript
import { useFeature } from '@/composables/useFeature'
import MyComponent from '@/components/MyComponent.vue'
import type { MyType } from '@/types'
```

## Key Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MyComponent.vue` |
| Composables | use + PascalCase | `useFeature.ts` |
| Pure Functions | camelCase | `transformData` |
| Constants | UPPER_SNAKE_CASE | `OPTIONS`, `CONFIG` |
| Types/Interfaces | PascalCase | `MyResult`, `ApiResponse` |

### Code Style

- 2-space indentation
- Single quotes, no semicolons
- Trailing commas in multiline

**Mandatory Rules:**

- **Method chaining**: Always use `.filter()`, `.map()`, `.reduce()` instead of `for`, `while`, `forEach`
- **Early returns**: Always use early returns; never use `else` after return
- **Template literals**: Always use template literals for string interpolation
- **No `\n`**: Never use `\n` escape; use actual line breaks in template literals
- **Latest syntax**: Always use modern TypeScript features (`as const satisfies`, optional chaining, etc.)

### Error Handling

- Use custom error classes for domain errors
- Expose error state as `Ref<string | null>`
- Type guards: `e instanceof Error ? e.message : String(e)`
- Never use non-null assertion (`!`) - forbidden by lint

### Documentation

All documentation (including code comments, commit messages, PR descriptions) must:

- **Language**: Always use English
- **Tone**: Use formal, professional language (avoid casual expressions)
- **Objectivity**: State facts only; avoid subjective opinions or evaluations

Examples:

```typescript
// ❌ Avoid
// This is a really nice helper function that makes things easier
// TODO: Fix this ugly hack later

// ✅ Preferred
// Converts Unix timestamp to ISO 8601 format
// TODO: Refactor to handle timezone conversion
```

### Git Commits

Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
