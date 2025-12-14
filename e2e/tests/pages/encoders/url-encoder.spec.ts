import { test, expect } from '../../../fixtures'

test.describe('URL Encoder', () => {
  test.describe('Tab: Encode/Decode', () => {
    test('should display Encode/Decode tab by default', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Verify Encode/Decode tab is active', async () => {
        const encodeDecodeTab = page.getByRole('tab', { name: 'Encode/Decode' })
        await expect(encodeDecodeTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should encode URL', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Enter text to encode', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('hello world')
      })

      await test.step('Verify encoded output is displayed', async () => {
        await expect(page.locator('.cm-editor').nth(1)).toContainText('hello%20world')
      })
    })

    test('should display encoding options', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Verify encoding options are visible', async () => {
        await Promise.all([
          expect
            .soft(page.locator('.p-panel-header').filter({ hasText: 'Encoding Options' }))
            .toBeVisible(),
          expect.soft(page.locator('.p-selectbutton')).toBeVisible(),
        ])
      })
    })

    test('should switch encoding method', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Verify encoding method selector is visible', async () => {
        await expect(page.locator('.p-selectbutton')).toBeVisible()
      })
    })

    test('should load sample data', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Click Sample button', async () => {
        await page.getByRole('button', { name: 'Sample' }).click()
      })

      await test.step('Verify sample is loaded', async () => {
        const outputEditor = page.locator('.cm-editor').nth(1)
        await expect(outputEditor).not.toBeEmpty()
      })
    })

    test('should display input and output stats', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Enter text', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('Hello')
      })

      await test.step('Verify stats are displayed', async () => {
        // Check for character count in the panel label
        await expect(page.locator('.p-tag').filter({ hasText: /chars/ }).first()).toBeVisible()
      })
    })

    test('should copy output', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Enter text', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('test')
      })

      await test.step('Click Copy button', async () => {
        await page.getByRole('button', { name: 'Copy' }).click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab: URL Parser', () => {
    test('should switch to URL Parser tab', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to URL Parser tab', async () => {
        const parserTab = page.getByRole('tab', { name: 'URL Parser' })
        await parserTab.click()
        await expect(parserTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should parse URL', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to URL Parser tab', async () => {
        await page.getByRole('tab', { name: 'URL Parser' }).click()
      })

      await test.step('Enter URL', async () => {
        const input = page.getByPlaceholder('https://example.com/path?query=value#hash')
        await input.fill('https://example.com:8080/path?name=test&value=123#section')
      })

      await test.step('Verify parsed components are displayed', async () => {
        await Promise.all([
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Protocol' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Hostname' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Port' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Pathname' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Search' })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: 'Hash' })).toBeVisible(),
        ])
      })
    })

    test('should show Valid URL indicator', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to URL Parser tab', async () => {
        await page.getByRole('tab', { name: 'URL Parser' }).click()
      })

      await test.step('Enter valid URL', async () => {
        const input = page.getByPlaceholder('https://example.com/path?query=value#hash')
        await input.fill('https://google.com')
      })

      await test.step('Verify Valid URL indicator is shown', async () => {
        await expect(page.locator('.p-tag').filter({ hasText: 'Valid URL' })).toBeVisible()
      })
    })

    test('should show Invalid indicator for bad URL', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to URL Parser tab', async () => {
        await page.getByRole('tab', { name: 'URL Parser' }).click()
      })

      await test.step('Enter invalid URL', async () => {
        const input = page.getByPlaceholder('https://example.com/path?query=value#hash')
        await input.fill('not-a-valid-url')
      })

      await test.step('Verify Invalid indicator is shown', async () => {
        await expect(page.locator('.p-tag').filter({ hasText: 'Invalid' })).toBeVisible()
      })
    })

    test('should display query parameters', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to URL Parser tab', async () => {
        await page.getByRole('tab', { name: 'URL Parser' }).click()
      })

      await test.step('Enter URL with query params', async () => {
        const input = page.getByPlaceholder('https://example.com/path?query=value#hash')
        await input.fill('https://example.com?foo=bar&hello=world')
      })

      await test.step('Verify parsed components are displayed', async () => {
        // The search component should be visible when URL has query params
        await expect(page.locator('.p-tag').filter({ hasText: 'Search' })).toBeVisible()
      })
    })

    test('should load sample URL', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to URL Parser tab', async () => {
        await page.getByRole('tab', { name: 'URL Parser' }).click()
      })

      await test.step('Click sample button', async () => {
        await page.locator('.url-input-panel').locator('button:has(.pi-file)').click()
      })

      await test.step('Verify sample is loaded', async () => {
        const input = page.getByPlaceholder('https://example.com/path?query=value#hash')
        await expect(input).not.toHaveValue('')
      })
    })
  })

  test.describe('Tab: Query Builder', () => {
    test('should switch to Query Builder tab', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Query Builder tab', async () => {
        const builderTab = page.getByRole('tab', { name: 'Query Builder' })
        await builderTab.click()
        await expect(builderTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display query builder UI', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Query Builder tab', async () => {
        await page.getByRole('tab', { name: 'Query Builder' }).click()
      })

      await test.step('Verify builder UI is visible', async () => {
        await Promise.all([
          expect
            .soft(page.locator('.p-panel-header').filter({ hasText: 'URL Builder' }))
            .toBeVisible(),
          expect.soft(page.getByText('Base URL')).toBeVisible(),
          expect.soft(page.getByPlaceholder('https://example.com/api/endpoint')).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Add Parameter' })).toBeVisible(),
        ])
      })
    })

    test('should build URL with parameters', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Query Builder tab', async () => {
        await page.getByRole('tab', { name: 'Query Builder' }).click()
      })

      await test.step('Enter base URL', async () => {
        await page
          .getByPlaceholder('https://example.com/api/endpoint')
          .fill('https://api.example.com/users')
      })

      await test.step('Fill parameter key and value', async () => {
        await page.getByRole('textbox', { name: 'Key' }).fill('name')
        await page.getByRole('textbox', { name: 'Value' }).fill('John')
      })

      await test.step('Verify Generated URL section appears', async () => {
        await expect(page.getByText('Generated URL')).toBeVisible()
      })
    })

    test('should add and remove parameters', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Query Builder tab', async () => {
        await page.getByRole('tab', { name: 'Query Builder' }).click()
      })

      await test.step('Add parameter', async () => {
        await page.getByRole('button', { name: 'Add Parameter' }).click()
      })

      await test.step('Verify parameter row is added', async () => {
        const paramRows = page.locator('.param-row')
        const count = await paramRows.count()
        expect(count).toBeGreaterThanOrEqual(2)
      })

      await test.step('Remove a parameter', async () => {
        await page.locator('.param-row').first().locator('button:has(.pi-trash)').click()
      })
    })

    test('should copy built URL', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Query Builder tab', async () => {
        await page.getByRole('tab', { name: 'Query Builder' }).click()
      })

      await test.step('Enter base URL', async () => {
        await page.getByPlaceholder('https://example.com/api/endpoint').fill('https://example.com')
      })

      await test.step('Click Copy URL button', async () => {
        await page.getByRole('button', { name: 'Copy URL' }).click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab: Reference', () => {
    test('should switch to Reference tab', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Reference tab', async () => {
        const referenceTab = page.getByRole('tab', { name: 'Reference' })
        await referenceTab.click()
        await expect(referenceTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display encoding reference table', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Reference tab', async () => {
        await page.getByRole('tab', { name: 'Reference' }).click()
      })

      await test.step('Verify reference table is visible', async () => {
        await Promise.all([
          expect
            .soft(
              page.locator('.p-panel-header').filter({ hasText: 'Common URL Encoding Characters' }),
            )
            .toBeVisible(),
          expect.soft(page.locator('.p-datatable')).toBeVisible(),
        ])
      })
    })

    test('should display common encoding examples', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      await test.step('Switch to Reference tab', async () => {
        await page.getByRole('tab', { name: 'Reference' }).click()
      })

      await test.step('Verify common encodings are shown', async () => {
        // Check for common URL encoding characters
        await Promise.all([
          expect.soft(page.locator('.p-tag').filter({ hasText: '%20' })).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      await test.step('Navigate to URL Encoding page', async () => {
        await page.goto('/url-encoding')
      })

      const tabs = ['Encode/Decode', 'URL Parser', 'Query Builder', 'Reference']

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
