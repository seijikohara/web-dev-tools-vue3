import { test, expect } from '../../../fixtures'

test.describe('Password Generator', () => {
  test('should generate passwords', async ({ page }) => {
    await test.step('Navigate to Password Generator page', async () => {
      await page.goto('/password-generator')
    })

    await test.step('Click Generate button', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
    })

    await test.step('Verify passwords are generated', async () => {
      const passwordCell = page.locator('.password-value').first()
      await expect(passwordCell).toBeVisible()

      const passwordText = await passwordCell.textContent()
      expect(passwordText).toBeTruthy()
      expect(passwordText?.length).toBeGreaterThanOrEqual(16) // Default length is 16
    })
  })

  test('should apply preset configurations', async ({ page }) => {
    await test.step('Navigate to Password Generator page', async () => {
      await page.goto('/password-generator')
    })

    await test.step('Apply Strong preset', async () => {
      await page.getByRole('button', { name: 'Strong' }).click()
    })

    await test.step('Generate passwords', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
    })

    await test.step('Verify strong passwords are generated', async () => {
      const passwordCell = page.locator('.password-value').first()
      await expect(passwordCell).toBeVisible()

      const passwordText = await passwordCell.textContent()
      expect(passwordText).toBeTruthy()
      expect(passwordText?.length).toBeGreaterThanOrEqual(20) // Strong preset sets length to 20
    })
  })

  test('should apply PIN preset', async ({ page }) => {
    await test.step('Navigate to Password Generator page', async () => {
      await page.goto('/password-generator')
    })

    await test.step('Apply PIN preset', async () => {
      await page.getByRole('button', { name: 'PIN' }).click()
    })

    await test.step('Generate passwords', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
    })

    await test.step('Verify PIN is generated (numbers only)', async () => {
      const passwordCell = page.locator('.password-value').first()
      await expect(passwordCell).toBeVisible()

      const pinText = await passwordCell.textContent()
      expect(pinText).toBeTruthy()
      expect(pinText).toMatch(/^\d{6}$/) // PIN preset: 6 digits only
    })
  })

  test('should clear generated passwords', async ({ page }) => {
    await test.step('Navigate to Password Generator page', async () => {
      await page.goto('/password-generator')
    })

    await test.step('Generate passwords', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
      await expect(page.locator('.password-value').first()).toBeVisible()
    })

    await test.step('Click Clear button', async () => {
      // Clear All button has pi-trash icon with tooltip
      await page.locator('button:has(.pi-trash)').click()
    })

    await test.step('Verify passwords are cleared', async () => {
      await expect(page.locator('.password-value')).toHaveCount(0)
    })
  })

  test('should show password strength indicator', async ({ page }) => {
    await test.step('Navigate to Password Generator page', async () => {
      await page.goto('/password-generator')
    })

    await test.step('Generate passwords', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
    })

    await test.step('Verify strength indicator is shown', async () => {
      // Strength tag should be visible in the table
      const strengthTag = page.locator('span.p-tag').filter({ hasText: /Weak|Fair|Good|Strong/ })
      await expect(strengthTag.first()).toBeVisible()
    })
  })
})
