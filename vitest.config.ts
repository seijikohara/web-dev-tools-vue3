import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Test environment
      environment: 'happy-dom',

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
