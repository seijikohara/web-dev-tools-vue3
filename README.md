# Web Development Tools

[![GitHub Actions](https://github.com/seijikohara/web-dev-tools-vue3/actions/workflows/ci.yml/badge.svg)](https://github.com/seijikohara/web-dev-tools-vue3/actions)
![Last Commit](https://img.shields.io/github/last-commit/seijikohara/web-dev-tools-vue3)
![GitHub top language](https://img.shields.io/github/languages/top/seijikohara/web-dev-tools-vue3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive collection of web development utilities built with Vue 3, TypeScript, and Vite. This application provides essential tools for common development tasks including data formatting, encoding, hashing, and information retrieval.

## Core Features

### Information Retrieval
- **Dashboard**: System and network diagnostics including User Agent parsing, IP address resolution, geolocation data, RDAP queries, and HTTP header inspection

### Data Formatting and Transformation
- **JSON Formatter**: JSON validation, formatting, and beautification with syntax highlighting
- **XML Formatter**: XML document formatting and structure visualization
- **JSON to TypeScript**: Automatic TypeScript interface generation from JSON schemas

### Encoding and Hashing
- **URL Encoding**: Bidirectional URL encoding and decoding utilities
- **Hash Generator**: Cryptographic hash generation (MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512)
- **BCrypt Hash**: Secure password hashing and verification using BCrypt algorithm

### Text Processing
- **HTML Entities**: HTML entity reference lookup and conversion utilities
- **Markdown Editor**: Real-time Markdown rendering with live preview

## Technology Stack

### Core Framework
- **Frontend**: Vue 3 (Composition API)
- **Language**: TypeScript (strict mode)
- **Build System**: Vite 7.x

### UI and Styling
- **Component Library**: PrimeVue 4.x
- **CSS Framework**: PrimeFlex 4.x
- **Icons**: PrimeIcons 7.x
- **Theme System**: PrimeUix Themes

### Architecture
- **State Management**: Pinia 3.x
- **Routing**: Vue Router 4.x
- **Composables**: VueUse utilities

### Quality Assurance
- **Testing Framework**: Playwright 1.x (end-to-end)
- **API Mocking**: Mock Service Worker (MSW) 2.x
- **Linting**: ESLint 9.x with TypeScript support
- **Code Formatting**: Prettier 3.x

### Utilities and Libraries
- **HTTP Client**: Axios
- **Date/Time**: Day.js
- **Security**: DOMPurify (XSS prevention), bcryptjs (password hashing), crypto-js
- **Code Editor**: vue3-ace-editor (ACE integration)
- **Markdown**: marked (parsing and rendering)
- **XML**: xml-formatter

## Recommended IDE Setup

### Visual Studio Code (Recommended)

[Visual Studio Code](https://code.visualstudio.com/) with the following extensions:

- **[Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)** (formerly known as Volar) - The official Vue language support extension that provides:
  - TypeScript support for Vue Single File Components (SFCs)
  - Syntax highlighting and IntelliSense
  - Type checking and error diagnostics
  - Auto-completion for template expressions and component props
  - Code formatting and refactoring tools

**Note**: Vetur (the previous Vue 2 extension) must be disabled in Vue 3 projects to prevent conflicts with Vue - Official extension.

### Alternative IDEs

- **[WebStorm](https://www.jetbrains.com/webstorm/)** - Built-in TypeScript and Vue support with Volar integration (version 2023.2+)

## Type Support for `.vue` Imports in TypeScript

TypeScript cannot handle type information for `.vue` imports by default. This project uses `vue-tsc` (a TypeScript CLI wrapper) for type checking Vue components.

The **Vue - Official** extension automatically provides TypeScript language service support for `.vue` files in your editor, enabling:
- Type inference for component props, emits, and slots
- Import path auto-completion
- Type checking in template expressions
- Jump to definition for components and composables

## Prerequisites

- Node.js >= 22.0.0
- npm >= 11.0.0

## Installation

Install project dependencies using npm:

```sh
npm install
```

For Playwright browser binaries (required for E2E testing):

```sh
npm run test:e2e:install
```

## Development Commands

### Development Server

```sh
# Start local development server with HMR
npm run dev

# Start development server accessible on local network
npm run dev:host

# Enable continuous type checking
npm run type-check:watch
```

### Production Build

```sh
# Full production build with type checking
npm run build

# Build without type checking (faster, use cautiously)
npm run build-only

# Generate bundle analysis report
npm run build:analyze

# Serve production build locally
npm run preview
```

### Testing

```sh
# Execute end-to-end test suite
npm run test:e2e

# Launch Playwright UI for interactive testing
npm run test:e2e:ui

# Run tests with visible browser windows
npm run test:e2e:headed

# Start debugging session for test development
npm run test:e2e:debug

# Display HTML test results report
npm run test:e2e:report

# Launch Playwright test generator
npm run test:e2e:codegen

# Install required browser binaries
npm run test:e2e:install
```

### Code Quality

```sh
# Perform TypeScript type checking
npm run type-check

# Lint source code with automatic fixes
npm run lint

# Lint without modifying files
npm run lint:check

# Format code using Prettier
npm run format

# Verify code formatting compliance
npm run format:check
```

### Project Maintenance

```sh
# Remove build artifacts and cache files
npm run clean

# Audit for available dependency updates
npm run deps:check

# Update all dependencies to latest versions
npm run deps:update
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable Vue components
├── composables/      # Vue Composition API logic
├── constants/        # Application constants
├── router/           # Vue Router configuration
├── stores/           # Pinia stores (state management)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── views/            # Tool feature views
└── assets/           # Static assets and styles
```

## Environment Configuration

The application requires environment-specific configuration. Create a `.env` file in the project root directory using `.env.example` as a template:

```env
VUE_APP_API_BASE_URL=       # Base URL for API endpoints
VUE_APP_HISTORY_MODE=       # Vue Router history mode (hash|history)
VUE_APP_GA_MEASUREMENT_ID=  # Google Analytics measurement ID (optional)
```

## Testing Strategy

The project implements end-to-end testing using Playwright with the following capabilities:

- **Cross-browser compatibility**: Chromium, Firefox, WebKit, and mobile viewport emulation (Pixel 5, iPhone 13)
- **API isolation**: Mock Service Worker (MSW) implementation for deterministic API responses
- **Continuous integration**: Automated test execution via GitHub Actions
- **Coverage scope**: Critical user flows and per-tool functional validation

### Test Organization

```
e2e/
├── critical/    # Essential application functionality tests
├── tools/       # Individual tool-specific test suites
└── fixtures/    # Shared test utilities and API mock configurations
```

## Continuous Integration

GitHub Actions workflows are configured for automated quality assurance:

- **ci.yml**: Build verification and type checking across Node.js 22.x and 24.x
- **playwright.yml**: Multi-browser end-to-end test execution
- **auto-merge-dependabot.yml**: Automated dependency update integration

## Build Configuration

The project uses Vite as its build tool. For advanced configuration options, refer to the [Vite Configuration Reference](https://vitejs.dev/config/).

Build configuration can be customized in `vite.config.ts`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
