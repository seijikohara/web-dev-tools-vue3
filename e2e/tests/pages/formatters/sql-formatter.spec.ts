import { test, expect } from '../../../fixtures'

test.describe('SQL Formatter', () => {
  test('should format valid SQL', async ({ page }) => {
    await test.step('Navigate to SQL Formatter page', async () => {
      await page.goto('/sql-formatter')
    })

    await test.step('Click Load Sample button', async () => {
      // Button with pi-file icon (Load Sample)
      await page.locator('button:has(.pi-file)').click()
    })

    await test.step('Click Format button', async () => {
      await page.locator('button:has(.pi-check)').click()
    })

    await test.step('Verify output is formatted', async () => {
      // Wait for formatting to complete
      await page.waitForTimeout(500)
      const outputEditor = page.locator('.ace_content').nth(1)
      await expect(outputEditor).toBeVisible()
      await expect(outputEditor).toContainText('SELECT')
    })
  })

  test('should change SQL dialect', async ({ page }) => {
    await test.step('Navigate to SQL Formatter page', async () => {
      await page.goto('/sql-formatter')
    })

    await test.step('Select PostgreSQL dialect', async () => {
      const dialectSelect = page.locator('.p-select').first()
      await dialectSelect.click()
      await page.getByRole('option', { name: 'PostgreSQL' }).click()
    })

    await test.step('Verify dialect is changed', async () => {
      const dialectSelect = page.locator('.p-select').first()
      await expect(dialectSelect).toContainText('PostgreSQL')
    })
  })
})
