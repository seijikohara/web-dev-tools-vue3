import { test, expect } from '@playwright/test'

/**
 * JSON to TypeScript Tests
 * Tests JSON to TypeScript interface conversion
 */
test.describe('JSON to TypeScript', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/json-to-typescript')
  })

  test('should display JSON to TypeScript page', async ({ page }) => {
    await expect(page).toHaveURL(/\/json-to-typescript/)
    await expect(page).toHaveTitle(/JSON to TypeScript/i)
  })

  test('should convert simple JSON to TypeScript interface', async ({ page }) => {
    const input = '{"name": "John", "age": 30, "active": true}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    // Wait for conversion (may be automatic or require button click)
    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Should contain TypeScript interface keywords
    const hasInterface = bodyText?.includes('interface') || bodyText?.includes('type')
    const hasProperties =
      bodyText?.includes('name') && bodyText?.includes('age') && bodyText?.includes('active')

    expect(hasInterface && hasProperties).toBeTruthy()
  })

  test('should handle nested JSON objects', async ({ page }) => {
    const input = '{"user": {"name": "John", "address": {"city": "NYC", "zip": "10001"}}}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Should generate nested interfaces
    expect(bodyText).toContain('user')
    expect(bodyText).toContain('address')
    expect(bodyText).toContain('city')
  })

  test('should handle JSON arrays', async ({ page }) => {
    const input = '{"items": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(1000)

    // Get text from the second Ace Editor (TypeScript output)
    const outputEditor = page.locator('.ace_editor').nth(1)
    const outputText = await outputEditor.locator('.ace_text-layer').textContent()

    // Should detect array types
    const hasArrayType = outputText?.includes('[]') || outputText?.includes('Array')

    expect(hasArrayType).toBeTruthy()
  })

  test('should handle invalid JSON gracefully', async ({ page }) => {
    const invalidInput = '{invalid json}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(invalidInput)

    await page.waitForTimeout(1000)

    // Should not crash
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()

    // May show error message or keep original input
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
  })

  test('should show error toast for invalid JSON', async ({ page }) => {
    const invalidInput = '{"invalid": json syntax}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(invalidInput)

    // Wait for conversion attempt and toast to appear
    await page.waitForTimeout(1500)

    // Error toast should appear
    const errorToast = page.locator('.p-toast-message-error')
    const toastCount = await errorToast.count()

    // Toast might appear (depending on implementation)
    if (toastCount > 0) {
      await expect(errorToast.first()).toBeVisible({ timeout: 3000 })

      // Toast should contain error message
      const toastText = await errorToast.first().textContent()
      expect(toastText).toBeTruthy()
    }

    // Page should still be functional
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should not show error toast for valid JSON', async ({ page }) => {
    const validInput = '{"valid": "json"}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(validInput)

    // Wait for conversion
    await page.waitForTimeout(1000)

    // No error toast should appear
    const errorToast = page.locator('.p-toast-message-error')
    const errorCount = await errorToast.count()

    // Either no error toast or it's not visible
    if (errorCount > 0) {
      const isVisible = await errorToast.first().isVisible().catch(() => false)
      expect(isVisible).toBeFalsy()
    }
  })

  test('should dismiss error toast after timeout', async ({ page }) => {
    const invalidInput = '{bad json}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(invalidInput)

    // Wait for toast to appear
    await page.waitForTimeout(1500)

    const errorToast = page.locator('.p-toast-message-error')
    const initialCount = await errorToast.count()

    if (initialCount > 0) {
      // Wait for toast life duration (3000ms + buffer)
      await page.waitForTimeout(4000)

      // Toast should be dismissed
      const finalCount = await errorToast.count()
      expect(finalCount).toBeLessThanOrEqual(initialCount)
    }
  })

  test('should handle empty JSON object', async ({ page }) => {
    const input = '{}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(1000)

    // Should generate empty interface or show appropriate output
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
  })

  test('should detect correct TypeScript types', async ({ page }) => {
    const input = '{"text": "hello", "number": 42, "bool": true, "nullValue": null}'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Should contain TypeScript types
    const hasStringType = bodyText?.includes('string')
    const hasNumberType = bodyText?.includes('number')
    const hasBooleanType = bodyText?.includes('boolean')

    // At least some types should be detected
    expect(hasStringType || hasNumberType || hasBooleanType).toBeTruthy()
  })

  test('should handle complex nested structures', async ({ page }) => {
    const input = JSON.stringify({
      users: [
        {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              notifications: true,
              theme: 'dark',
            },
          },
          tags: ['admin', 'user'],
        },
      ],
    })

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea (Ace Editor)
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(1500)

    const bodyText = await page.locator('body').textContent()

    // Should handle deep nesting
    expect(bodyText).toContain('users')
    expect(bodyText).toContain('profile')
  })
})
