import { test, expect } from '../../../fixtures'

test.describe('cURL Builder', () => {
  test.describe('Tab: Builder', () => {
    test('should display Builder tab by default', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Verify Builder tab is active', async () => {
        const builderTab = page.getByRole('tab', { name: 'Builder' })
        await expect(builderTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should build basic GET request', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com/users')
      })

      await test.step('Verify cURL command is generated', async () => {
        const output = page.locator('.cm-editor').last()
        await expect(output).toContainText('curl')
        await expect(output).toContainText('https://api.example.com/users')
      })
    })

    test('should change HTTP method', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Select POST method', async () => {
        const methodSelect = page.locator('.method-select')
        await methodSelect.click()
        await page.getByRole('option', { name: 'POST' }).click()
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com/users')
      })

      await test.step('Verify cURL command contains POST', async () => {
        const output = page.locator('.cm-editor').last()
        await expect(output).toContainText('-X POST')
      })
    })

    test('should load sample request', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Click Sample button', async () => {
        await page.getByRole('button', { name: 'Sample' }).click()
      })

      await test.step('Verify sample is loaded', async () => {
        const urlInput = page.locator('.url-input')
        await expect(urlInput).toHaveValue(/api\.example\.com/)
      })
    })

    test('should add headers', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com/users')
      })

      await test.step('Add Authorization header', async () => {
        const headerKeyInput = page.locator('.key-input input').first()
        await headerKeyInput.click()
        await headerKeyInput.fill('Authorization')

        const headerValueInput = page.locator('.value-input').first()
        await headerValueInput.fill('Bearer token123')
      })

      await test.step('Verify header is in command', async () => {
        const output = page.locator('.cm-editor').last()
        await expect(output).toContainText('-H')
        await expect(output).toContainText('Authorization')
      })
    })

    test('should copy command', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com')
      })

      await test.step('Click Copy button', async () => {
        await page.getByRole('button', { name: 'Copy' }).first().click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('Copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab: Builder - Sub Tabs', () => {
    test('should switch between Headers, Query Params, Body, Options tabs', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      const subTabs = ['Headers', 'Query Params', 'Body', 'Options']

      for (const tabName of subTabs) {
        await test.step(`Switch to ${tabName} tab`, async () => {
          const tab = page.getByRole('tab', { name: tabName })
          await tab.click()
          await expect(tab).toHaveAttribute('aria-selected', 'true')
        })
      }
    })

    test('should add query parameters', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com/search')
      })

      await test.step('Switch to Query Params tab', async () => {
        await page.getByRole('tab', { name: 'Query Params' }).click()
      })

      await test.step('Enter parameter key and value', async () => {
        // Query Params tab uses InputText elements
        const queryParamsPanel = page.getByRole('tabpanel', { name: /Query Params/ })
        const keyInput = queryParamsPanel.getByPlaceholder('Parameter name')
        await keyInput.fill('query')
        const valueInput = queryParamsPanel.getByPlaceholder('Value')
        await valueInput.fill('test')
      })

      await test.step('Verify query param is in command', async () => {
        const output = page.locator('.cm-editor').last()
        await expect(output).toContainText('query=test')
      })
    })

    test('should add request body', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Select POST method', async () => {
        const methodSelect = page.locator('.method-select')
        await methodSelect.click()
        await page.getByRole('option', { name: 'POST' }).click()
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com/users')
      })

      await test.step('Switch to Body tab', async () => {
        await page.getByRole('tab', { name: 'Body' }).click()
      })

      await test.step('Select JSON body type', async () => {
        const bodyTypeSelect = page.locator('.body-type-select .p-select')
        await bodyTypeSelect.click()
        await page.getByRole('option', { name: 'JSON' }).click()
      })

      await test.step('Verify body editor is visible', async () => {
        // Body editor should appear (first cm-editor in this panel)
        await expect(page.locator('.body-section .cm-editor')).toBeVisible()
      })
    })

    test('should configure options', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Enter URL', async () => {
        const urlInput = page.locator('.url-input')
        await urlInput.fill('https://api.example.com')
      })

      await test.step('Switch to Options tab', async () => {
        await page.getByRole('tab', { name: 'Options' }).click()
      })

      await test.step('Verify options are displayed', async () => {
        await Promise.all([
          expect.soft(page.getByText('Follow Redirects (-L)')).toBeVisible(),
          expect.soft(page.getByText('Insecure / Skip SSL (-k)')).toBeVisible(),
          expect.soft(page.getByText('Verbose (-v)')).toBeVisible(),
          expect.soft(page.getByText('Silent (-s)')).toBeVisible(),
          expect.soft(page.getByText('Compressed')).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab: Parser', () => {
    test('should switch to Parser tab', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Switch to Parser tab', async () => {
        const parserTab = page.getByRole('tab', { name: 'Parser' })
        await parserTab.click()
        await expect(parserTab).toHaveAttribute('aria-selected', 'true')
      })

      await test.step('Verify Parser panel content', async () => {
        await expect(page.getByText('Paste cURL Command')).toBeVisible()
        await expect(page.locator('.parse-input')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Parse' })).toBeVisible()
      })
    })

    test('should parse cURL command', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Switch to Parser tab', async () => {
        await page.getByRole('tab', { name: 'Parser' }).click()
      })

      await test.step('Enter cURL command', async () => {
        const parseInput = page.locator('.parse-input')
        await parseInput.fill(
          'curl -X POST https://api.example.com/users -H "Content-Type: application/json"',
        )
      })

      await test.step('Click Parse button', async () => {
        await page.getByRole('button', { name: 'Parse' }).click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('Parsed').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch between Builder and Parser tabs', async ({ page }) => {
      await test.step('Navigate to cURL Builder page', async () => {
        await page.goto('/curl-builder')
      })

      await test.step('Switch to Parser tab', async () => {
        const parserTab = page.getByRole('tab', { name: 'Parser' })
        await parserTab.click()
        await expect(parserTab).toHaveAttribute('aria-selected', 'true')
      })

      await test.step('Switch back to Builder tab', async () => {
        const builderTab = page.getByRole('tab', { name: 'Builder' })
        await builderTab.click()
        await expect(builderTab).toHaveAttribute('aria-selected', 'true')
      })
    })
  })
})
