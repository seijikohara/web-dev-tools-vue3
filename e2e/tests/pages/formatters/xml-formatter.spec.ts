import { test, expect } from '../../../fixtures'

test.describe('XML Formatter', () => {
  test('should format valid XML', async ({ page }) => {
    await test.step('Navigate to XML Formatter page', async () => {
      await page.goto('/xml-formatter')
    })

    await test.step('Click Load Sample button', async () => {
      // Button with pi-file icon (Load Sample)
      await page.locator('button:has(.pi-file)').click()
    })

    await test.step('Click Format button', async () => {
      await page.locator('button:has(.pi-check)').click()
    })

    await test.step('Verify output is displayed', async () => {
      // Wait for formatting to complete
      await page.waitForTimeout(500)
      // Output editor should show formatted XML
      const outputEditor = page.locator('.ace_content').nth(1)
      await expect(outputEditor).toBeVisible()
    })
  })
})
