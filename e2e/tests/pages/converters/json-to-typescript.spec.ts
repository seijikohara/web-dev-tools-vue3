import { test, expect } from '../../../fixtures'

test.describe('JSON to TypeScript', () => {
  test('should convert JSON to TypeScript', async ({ page }) => {
    await test.step('Navigate to JSON to TypeScript page', async () => {
      await page.goto('/json-to-typescript')
    })

    await test.step('Enter JSON input', async () => {
      const input = page.locator('textarea').first()
      await input.fill('{"name":"test"}')
    })

    await test.step('Verify TypeScript output is displayed', async () => {
      const output = page.locator('textarea').last()
      await expect(output).toBeVisible()
    })
  })
})
