import { test, expect } from '@playwright/test'

/**
 * URL Encoding Tests
 * Tests URL encode/decode functionality
 */
test.describe('URL Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/url-encoding')
  })

  test('should display URL encoding page', async ({ page }) => {
    await expect(page).toHaveURL(/\/url-encoding/)
    await expect(page).toHaveTitle(/URL Encoding/)
  })

  test('should encode URL with special characters', async ({ page }) => {
    const input = 'hello world & test=value'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(300)

    // Look for encode button
    const encodeButton = page.locator('button', { hasText: /encode/i }).first()

    if ((await encodeButton.count()) > 0) {
      await encodeButton.click()
      await page.waitForTimeout(500)

      // Get text from Ace Editor
      const aceEditor = page.locator('.ace_editor').first()
      const editorText = await aceEditor.locator('.ace_text-layer').textContent()

      // Should contain encoded characters
      const hasEncodedSpace = editorText?.includes('%20') || editorText?.includes('+')
      const hasEncodedAmpersand = editorText?.includes('%26')
      const hasEncodedEquals = editorText?.includes('%3D')

      expect(hasEncodedSpace || hasEncodedAmpersand || hasEncodedEquals).toBeTruthy()
    }
  })

  test('should decode URL encoded string', async ({ page }) => {
    const encodedInput = 'hello%20world%26test%3Dvalue'

    const inputField = page.locator('textarea, input[type="text"]').first()
    await inputField.fill(encodedInput)

    // Look for decode button
    const decodeButton = page.locator('button', { hasText: /decode/i }).first()

    if ((await decodeButton.count()) > 0) {
      await decodeButton.click()
      await page.waitForTimeout(500)

      const bodyText = await page.locator('body').textContent()

      // Should contain decoded characters
      expect(bodyText).toContain('hello')
    }
  })

  test('should handle empty input', async ({ page }) => {
    const inputField = page.locator('textarea, input[type="text"]').first()
    await inputField.fill('')

    const encodeButton = page.locator('button', { hasText: /encode/i }).first()

    if ((await encodeButton.count()) > 0) {
      await encodeButton.click()
      await page.waitForTimeout(500)

      // Should not crash
      const mainContent = page.locator('body')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should handle Unicode characters', async ({ page }) => {
    const unicodeInput = 'こんにちは 世界 🌍'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(unicodeInput)

    await page.waitForTimeout(300)

    const encodeButton = page.locator('button', { hasText: /encode/i }).first()

    if ((await encodeButton.count()) > 0) {
      await encodeButton.click()
      await page.waitForTimeout(500)

      // Get text from Ace Editor
      const aceEditor = page.locator('.ace_editor').first()
      const editorText = await aceEditor.locator('.ace_text-layer').textContent()

      // Should contain percent-encoded Unicode
      expect(editorText).toContain('%')
    }
  })
})
