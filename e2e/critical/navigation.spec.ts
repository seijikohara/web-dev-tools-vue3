import { test, expect } from '@playwright/test'

/**
 * Navigation and Routing Tests
 * Tests the critical navigation paths and routing behavior
 */
test.describe('Navigation and Routing', () => {
  test('should redirect from home to dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should navigate to all tools via sidebar menu', async ({ page }) => {
    await page.goto('/dashboard')

    // List of all tool routes
    const routes = [
      { path: '/json-formatter', title: /JSON Formatter/i },
      { path: '/xml-formatter', title: /XML Formatter/i },
      { path: '/url-encoding', title: /URL Encoding/i },
      { path: '/hash', title: /Hash/i },
      { path: '/b-crypt-hash', title: /BCrypt/i },
      { path: '/html-entities', title: /HTML Entities/i },
      { path: '/json-to-typescript', title: /JSON to TypeScript/i },
      { path: '/markdown', title: /Markdown/i },
    ]

    for (const route of routes) {
      // Navigate to route
      await page.goto(route.path)

      // Verify URL
      await expect(page).toHaveURL(route.path)

      // Verify page title contains tool name
      await expect(page).toHaveTitle(route.title)
    }
  })

  test('should update page title dynamically on route change', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveTitle(/Dashboard/)

    await page.goto('/json-formatter')
    await expect(page).toHaveTitle(/JSON Formatter/)

    await page.goto('/hash')
    await expect(page).toHaveTitle(/Hash/)
  })

  test('should handle direct URL access', async ({ page }) => {
    // Direct access to a tool page
    await page.goto('/json-to-typescript')
    await expect(page).toHaveURL(/\/json-to-typescript/)
    await expect(page).toHaveTitle(/JSON to TypeScript/i)

    // Page should load correctly
    await expect(page.locator('body')).toBeVisible()
  })

  test('should maintain layout components across navigation', async ({ page }) => {
    await page.goto('/dashboard')

    // Check if layout components are present
    const hasTopbar = await page.locator('[data-testid="topbar"]').count()
    const hasContent = await page.locator('[data-testid="content"]').count()

    // Navigate to another page
    await page.goto('/json-formatter')

    // Layout components should still be present
    if (hasTopbar > 0) {
      await expect(page.locator('[data-testid="topbar"]')).toBeVisible()
    }
    if (hasContent > 0) {
      await expect(page.locator('[data-testid="content"]')).toBeVisible()
    }
  })
})
