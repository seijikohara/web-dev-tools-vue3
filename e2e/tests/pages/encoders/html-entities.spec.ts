import { test, expect } from '../../../fixtures'

test.describe('HTML Entities', () => {
  test.describe('List View', () => {
    test('should display HTML entities list', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Verify page loads with entities', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Verify entity structure', async () => {
        const entityItem = pageWithMocks.locator('.entity-item').first()
        await Promise.all([
          expect.soft(entityItem.locator('.entity-char')).toBeVisible(),
          expect.soft(entityItem.locator('.entity-details')).toBeVisible(),
        ])
      })
    })

    test('should display entity count', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Verify entity count tag is visible', async () => {
        await expect(pageWithMocks.locator('.p-tag').filter({ hasText: /entities/ })).toBeVisible({
          timeout: 10000,
        })
      })
    })

    test('should copy entity reference', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for entities to load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Click copy button on first entity', async () => {
        await pageWithMocks.locator('.entity-item').first().locator('button').click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(pageWithMocks.getByText('Copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Grid View', () => {
    test('should switch to grid view', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for entities to load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Click grid view button', async () => {
        // SelectButton with grid icon (pi-th-large)
        const gridButton = pageWithMocks.locator('button:has(.pi-th-large)')
        await gridButton.click()
      })

      await test.step('Verify grid view is displayed', async () => {
        await expect(pageWithMocks.locator('.entity-grid')).toBeVisible()
        await expect(pageWithMocks.locator('.entity-grid-item').first()).toBeVisible()
      })
    })

    test('should copy entity in grid view by clicking', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for entities to load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Switch to grid view', async () => {
        const gridButton = pageWithMocks.locator('button:has(.pi-th-large)')
        await gridButton.click()
        await expect(pageWithMocks.locator('.entity-grid')).toBeVisible()
      })

      await test.step('Click on a grid item to copy', async () => {
        await pageWithMocks.locator('.entity-grid-item').first().click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(pageWithMocks.getByText('Copied').first()).toBeVisible()
      })
    })

    test('should switch back to list view', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for entities to load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Switch to grid view', async () => {
        const gridButton = pageWithMocks.locator('button:has(.pi-th-large)')
        await gridButton.click()
        await expect(pageWithMocks.locator('.entity-grid')).toBeVisible()
      })

      await test.step('Switch back to list view', async () => {
        const listButton = pageWithMocks.locator('button:has(.pi-bars)')
        await listButton.click()
        await expect(pageWithMocks.locator('.entity-list')).toBeVisible()
      })
    })
  })

  test.describe('Search Functionality', () => {
    test('should search entities by name', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Enter search term', async () => {
        const searchInput = pageWithMocks.getByPlaceholder(
          'Search entities by name, code, or description...',
        )
        await searchInput.fill('amp')
      })

      await test.step('Click search button', async () => {
        await pageWithMocks.getByRole('button', { name: 'Search' }).click()
      })

      await test.step('Verify search results', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })
    })

    test('should clear search', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for initial load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Enter search term', async () => {
        const searchInput = pageWithMocks.getByPlaceholder(
          'Search entities by name, code, or description...',
        )
        await searchInput.fill('amp')
      })

      await test.step('Click search button', async () => {
        await pageWithMocks.getByRole('button', { name: 'Search' }).click()
      })

      await test.step('Click clear button', async () => {
        await pageWithMocks.locator('button:has(.pi-times)').click()
      })

      await test.step('Verify search is cleared', async () => {
        const searchInput = pageWithMocks.getByPlaceholder(
          'Search entities by name, code, or description...',
        )
        await expect(searchInput).toHaveValue('')
      })
    })

    test('should search with Enter key', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Enter search term and press Enter', async () => {
        const searchInput = pageWithMocks.getByPlaceholder(
          'Search entities by name, code, or description...',
        )
        await searchInput.fill('quot')
        await searchInput.press('Enter')
      })

      await test.step('Verify search results', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })
    })
  })

  test.describe('Pagination', () => {
    test('should display entity count in results', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for entities to load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Verify results count is visible', async () => {
        await expect(pageWithMocks.getByText(/Showing \d+ of \d+/)).toBeVisible()
      })
    })

    test('should display entity list items', async ({ pageWithMocks }) => {
      await test.step('Navigate to HTML Entities page', async () => {
        await pageWithMocks.goto('/html-entities')
      })

      await test.step('Wait for entities to load', async () => {
        await expect(pageWithMocks.locator('.entity-item').first()).toBeVisible({ timeout: 10000 })
      })

      await test.step('Verify entity items are displayed', async () => {
        const entityItems = pageWithMocks.locator('.entity-item')
        const count = await entityItems.count()
        expect(count).toBeGreaterThan(0)
      })
    })
  })
})
