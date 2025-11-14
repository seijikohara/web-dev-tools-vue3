import { test as base, expect } from '@playwright/test'
import { setupApiMocks } from './api-mocks'

/**
 * Custom Test Fixtures
 */

type CustomFixtures = {
  pageWithMocks: typeof base.prototype.page
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
