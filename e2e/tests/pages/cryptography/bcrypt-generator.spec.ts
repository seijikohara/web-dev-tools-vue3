import { test, expect } from '../../../fixtures'

test.describe('BCrypt Hash Generator', () => {
  test('should generate bcrypt hash from password', async ({ page }) => {
    await test.step('Navigate to BCrypt page', async () => {
      await page.goto('/bcrypt')
    })

    await test.step('Wait for page to be ready', async () => {
      // Wait for the password input to be visible and interactive
      const passwordInput = page.locator('#password')
      await expect(passwordInput).toBeVisible()
    })

    await test.step('Enter password', async () => {
      // Find the password input in the Generate tab
      const passwordInput = page.locator('#password')
      // Clear first, then type character by character to ensure Vue reactivity picks up the change
      await passwordInput.click()
      await passwordInput.fill('')
      await page.keyboard.type('test123', { delay: 50 })
    })

    await test.step('Verify hash is generated', async () => {
      // BCrypt uses Web Worker for computation - wait for the hash to appear
      // Hash starts with $2a$ or $2b$ and is displayed in code.hash-value element
      // Increased timeout for CI environments where Web Workers may be slower
      const hashValueLocator = page.locator('code.hash-value')
      await expect(hashValueLocator).toBeVisible({ timeout: 30000 })
      const hashValue = await hashValueLocator.textContent()
      expect(hashValue).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/)
    })
  })
})
