import { test, expect } from '../../../fixtures'

test.describe('Timestamp Converter', () => {
  test('should display current time formats', async ({ page }) => {
    await test.step('Navigate to Timestamp Converter page', async () => {
      await page.goto('/timestamp-converter')
    })

    await test.step('Verify current time table is visible', async () => {
      await expect(page.locator('.formats-table')).toBeVisible()
    })

    await test.step('Verify time formats are displayed', async () => {
      await Promise.all([
        expect.soft(page.getByText('Unix Timestamp (seconds)')).toBeVisible(),
        expect.soft(page.getByText('ISO 8601')).toBeVisible(),
        expect.soft(page.getByText('Local')).toBeVisible(),
      ])
    })
  })

  test('should convert timestamp to date', async ({ page }) => {
    await test.step('Navigate to Timestamp Converter page', async () => {
      await page.goto('/timestamp-converter')
    })

    await test.step('Switch to Timestamp to Date tab', async () => {
      await page.getByRole('tab', { name: 'Timestamp to Date' }).click()
    })

    await test.step('Enter Unix timestamp', async () => {
      // InputText without id, find by placeholder text
      const input = page.getByPlaceholder('e.g., 1699000000')
      await input.fill('1700000000')
    })

    await test.step('Verify date conversion', async () => {
      await expect(page.locator('.result-section')).toBeVisible()
      await expect(page.getByText('2023-11-14').first()).toBeVisible()
    })
  })

  test('should convert date to timestamp', async ({ page }) => {
    await test.step('Navigate to Timestamp Converter page', async () => {
      await page.goto('/timestamp-converter')
    })

    await test.step('Switch to Date to Timestamp tab', async () => {
      await page.getByRole('tab', { name: 'Date to Timestamp' }).click()
    })

    await test.step('Click Now button', async () => {
      await page.getByRole('button', { name: 'Now' }).click()
    })

    await test.step('Verify timestamp conversion', async () => {
      await expect(page.locator('.result-section')).toBeVisible()
      // Tag value="Seconds" - use exact match to avoid matching "Milliseconds"
      await expect(page.locator('.result-section').getByText('Seconds', { exact: true })).toBeVisible()
    })
  })
})
