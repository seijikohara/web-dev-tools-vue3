import { test, expect } from '../../../fixtures'

test.describe('Dashboard', () => {
  test('should display network and browser information', async ({ pageWithMocks }) => {
    await test.step('Navigate to Dashboard', async () => {
      await pageWithMocks.goto('/dashboard')
    })

    await test.step('Verify page sections are visible', async () => {
      // Verify main panels exist
      const panels = pageWithMocks.locator('.p-panel')
      await expect(panels.first()).toBeVisible()

      // Verify IP address and hostname from API mock (use first() to avoid strict mode violation)
      await Promise.all([
        expect.soft(pageWithMocks.getByText('203.0.113.42').first()).toBeVisible(),
        expect.soft(pageWithMocks.getByText('test.example.com').first()).toBeVisible(),
      ])
    })

    await test.step('Verify HTTP headers table is populated', async () => {
      // Verify the last datatable contains HTTP headers
      const tables = pageWithMocks.locator('.p-datatable')
      const headerTable = tables.last()
      await Promise.all([
        expect.soft(headerTable).toBeVisible(),
        expect.soft(headerTable).toContainText('Accept'),
        expect.soft(headerTable).toContainText('Mozilla/5.0 (Test Browser)'),
      ])
    })
  })
})
