import { test, expect } from '../../../fixtures'

test.describe('Cron Builder', () => {
  test('should display default cron expression', async ({ page }) => {
    await test.step('Navigate to Cron Builder page', async () => {
      await page.goto('/cron-builder')
    })

    await test.step('Verify default expression is displayed', async () => {
      const expression = page.locator('.cron-expression code')
      await expect(expression).toBeVisible()
      await expect(expression).toContainText('* * * * *')
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
      const expression = page.locator('.cron-expression code')
      await expect(expression).toContainText('0 * * * *')
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
      const secondsToggle = page.locator('#useSeconds')
      await secondsToggle.click()
    })

    await test.step('Verify expression has 6 fields', async () => {
      const expression = page.locator('.cron-expression code')
      const text = await expression.textContent()
      const fields = text?.trim().split(' ')
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
