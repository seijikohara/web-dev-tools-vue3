import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Browser Mode replaces the happy-dom environment with real Chromium,
      // driven headlessly through Playwright.
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
        headless: true,
      },

      // Include test files
      include: ['src/**/*.{test,spec}.{js,ts}'],

      // Global test setup
      globals: true,

      // Root directory
      root: fileURLToPath(new URL('./', import.meta.url)),

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/__tests__/**',
          'src/main.ts',
          'src/types/**',
          'src/constants/**',
        ],
      },

      // Reporters
      reporters: ['default'],

      // Timeout for tests
      testTimeout: 10000,
    },
  }),
)
