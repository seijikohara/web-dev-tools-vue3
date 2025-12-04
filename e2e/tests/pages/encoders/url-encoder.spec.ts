import { test, expect } from '../../../fixtures'

test.describe('URL Encoding', () => {
  test('should encode URL', async ({ page }) => {
    await test.step('Navigate to URL Encoding page', async () => {
      await page.goto('/url-encoding')
    })

    await test.step('Enter text to encode', async () => {
      // CodeEditor uses ace_editor
      const editor = page.locator('.ace_editor').first()
      await editor.click()
      await page.keyboard.type('hello world')
    })

    await test.step('Verify encoded output is displayed', async () => {
      // Second CodeEditor shows encoded output
      const outputEditor = page.locator('.ace_editor').nth(1)
      await expect(outputEditor).toBeVisible()
      // hello world should be encoded as hello%20world
      await expect(page.locator('.ace_content').nth(1)).toContainText('hello%20world')
    })
  })
})
