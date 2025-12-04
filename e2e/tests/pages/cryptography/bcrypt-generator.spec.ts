import { test, expect } from '../../../fixtures'

test.describe('BCrypt Hash Generator', () => {
  test('should generate bcrypt hash from password', async ({ page }) => {
    await test.step('Navigate to BCrypt page', async () => {
      await page.goto('/bcrypt')
    })

    await test.step('Enter password', async () => {
      // Find the password input in the Generate tab
      const passwordInput = page.locator('input[type="text"]').first()
      await passwordInput.fill('test123')
    })

    await test.step('Verify hash is generated', async () => {
      // Wait for debounced hash generation (500ms + processing time)
      await page.waitForTimeout(1000)
      // Hash starts with $2a$ or $2b$
      await expect(page.getByText(/\$2[ab]\$/)).toBeVisible()
    })
  })
})
