import { test, expect } from '../../fixtures'

test.describe('URL Encoding', () => {
  test('should encode URL', async ({ page }) => {
    await test.step('Navigate to URL Encoding page', async () => {
      await page.goto('/url-encoding')
    })

    await test.step('Enter text to encode', async () => {
      const input = page.locator('textarea').first()
      await input.fill('hello world')
    })

    await test.step('Verify encoded output is displayed', async () => {
      const output = page.locator('textarea').last()
      await expect(output).toBeVisible()
    })
  })
})
