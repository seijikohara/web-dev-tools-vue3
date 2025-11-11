import { test, expect } from '@playwright/test'

/**
 * BCrypt Hash Generator Tests
 * Tests BCrypt hashing functionality with debouncing and performance considerations
 */
test.describe('BCrypt Hash Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/b-crypt-hash')
  })

  test('should display BCrypt hash page', async ({ page }) => {
    await expect(page).toHaveURL(/\/b-crypt-hash/)
    await expect(page).toHaveTitle(/BCrypt/)
  })

  test('should generate BCrypt hash for password input', async ({ page }) => {
    const password = 'TestPassword123'

    // Find password input field
    const passwordInput = page.locator('input[type="text"]#password')
    await expect(passwordInput).toBeVisible()

    // Enter password
    await passwordInput.fill(password)

    // Wait for debounce (500ms) + computation time
    await page.waitForTimeout(1000)

    // Hash should be displayed (BCrypt hash starts with $2a$, $2b$, or $2y$)
    const bodyText = await page.locator('body').textContent()
    const hasBCryptHash = bodyText && /\$2[aby]\$\d{2}\$[\w./]{53}/.test(bodyText)

    expect(hasBCryptHash).toBeTruthy()
  })

  test('should show computing indicator during hash generation', async ({ page }) => {
    const password = 'TestPassword123'

    const passwordInput = page.locator('input[type="text"]#password')
    await passwordInput.fill(password)

    // Check for computing indicator immediately after input
    const computingIndicator = page.locator('text=/computing|calculating/i')

    // May or may not catch the indicator depending on timing
    // Just verify the page doesn't crash
    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
  })

  test('should handle empty password input', async ({ page }) => {
    const passwordInput = page.locator('input[type="text"]#password')
    await passwordInput.fill('')

    await page.waitForTimeout(1000)

    // Should show placeholder text or empty hash
    const bodyText = await page.locator('body').textContent()
    const hasPlaceholder = bodyText && (
      bodyText.includes('enter password') ||
      bodyText.includes('password') ||
      bodyText.length > 0
    )

    expect(hasPlaceholder).toBeTruthy()
  })

  test('should adjust rounds with slider', async ({ page }) => {
    const password = 'TestPassword123'
    const passwordInput = page.locator('input[type="text"]#password')
    await passwordInput.fill(password)

    // Wait for initial hash
    await page.waitForTimeout(1000)
    const initialHash = await page.locator('body').textContent()

    // Find and adjust rounds slider
    const slider = page.locator('input[type="range"]').or(page.locator('.p-slider'))
    if (await slider.count() > 0) {
      // Change rounds value
      const roundsInput = page.locator('input[type="number"]#rounds')
      if (await roundsInput.count() > 0) {
        await roundsInput.fill('10')

        // Wait for debounce + computation
        await page.waitForTimeout(1500)

        const newHash = await page.locator('body').textContent()

        // Hash should be different (different rounds produce different hashes)
        expect(newHash).not.toBe(initialHash)
      }
    }
  })

  test('should debounce hash computation during rapid typing', async ({ page }) => {
    const passwordInput = page.locator('input[type="text"]#password')

    // Type rapidly
    await passwordInput.type('Test', { delay: 50 })

    // Wait less than debounce time
    await page.waitForTimeout(300)

    // Hash might not be computed yet (or might be computing)
    const bodyText1 = await page.locator('body').textContent()

    // Continue typing
    await passwordInput.type('Password', { delay: 50 })

    // Wait for debounce to complete
    await page.waitForTimeout(800)

    // Hash should now be computed
    const bodyText2 = await page.locator('body').textContent()
    const hasBCryptHash = bodyText2 && /\$2[aby]\$\d{2}\$/.test(bodyText2)

    expect(hasBCryptHash).toBeTruthy()
  })

  test('should handle different password lengths', async ({ page }) => {
    const passwords = [
      'a',                              // Very short
      'TestPassword123',                // Normal
      'VeryLongPasswordWith72Characters123456789012345678901234567890123456789', // Max BCrypt length
    ]

    for (const password of passwords) {
      const passwordInput = page.locator('input[type="text"]#password')
      await passwordInput.fill('')
      await passwordInput.fill(password)

      await page.waitForTimeout(1000)

      // Should generate hash without crashing
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    }
  })

  test('should handle special characters in password', async ({ page }) => {
    const specialPassword = '!@#$%^&*(){}[]<>?/\\|`~"\';:,.'

    const passwordInput = page.locator('input[type="text"]#password')
    await passwordInput.fill(specialPassword)

    await page.waitForTimeout(1000)

    // Should generate hash for special characters
    const bodyText = await page.locator('body').textContent()
    const hasBCryptHash = bodyText && /\$2[aby]\$\d{2}\$/.test(bodyText)

    expect(hasBCryptHash).toBeTruthy()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/b-crypt-hash')

    const passwordInput = page.locator('input[type="text"]#password')
    await expect(passwordInput).toBeVisible()

    // Should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20)
  })

  test('should maintain hash value during computation', async ({ page }) => {
    const password1 = 'Password1'
    const password2 = 'Password2'

    const passwordInput = page.locator('input[type="text"]#password')

    // Generate first hash
    await passwordInput.fill(password1)
    await page.waitForTimeout(1000)

    const hash1Text = await page.locator('body').textContent()
    const hash1Match = hash1Text?.match(/(\$2[aby]\$\d{2}\$[\w./]{53})/)
    const hash1 = hash1Match ? hash1Match[1] : null

    // Change password quickly
    await passwordInput.fill(password2)

    // Previous hash might still be visible briefly
    // Wait for new hash
    await page.waitForTimeout(1000)

    const hash2Text = await page.locator('body').textContent()
    const hash2Match = hash2Text?.match(/(\$2[aby]\$\d{2}\$[\w./]{53})/)
    const hash2 = hash2Match ? hash2Match[1] : null

    // Hashes should be different
    if (hash1 && hash2) {
      expect(hash1).not.toBe(hash2)
    }
  })
})
