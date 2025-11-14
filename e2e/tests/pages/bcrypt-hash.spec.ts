import { test, expect } from '../../fixtures'

test.describe('BCrypt Hash Generator', () => {
  test('should generate bcrypt hash from password', async ({ page }) => {
    await test.step('Navigate to BCrypt page', async () => {
      await page.goto('/b-crypt-hash')
    })

    await test.step('Enter password', async () => {
      const passwordInput = page.getByRole('textbox', { name: /password/i })
      await passwordInput.fill('test123')
    })

    await test.step('Verify hash is generated', async () => {
      const output = page.locator('code')
      await Promise.all([
        expect.soft(output).toBeVisible(),
        expect.soft(output).not.toBeEmpty(),
      ])
    })
  })
})
