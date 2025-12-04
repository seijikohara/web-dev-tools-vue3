import { test, expect } from '../../../fixtures'

test.describe('HTML Entities', () => {
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
        // .entity-details instead of .entity-table
        expect.soft(entityItem.locator('.entity-details')).toBeVisible(),
      ])
    })
  })

  test('should search entities', async ({ pageWithMocks }) => {
    await test.step('Navigate to HTML Entities page', async () => {
      await pageWithMocks.goto('/html-entities')
    })

    await test.step('Enter search term', async () => {
      // Full placeholder text
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
})
