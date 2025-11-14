import { test, expect } from '../../fixtures'

test.describe('XML Formatter', () => {
  test('should format valid XML', async ({ page }) => {
    await test.step('Navigate to XML Formatter page', async () => {
      await page.goto('/xml-formatter')
    })

    await test.step('Enter XML input', async () => {
      const input = page.locator('textarea').first()
      await input.fill('<root><item>test</item></root>')
    })

    await test.step('Verify output is displayed', async () => {
      const output = page.locator('textarea').last()
      await expect(output).toBeVisible()
    })
  })
})
