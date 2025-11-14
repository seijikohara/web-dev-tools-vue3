import { test, expect } from '../../fixtures'

test.describe('JSON Formatter', () => {
  test('should format valid JSON', async ({ page }) => {
    await test.step('Navigate to JSON Formatter page', async () => {
      await page.goto('/json-formatter')
    })

    await test.step('Enter JSON input', async () => {
      const input = page.locator('textarea').first()
      await input.fill('{"name":"test"}')
    })

    await test.step('Verify output is displayed', async () => {
      const output = page.locator('textarea').last()
      await expect(output).toBeVisible()
    })
  })
})
