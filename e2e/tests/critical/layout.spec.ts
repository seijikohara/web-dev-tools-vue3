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
      await expect.soft(topbar.locator('img[src="/img/logo-top.png"]')).toBeVisible()
    })

    if (isMobile) {
      await test.step('Verify mobile menu button and sidebar', async () => {
        // Verify menu button is visible on mobile
        const menuButton = page.locator('.menu-button')
        await expect.soft(menuButton).toBeVisible()

        // Open sidebar by clicking menu button
        await menuButton.click()

        const sidebar = page.locator('.layout-sidebar')
        const menu = sidebar.locator('.layout-menu')

        await Promise.all([
          expect.soft(sidebar).toBeVisible(),
          expect.soft(menu).toBeVisible(),
          // Verify menu has navigation items
          expect.soft(menu.locator('li')).toHaveCount(9),
        ])
      })
    } else {
      await test.step('Verify desktop sidebar is always visible', async () => {
        const sidebar = page.locator('.layout-sidebar')
        const menu = sidebar.locator('.layout-menu')

        await Promise.all([
          expect.soft(sidebar).toBeVisible(),
          expect.soft(menu).toBeVisible(),
          // Verify menu has navigation items
          expect.soft(menu.locator('li')).toHaveCount(9),
        ])
      })
    }

    await test.step('Verify navigation links work', async () => {
      // Click on a menu item and verify navigation
      const hashLink = page.locator('.layout-menu a[href="/hash"]')
      await expect.soft(hashLink).toBeVisible()
      await hashLink.click()

      // Verify navigation occurred
      await expect.soft(page).toHaveURL(/\/hash/)
      await expect.soft(page).toHaveTitle(/Hash/)
    })
  })
})
