import { test, expect } from '../../../fixtures'

test.describe('Timestamp Converter', () => {
  test.describe('Tab: Current Time', () => {
    test('should display current time formats', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Verify Current Time tab is active by default', async () => {
        const currentTimeTab = page.getByRole('tab', { name: 'Current Time' })
        await expect(currentTimeTab).toHaveAttribute('aria-selected', 'true')
      })

      await test.step('Verify current time table is visible', async () => {
        await expect(page.locator('.p-datatable.formats-table')).toBeVisible()
      })

      await test.step('Verify time formats are displayed', async () => {
        // Check Format and Value column headers in the table
        const table = page.locator('.p-datatable.formats-table')
        await Promise.all([
          expect.soft(table.getByText('Format', { exact: true })).toBeVisible(),
          expect.soft(table.getByText('Value', { exact: true })).toBeVisible(),
        ])
      })

      await test.step('Verify LIVE indicator is visible', async () => {
        await expect(page.locator('.live-indicator')).toBeVisible()
        await expect(page.locator('.p-tag').filter({ hasText: 'LIVE' })).toBeVisible()
      })
    })

    test('should copy time format value', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Click copy button for first format', async () => {
        await page.locator('.p-datatable.formats-table').locator('button').first().click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab: Timestamp to Date', () => {
    test('should convert timestamp to date', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Timestamp to Date tab', async () => {
        await page.getByRole('tab', { name: 'Timestamp to Date' }).click()
      })

      await test.step('Enter Unix timestamp', async () => {
        const input = page.getByPlaceholder('e.g., 1699000000')
        await input.fill('1700000000')
      })

      await test.step('Verify date conversion results', async () => {
        await expect(page.locator('.result-section')).toBeVisible()
        await Promise.all([
          expect
            .soft(page.locator('.result-section .p-tag').filter({ hasText: 'Local' }).first())
            .toBeVisible(),
          expect
            .soft(page.locator('.result-section .p-tag').filter({ hasText: 'UTC' }).first())
            .toBeVisible(),
          expect
            .soft(page.locator('.result-section .p-tag').filter({ hasText: 'ISO 8601' }).first())
            .toBeVisible(),
          expect
            .soft(page.locator('.result-section .p-tag').filter({ hasText: 'Relative' }).first())
            .toBeVisible(),
        ])
        await expect(page.getByText('2023-11-14').first()).toBeVisible()
      })
    })

    test('should use Now button to set current timestamp', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Timestamp to Date tab', async () => {
        await page.getByRole('tab', { name: 'Timestamp to Date' }).click()
      })

      await test.step('Click Now button', async () => {
        await page.getByRole('button', { name: 'Now' }).click()
      })

      await test.step('Verify input is filled with current timestamp', async () => {
        const input = page.getByPlaceholder('e.g., 1699000000')
        const value = await input.inputValue()
        expect(Number(value)).toBeGreaterThan(1700000000)
      })
    })

    test('should show error for invalid timestamp', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Timestamp to Date tab', async () => {
        await page.getByRole('tab', { name: 'Timestamp to Date' }).click()
      })

      await test.step('Enter invalid timestamp', async () => {
        const input = page.getByPlaceholder('e.g., 1699000000')
        await input.fill('invalid')
      })

      await test.step('Verify error message is shown', async () => {
        await expect(page.locator('.p-message-error')).toBeVisible()
      })
    })
  })

  test.describe('Tab: Date to Timestamp', () => {
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

      await test.step('Verify timestamp conversion results', async () => {
        await expect(page.locator('.result-section')).toBeVisible()
        await Promise.all([
          expect
            .soft(page.locator('.result-section').getByText('Seconds', { exact: true }))
            .toBeVisible(),
          expect
            .soft(page.locator('.result-section').getByText('Milliseconds', { exact: true }))
            .toBeVisible(),
          expect
            .soft(page.locator('.result-section').getByText('ISO 8601', { exact: true }))
            .toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab: Calculator', () => {
    test('should calculate date with addition', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Calculator tab', async () => {
        await page.getByRole('tab', { name: 'Calculator' }).click()
      })

      await test.step('Set base date to now', async () => {
        await page.getByRole('button', { name: 'Now' }).click()
      })

      await test.step('Verify result section is displayed', async () => {
        await expect(page.locator('.result-section')).toBeVisible()
        await Promise.all([
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Date/Time' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Timestamp (ms)' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'ISO 8601' })).toBeVisible(),
        ])
      })
    })

    test('should have operation and unit selectors', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Calculator tab', async () => {
        await page.getByRole('tab', { name: 'Calculator' }).click()
      })

      await test.step('Verify calculator controls are visible', async () => {
        await Promise.all([
          expect.soft(page.getByText('Operation')).toBeVisible(),
          expect.soft(page.getByText('Amount')).toBeVisible(),
          expect.soft(page.getByText('Unit')).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab: Common Timestamps', () => {
    test('should display common timestamps table', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Common Timestamps tab', async () => {
        await page.getByRole('tab', { name: 'Common Timestamps' }).click()
      })

      await test.step('Verify common timestamps table is displayed', async () => {
        await expect(page.locator('.p-datatable.common-table')).toBeVisible()
      })

      await test.step('Verify table has expected columns', async () => {
        const table = page.locator('.p-datatable.common-table')
        await Promise.all([
          expect.soft(table.getByText('Description')).toBeVisible(),
          expect.soft(table.getByText('Date/Time')).toBeVisible(),
        ])
      })
    })

    test('should copy common timestamp', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      await test.step('Switch to Common Timestamps tab', async () => {
        await page.getByRole('tab', { name: 'Common Timestamps' }).click()
      })

      await test.step('Click copy button for first timestamp', async () => {
        await page.locator('.p-datatable.common-table').locator('button').first().click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      await test.step('Navigate to Timestamp Converter page', async () => {
        await page.goto('/timestamp-converter')
      })

      const tabs = [
        'Current Time',
        'Timestamp to Date',
        'Date to Timestamp',
        'Calculator',
        'Common Timestamps',
      ]

      for (const tabName of tabs) {
        await test.step(`Switch to ${tabName} tab`, async () => {
          const tab = page.getByRole('tab', { name: tabName })
          await tab.click()
          await expect(tab).toHaveAttribute('aria-selected', 'true')
        })
      }
    })
  })
})
