import { test, expect } from '../../../fixtures'

test.describe('BCrypt Hash Generator', () => {
  test('should generate bcrypt hash from password', async ({ page }) => {
    await test.step('Navigate to BCrypt page', async () => {
      await page.goto('/bcrypt')
    })

    await test.step('Enter password', async () => {
      // Find the password input in the Generate tab
      const passwordInput = page.locator('#password')
      await passwordInput.fill('test123')
    })

    await test.step('Verify hash is generated', async () => {
      // Wait for debounced hash generation (500ms + processing time)
      // Hash starts with $2a$ or $2b$ and is displayed in code.hash-value element
      await expect(page.locator('code.hash-value')).toBeVisible({ timeout: 10000 })
      const hashValue = await page.locator('code.hash-value').textContent()
      expect(hashValue).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/)
    })
  })
})
