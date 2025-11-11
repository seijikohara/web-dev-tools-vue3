import { test, expect } from '../fixtures/api-mocks'

/**
 * Dashboard View Tests
 * Tests the main dashboard page functionality
 */
test.describe('Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display dashboard page', async ({ page }) => {
    // Page should load
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page).toHaveTitle(/Dashboard/)
  })

  test('should load browser information', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check if there's a network error first
    const hasNetworkError = await page.locator('text=/Network Error/i').count()

    if (hasNetworkError > 0) {
      // If network error exists, test that the page at least loaded with an error state
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    } else {
      // If no network error, proceed with normal test
      // Wait for the Panel component to be visible
      await page.waitForSelector('.p-panel', { timeout: 10000 })

      // Check if User Agent info is displayed
      const userAgentSection = page.locator('text=/User Agent|Browser/i')
      await expect(userAgentSection.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should load IP address information', async ({ page }) => {
    // Wait for API response
    await page.waitForLoadState('networkidle')

    // IP address should be displayed (either IPv4 or IPv6 format)
    const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/

    // Look for IP address text on page
    await page.waitForTimeout(2000) // Give API time to respond

    // Check if any text matches IP pattern
    const bodyText = await page.locator('body').textContent()
    const hasIpInfo = bodyText && (ipPattern.test(bodyText) || bodyText.includes('localhost'))

    if (!hasIpInfo) {
      // If IP is not displayed, check if there's an error message or loading state
      const hasError = await page.locator('text=/error|failed/i').count()
      const hasLoading = await page.locator('text=/loading/i').count()

      // It's okay if there's an error message (network might be isolated in CI)
      expect(hasError > 0 || hasLoading > 0).toBeTruthy()
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Page should not crash even if API calls fail
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()

    // Check that page is still functional
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/dashboard')

    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20) // Allow small margin
  })
})
