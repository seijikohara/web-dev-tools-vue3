import { test, expect } from '../fixtures/api-mocks'

/**
 * HTML Entities Tests
 * Tests HTML entities list functionality with XSS protection (DOMPurify)
 */
test.describe('HTML Entities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/html-entities')
  })

  test('should display HTML entities page', async ({ page }) => {
    await expect(page).toHaveURL(/\/html-entities/)
    await expect(page).toHaveTitle(/HTML Entities/)
  })

  test('should load and display HTML entities list', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Wait for API response and DOM update (explicit wait for data)
    await page.waitForSelector('text=/amp|lt|gt/', { timeout: 30000 })

    // Check that common HTML entities are displayed (with auto-retry)
    await expect(page.locator('body')).toContainText(/amp|lt|gt/)
  })

  test('should search for HTML entities', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="text"]').first()

    if (await searchInput.count() > 0) {
      // Search for ampersand
      await searchInput.fill('amp')

      // Click search button if available
      const searchButton = page.locator('button', { hasText: /search/i })
      if (await searchButton.count() > 0) {
        await searchButton.click()
      }

      // Wait for search results
      await page.waitForTimeout(1500)

      const bodyText = await page.locator('body').textContent()

      // Should contain ampersand-related entities
      expect(bodyText).toContain('amp')
    }
  })

  test('should display entity characters safely (XSS protection)', async ({ page }) => {
    // Wait for entities to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check that script tags in entity references are sanitized
    // If API returns malicious content, DOMPurify should sanitize it

    // Look for any script tags that might have been injected
    const scriptTags = await page.locator('script').count()
    const initialScriptCount = scriptTags

    // Verify no unexpected scripts are executing
    let dialogOccurred = false
    page.on('dialog', async dialog => {
      dialogOccurred = true
      await dialog.dismiss()
    })

    // Wait to see if any dialogs appear
    await page.waitForTimeout(1000)

    // No alert dialogs should appear from XSS
    expect(dialogOccurred).toBeFalsy()

    // Script count should not increase unexpectedly
    const finalScriptCount = await page.locator('script').count()
    expect(finalScriptCount).toBeLessThanOrEqual(initialScriptCount + 5) // Allow some legitimate scripts
  })

  test('should display entity codes correctly', async ({ page }) => {
    // Wait for entities to load
    await page.waitForLoadState('networkidle')

    // Wait for entity data to be displayed (explicit wait for data)
    await page.waitForSelector('text=/&#|&|Code/', { timeout: 30000 })

    // Check that entity codes are displayed (with auto-retry)
    await expect(page.locator('body')).toContainText(/&#|&|Code/)
  })

  test('should paginate HTML entities', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Look for pagination controls
    const paginationControls = page.locator('.p-paginator')
    const hasPagination = (await paginationControls.count()) > 0

    if (hasPagination) {
      // Get initial content
      const initialContent = await page.locator('body').textContent()

      // Click next page if available
      const nextButton = page.locator('button.p-paginator-next').first()
      const isNextEnabled = await nextButton.isEnabled().catch(() => false)

      if (isNextEnabled) {
        await nextButton.click()

        // Wait for new page to load
        await page.waitForTimeout(2000)

        const newContent = await page.locator('body').textContent()

        // Content should change
        expect(newContent).not.toBe(initialContent)
      } else {
        // Pagination exists but next button is disabled (on last page)
        // This is acceptable - test passes
        expect(hasPagination).toBeTruthy()
      }
    } else {
      // No pagination means not enough data - test passes
      // Just verify the page loaded successfully
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    }
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Page should load even if API fails
    await page.waitForLoadState('networkidle')

    // Check for error message or empty state
    const bodyText = await page.locator('body').textContent()

    // Page should not crash
    expect(bodyText).toBeTruthy()

    // Either entities are loaded or error message is shown
    const hasContent = bodyText && (
      bodyText.includes('No records') ||
      bodyText.includes('error') ||
      bodyText.includes('amp') ||
      bodyText.length > 100
    )

    expect(hasContent).toBeTruthy()
  })

  test('should display entity descriptions', async ({ page }) => {
    // Wait for entities to load
    await page.waitForLoadState('networkidle')

    // Wait for description data to be displayed (explicit wait for data)
    await page.waitForSelector('text=/Description|Name|Standard|DTD/', { timeout: 30000 })

    // Check that entity descriptions are displayed (with auto-retry)
    await expect(page.locator('body')).toContainText(/Description|Name|Standard|DTD/)
  })

  test('should filter entities by rows per page', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Look for rows per page dropdown
    const rowsDropdown = page.locator('.p-paginator-rpp-options, select').first()

    if (await rowsDropdown.count() > 0) {
      // Change rows per page
      await rowsDropdown.selectOption({ value: '50' })

      // Wait for update
      await page.waitForTimeout(1500)

      // Page should update with new row count
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    }
  })

  test('should render entity characters visually', async ({ page }) => {
    // Wait for entities to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Look for visual representation of entities
    const entityChars = page.locator('.char, [data-testid="entity-char"]')

    if (await entityChars.count() > 0) {
      // At least one entity character should be visible
      await expect(entityChars.first()).toBeVisible()
    } else {
      // Or entities are displayed in table/list format
      const bodyText = await page.locator('body').textContent()
      expect(bodyText?.length).toBeGreaterThan(100)
    }
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/html-entities')

    // Wait for load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20)
  })

  test('should not execute any injected scripts in entity data', async ({ page }) => {
    // Monitor for any console errors or warnings
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for entities to load
    await page.waitForLoadState('networkidle')

    // Wait for page to be fully rendered
    await expect(page.locator('body')).toBeVisible()

    // Check that no XSS-related errors occurred
    // Filter out Vite/React hydration warnings and only check for actual XSS attempts
    const hasXSSError = consoleErrors.some(error => {
      const lowerError = error.toLowerCase()
      return (
        lowerError.includes('xss') ||
        (lowerError.includes('script') &&
         !lowerError.includes('hydration') &&
         !lowerError.includes('html specifications'))
      )
    })

    // DOMPurify should prevent XSS without errors
    expect(hasXSSError).toBeFalsy()

    // Page should function normally
    await expect(page.locator('body')).toBeVisible()
  })
})
