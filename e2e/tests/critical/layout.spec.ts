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

test.describe('Sidebar Navigation', () => {
  test('should display all category groups', async ({ page, isMobile }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/')
    })

    if (isMobile) {
      await test.step('Open sidebar on mobile', async () => {
        await page.locator('.menu-button').click()
        await expect(page.locator('.layout-sidebar.active')).toBeVisible()
      })
    }

    await test.step('Verify category headers are visible', async () => {
      const sidebar = page.locator('.layout-sidebar')
      // Check that at least some category headers are visible
      await Promise.all([
        expect.soft(sidebar.locator('.category-header').filter({ hasText: 'Formatters' })).toBeVisible(),
        expect.soft(sidebar.locator('.category-header').filter({ hasText: 'Encoders' })).toBeVisible(),
        expect.soft(sidebar.locator('.category-header').filter({ hasText: 'Generators' })).toBeVisible(),
      ])
    })
  })

  test('should collapse and expand category groups', async ({ page, isMobile }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/')
    })

    if (isMobile) {
      await test.step('Open sidebar on mobile', async () => {
        await page.locator('.menu-button').click()
        await expect(page.locator('.layout-sidebar.active')).toBeVisible()
      })
    }

    await test.step('Collapse Formatters category', async () => {
      const formattersHeader = page.locator('.category-header').filter({ hasText: 'Formatters' })
      await formattersHeader.click()

      // Verify menu items are collapsed
      const menuList = formattersHeader.locator('+ .menu-list')
      await expect(menuList).toHaveClass(/collapsed/)
    })

    await test.step('Expand Formatters category', async () => {
      const formattersHeader = page.locator('.category-header').filter({ hasText: 'Formatters' })
      await formattersHeader.click()

      // Verify menu items are expanded
      const menuList = formattersHeader.locator('+ .menu-list')
      await expect(menuList).not.toHaveClass(/collapsed/)
    })
  })

  test('should navigate to different tools from sidebar', async ({ page, isMobile }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/')
    })

    if (isMobile) {
      await test.step('Open sidebar on mobile', async () => {
        await page.locator('.menu-button').click()
        await expect(page.locator('.layout-sidebar.active')).toBeVisible()
      })
    }

    await test.step('Navigate to JSON Formatter', async () => {
      await page.locator('.layout-sidebar').getByRole('menuitem', { name: 'JSON Formatter' }).click()
      await expect.soft(page).toHaveURL(/\/json-formatter/)
    })
  })

  test('should highlight active menu item', async ({ page, isMobile }) => {
    await test.step('Navigate to JSON Formatter', async () => {
      await page.goto('/json-formatter')
    })

    if (isMobile) {
      await test.step('Open sidebar on mobile', async () => {
        await page.locator('.menu-button').click()
        await expect(page.locator('.layout-sidebar.active')).toBeVisible()
      })
    }

    await test.step('Verify JSON Formatter is highlighted', async () => {
      const jsonFormatterLink = page.locator('.layout-sidebar .menu-active')
      await expect(jsonFormatterLink).toContainText('JSON Formatter')
    })
  })

  test('should close sidebar overlay on mobile when clicking outside', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile')

    await test.step('Navigate to homepage', async () => {
      await page.goto('/')
    })

    await test.step('Open sidebar', async () => {
      await page.locator('.menu-button').click()
      await expect(page.locator('.layout-sidebar.active')).toBeVisible()
      await expect(page.locator('.sidebar-overlay')).toBeVisible()
    })

    await test.step('Click overlay to close sidebar', async () => {
      // Click on the right side of the overlay (outside the sidebar which is 250px wide)
      // The sidebar covers the left portion, so we click on the right edge
      const overlay = page.locator('.sidebar-overlay')
      const box = await overlay.boundingBox()
      if (box) {
        // Click near the right edge of the overlay (outside sidebar area)
        await page.mouse.click(box.x + box.width - 50, box.y + box.height / 2)
      } else {
        // Fallback: use force click if bounding box is not available
        await overlay.click({ force: true, position: { x: 300, y: 300 } })
      }
      // Wait for sidebar animation to complete (0.3s transition)
      await expect(page.locator('.layout-sidebar.active')).not.toBeVisible({ timeout: 5000 })
      await expect(page.locator('.sidebar-overlay')).not.toBeVisible({ timeout: 5000 })
    })
  })

  test('should close sidebar on mobile after navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile')

    await test.step('Navigate to homepage', async () => {
      await page.goto('/')
    })

    await test.step('Open sidebar and navigate', async () => {
      await page.locator('.menu-button').click()
      await expect(page.locator('.layout-sidebar.active')).toBeVisible()

      await page.locator('.layout-sidebar').getByRole('menuitem', { name: 'JSON Formatter' }).click()
    })

    await test.step('Verify sidebar is closed after navigation', async () => {
      // Wait for navigation to complete first
      await expect(page).toHaveURL(/\/json-formatter/, { timeout: 5000 })
      // Wait for sidebar animation to complete (0.3s transition)
      await expect(page.locator('.layout-sidebar.active')).not.toBeVisible({ timeout: 5000 })
    })
  })
})
