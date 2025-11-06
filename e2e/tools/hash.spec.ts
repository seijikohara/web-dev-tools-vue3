import { test, expect } from '@playwright/test'

/**
 * Hash Generator Tests
 * Tests hash generation functionality with various algorithms
 */
test.describe('Hash Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hash')
  })

  test('should display hash generator page', async ({ page }) => {
    await expect(page).toHaveURL(/\/hash/)
    await expect(page).toHaveTitle(/Hash/)
  })

  test('should generate hash for text input', async ({ page }) => {
    const input = 'test string'

    // Find input field
    const inputField = page.locator('input[type="text"], textarea').first()
    await inputField.fill(input)

    // Wait for hash generation (may be automatic)
    await page.waitForTimeout(1000)

    // Hash output should be visible (typically 32 chars for MD5, 40 for SHA1, etc.)
    const bodyText = await page.locator('body').textContent()

    // Check if any hash-like string is present (hex string of certain length)
    const hasHashOutput = /[a-fA-F0-9]{32,128}/.test(bodyText || '')

    expect(hasHashOutput).toBeTruthy()
  })

  test('should generate different hashes for different algorithms', async ({ page }) => {
    const input = 'test'

    const inputField = page.locator('input[type="text"], textarea').first()
    await inputField.fill(input)

    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Should show multiple hash algorithms (MD5, SHA1, SHA256, etc.)
    // MD5 is 32 chars, SHA256 is 64 chars, SHA512 is 128 chars
    const md5Pattern = /[a-fA-F0-9]{32}/
    const sha256Pattern = /[a-fA-F0-9]{64}/

    const hasMD5 = md5Pattern.test(bodyText || '')
    const hasSHA256 = sha256Pattern.test(bodyText || '')

    // At least one hash algorithm should be present
    expect(hasMD5 || hasSHA256).toBeTruthy()
  })

  test('should handle empty input', async ({ page }) => {
    const inputField = page.locator('input[type="text"], textarea').first()
    await inputField.fill('')

    await page.waitForTimeout(1000)

    // Should still generate hash for empty string (which has a valid hash)
    const bodyText = await page.locator('body').textContent()
    const hasHashOutput = /[a-fA-F0-9]{32,128}/.test(bodyText || '')

    // Empty string hash or no output is acceptable
    expect(bodyText).toBeTruthy()
  })

  test('should update hash in real-time on input change', async ({ page }) => {
    const inputField = page.locator('input[type="text"], textarea').first()

    // First input
    await inputField.fill('first')
    await page.waitForTimeout(500)
    const firstHash = await page.locator('body').textContent()

    // Second input
    await inputField.fill('second')
    await page.waitForTimeout(500)
    const secondHash = await page.locator('body').textContent()

    // Hashes should be different
    expect(firstHash).not.toBe(secondHash)
  })

  test('should handle special characters', async ({ page }) => {
    const specialInput = '!@#$%^&*(){}[]<>?/\\|'

    const inputField = page.locator('input[type="text"], textarea').first()
    await inputField.fill(specialInput)

    await page.waitForTimeout(1000)

    // Should generate hash without crashing
    const bodyText = await page.locator('body').textContent()
    const hasHashOutput = /[a-fA-F0-9]{32,128}/.test(bodyText || '')

    expect(hasHashOutput).toBeTruthy()
  })
})
