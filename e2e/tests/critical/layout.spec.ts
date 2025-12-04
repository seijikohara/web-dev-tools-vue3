import { test, expect } from '../../fixtures'

/**
 * Layout Tests - Common layout elements verification
 */

test.describe('Common Layout', () => {
  test('should display common layout elements on homepage', async ({ page, isMobile }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/')
    })

    await test.step('Verify topbar elements', async () => {
      const topbar = page.locator('.layout-topbar')
      await expect.soft(topbar).toBeVisible()
      // Logo is now SVG
      await expect.soft(topbar.locator('.logo-link')).toBeVisible()
    })

    if (isMobile) {
      await test.step('Verify mobile menu button and sidebar', async () => {
        // Verify menu button is visible on mobile
        const menuButton = page.locator('.menu-button')
        await expect.soft(menuButton).toBeVisible()

        // Open sidebar by clicking menu button
        await menuButton.click()

        const sidebar = page.locator('.layout-sidebar')

        await Promise.all([
          expect.soft(sidebar).toBeVisible(),
          // Verify sidebar has navigation links
          expect.soft(sidebar.locator('a').first()).toBeVisible(),
        ])
      })
    } else {
      await test.step('Verify desktop sidebar is always visible', async () => {
        const sidebar = page.locator('.layout-sidebar')

        await Promise.all([
          expect.soft(sidebar).toBeVisible(),
          // Verify sidebar has navigation links
          expect.soft(sidebar.locator('a').first()).toBeVisible(),
        ])
      })
    }

    await test.step('Verify navigation links work', async () => {
      // Click on Dashboard link (always visible)
      const dashboardLink = page.locator('.layout-sidebar a[href="/dashboard"]')
      await expect.soft(dashboardLink).toBeVisible()
      await dashboardLink.click()

      // Verify navigation occurred
      await expect.soft(page).toHaveURL(/\/dashboard/)
      await expect.soft(page).toHaveTitle(/Dashboard/)
    })
  })
})
