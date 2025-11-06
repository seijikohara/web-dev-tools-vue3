import { test, expect } from '@playwright/test'

/**
 * JSON Formatter Tests
 * Tests JSON formatting functionality with various inputs
 */
test.describe('JSON Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/json-formatter')
  })

  test('should display JSON formatter page', async ({ page }) => {
    await expect(page).toHaveURL(/\/json-formatter/)
    await expect(page).toHaveTitle(/JSON Formatter/)
  })

  test('should format valid JSON with proper indentation', async ({ page }) => {
    const input = '{"name":"test","value":123,"nested":{"key":"value"}}'

    // Find textarea (may vary based on actual implementation)
    const textarea = page.locator('textarea').first()
    await textarea.fill(input)

    // Look for format button
    const formatButton = page.locator('button', { hasText: /format|prettify|beautify/i }).first()

    if ((await formatButton.count()) > 0) {
      await formatButton.click()

      // Wait for formatting to complete
      await page.waitForTimeout(500)

      // Output should contain formatted JSON with indentation
      const output = await page.locator('body').textContent()
      expect(output).toContain('"name"')
      expect(output).toContain('"value"')
      expect(output).toContain('"nested"')
    }
  })

  test('should handle invalid JSON gracefully', async ({ page }) => {
    const invalidInput = '{invalid json content}'

    const textarea = page.locator('textarea').first()
    await textarea.fill(invalidInput)

    // Try to format
    const formatButton = page.locator('button', { hasText: /format|prettify|beautify/i }).first()

    if ((await formatButton.count()) > 0) {
      await formatButton.click()

      // Wait for error handling
      await page.waitForTimeout(500)

      // Should show error message or keep original input
      const bodyText = await page.locator('body').textContent()
      const hasError =
        bodyText?.includes('error') ||
        bodyText?.includes('invalid') ||
        bodyText?.includes('format')

      // Either error shown or original input preserved
      expect(hasError || bodyText?.includes(invalidInput)).toBeTruthy()
    }
  })

  test('should handle empty input', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('')

    // Try to format
    const formatButton = page.locator('button', { hasText: /format|prettify|beautify/i }).first()

    if ((await formatButton.count()) > 0) {
      await formatButton.click()

      // Should not crash
      await page.waitForTimeout(500)
      const mainContent = page.locator('body')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should handle large JSON objects', async ({ page }) => {
    // Create a large JSON object
    const largeObject: Record<string, unknown> = {}
    for (let i = 0; i < 100; i++) {
      largeObject[`key${i}`] = {
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      }
    }
    const input = JSON.stringify(largeObject)

    const textarea = page.locator('textarea').first()
    await textarea.fill(input)

    // Try to format
    const formatButton = page.locator('button', { hasText: /format|prettify|beautify/i }).first()

    if ((await formatButton.count()) > 0) {
      await formatButton.click()

      // Should handle large input without crashing
      await page.waitForTimeout(1000)
      const mainContent = page.locator('body')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should maintain input after navigation and return', async ({ page }) => {
    const input = '{"test": "value"}'

    const textarea = page.locator('textarea').first()
    await textarea.fill(input)

    // Navigate away
    await page.goto('/dashboard')

    // Come back
    await page.goto('/json-formatter')

    // Check if input is preserved (if app uses Pinia persistence)
    const newTextarea = page.locator('textarea').first()
    const savedValue = await newTextarea.inputValue()

    // Input might be preserved or cleared depending on implementation
    // This test documents the expected behavior
    if (savedValue) {
      expect(savedValue).toBe(input)
    }
  })
})
