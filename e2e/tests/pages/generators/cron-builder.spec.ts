import { test, expect } from '../../../fixtures'

test.describe('Cron Builder', () => {
  test('should display default cron expression', async ({ page }) => {
    await test.step('Navigate to Cron Builder page', async () => {
      await page.goto('/cron-builder')
    })

    await test.step('Verify default expression is displayed', async () => {
      // Expression is in InputText with .cron-input class
      const expressionInput = page.locator('.cron-input')
      await expect(expressionInput).toBeVisible()
      await expect(expressionInput).toHaveValue('* * * * *')
    })
  })

  test('should apply preset', async ({ page }) => {
    await test.step('Navigate to Cron Builder page', async () => {
      await page.goto('/cron-builder')
    })

    await test.step('Click every hour preset', async () => {
      await page.getByRole('button', { name: 'Every hour' }).click()
    })

    await test.step('Verify expression is updated', async () => {
      const expressionInput = page.locator('.cron-input')
      await expect(expressionInput).toHaveValue('0 * * * *')
    })
  })

  test('should show next executions', async ({ page }) => {
    await test.step('Navigate to Cron Builder page', async () => {
      await page.goto('/cron-builder')
    })

    await test.step('Verify next executions are displayed', async () => {
      const executionsList = page.locator('.executions-list')
      await expect(executionsList).toBeVisible()
    })
  })

  test('should enable seconds field', async ({ page }) => {
    await test.step('Navigate to Cron Builder page', async () => {
      await page.goto('/cron-builder')
    })

    await test.step('Toggle seconds switch', async () => {
      // ToggleSwitch component
      const secondsToggle = page.locator('.p-toggleswitch')
      await secondsToggle.click()
    })

    await test.step('Verify expression has 6 fields', async () => {
      const expressionInput = page.locator('.cron-input')
      const text = await expressionInput.inputValue()
      const fields = text.trim().split(' ')
      expect(fields?.length).toBe(6)
    })
  })

  test('should copy expression', async ({ page }) => {
    await test.step('Navigate to Cron Builder page', async () => {
      await page.goto('/cron-builder')
    })

    await test.step('Click Copy button', async () => {
      await page.getByRole('button', { name: 'Copy' }).click()
    })

    await test.step('Verify toast message appears', async () => {
      // Use first() to avoid strict mode violation with toast messages
      await expect(page.getByText('Copied').first()).toBeVisible()
    })
  })
})
