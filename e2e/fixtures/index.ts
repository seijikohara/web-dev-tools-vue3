import { test as base, expect, type Page } from '@playwright/test'
import { setupApiMocks } from './api-mocks'

/**
 * Custom Test Fixtures
 */

type CustomFixtures = {
  pageWithMocks: Page
}

/**
 * Extended test with API mocking support
 */
export const test = base.extend<CustomFixtures>({
  pageWithMocks: async ({ page }, use) => {
    await setupApiMocks(page)
    await use(page)
  },
})

export { expect }
