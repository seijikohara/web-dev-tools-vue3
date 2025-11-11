import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined, // 2 workers in CI, automatic locally

  // Retry on failures (CI only)
  retries: process.env.CI ? 2 : 0,

  // Timeout configuration
  timeout: 60 * 1000, // 60 seconds - increased for CI environment with slower API responses
  expect: {
    timeout: 15000, // 15 seconds - reasonable balance for API-dependent tests in CI
  },

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output for CI
  ],

  // Shared settings
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry', // Record trace on first retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Viewport settings
    viewport: { width: 1280, height: 720 },
  },

  // Browser projects for regression detection
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing (optional)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Auto-start development server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
