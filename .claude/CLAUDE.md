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

## Rules Reference

Detailed guidelines are organized in the `rules/` directory:

| Category | File | Description |
|----------|------|-------------|
| **TypeScript** | @rules/typescript.md | Type patterns, pure functions, error handling, code style |
| **API** | @rules/api.md | HTTP client, error handling, endpoint definitions |
| **Vue Components** | @rules/vue/components.md | Component structure, props, slots |
| **Composables** | @rules/vue/composables.md | Composition API patterns |
| **Stores** | @rules/vue/stores.md | Pinia state management |
| **Views** | @rules/vue/views.md | Page component guidelines |
| **Unit Testing** | @rules/testing/unit.md | Vitest patterns |
| **E2E Testing** | @rules/testing/e2e.md | Playwright patterns |
| **Git** | @rules/general/git.md | Commit message format |
| **Pull Requests** | @rules/general/pr.md | PR guidelines and checklist |

## Key Principles

- **Pure functions first**: Extract business logic as testable pure functions
- **Single responsibility**: Each component/function does one thing well
- **Documentation**: English only, formal tone, objective facts only

For code style, naming conventions, and detailed patterns, see @rules/typescript.md.
