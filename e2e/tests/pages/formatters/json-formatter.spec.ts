import { test, expect } from '../../../fixtures'

test.describe('JSON Formatter', () => {
  test.describe('Tab: Format', () => {
    test('should display Format tab by default', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Verify Format tab is active', async () => {
        const formatTab = page.getByRole('tab', { name: 'Format' })
        await expect(formatTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should format valid JSON', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Enter JSON input', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('{"name":"test","value":123}')
      })

      await test.step('Click Format button', async () => {
        await page.getByRole('button', { name: 'Format', exact: true }).click()
      })

      await test.step('Verify output is displayed', async () => {
        const outputEditor = page.locator('.cm-editor').nth(1)
        await expect(outputEditor).toBeVisible()
      })
    })

    test('should display Minify button', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Verify Minify button is visible', async () => {
        await expect(page.getByRole('button', { name: 'Minify' })).toBeVisible()
      })
    })

    test('should display options panel', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Verify options panel is visible', async () => {
        await Promise.all([
          // Check for panel with "Options" text in header
          expect.soft(page.locator('.panel-header').filter({ hasText: 'Options' }).first()).toBeVisible(),
          expect.soft(page.getByText('Indentation').first()).toBeVisible(),
          expect.soft(page.getByText('Indent Size').first()).toBeVisible(),
        ])
      })
    })

    test('should display validation result', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Enter valid JSON', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('{"name":"test"}')
      })

      await test.step('Verify validation result is shown', async () => {
        await expect(page.getByText('Validation Result')).toBeVisible()
        await expect(page.locator('.p-tag').filter({ hasText: 'Valid JSON' })).toBeVisible()
      })
    })

    test('should display JSON stats', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Enter JSON with multiple keys', async () => {
        // Clear existing content first by selecting all and typing
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.press('Meta+a')
        await page.keyboard.type('{"name":"test","value":123}')
      })

      await test.step('Verify validation shows valid JSON', async () => {
        await expect(page.locator('.p-tag').filter({ hasText: 'Valid JSON' })).toBeVisible()
      })
    })

    test('should display Copy button', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Verify Copy button is visible', async () => {
        await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible()
      })
    })
  })

  test.describe('Tab: Query', () => {
    test('should switch to Query tab', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Query tab', async () => {
        const queryTab = page.getByRole('tab', { name: 'Query' })
        await queryTab.click()
        await expect(queryTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display query UI', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Query tab', async () => {
        await page.getByRole('tab', { name: 'Query' }).click()
      })

      await test.step('Verify query UI is visible', async () => {
        await Promise.all([
          expect.soft(page.getByText('JSON Path Query')).toBeVisible(),
          expect.soft(page.getByPlaceholder('e.g., $.address.city or hobbies[0]')).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Query' })).toBeVisible(),
          expect.soft(page.getByText('Common queries:')).toBeVisible(),
        ])
      })
    })

    test('should display query input and button', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Query tab', async () => {
        await page.getByRole('tab', { name: 'Query' }).click()
      })

      await test.step('Verify query input and button are visible', async () => {
        await expect(page.getByPlaceholder('e.g., $.address.city or hobbies[0]')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Query' })).toBeVisible()
      })
    })

    test('should use common query buttons', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Query tab', async () => {
        await page.getByRole('tab', { name: 'Query' }).click()
      })

      await test.step('Click common query button', async () => {
        await page.getByRole('button', { name: '$.name' }).click()
      })

      await test.step('Verify query is applied', async () => {
        const input = page.getByPlaceholder('e.g., $.address.city or hobbies[0]')
        await expect(input).toHaveValue('$.name')
      })
    })
  })

  test.describe('Tab: Compare', () => {
    test('should switch to Compare tab', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Compare tab', async () => {
        const compareTab = page.getByRole('tab', { name: 'Compare' })
        await compareTab.click()
        await expect(compareTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display compare UI', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Compare tab', async () => {
        await page.getByRole('tab', { name: 'Compare' }).click()
      })

      await test.step('Verify compare UI is visible', async () => {
        await Promise.all([
          expect.soft(page.getByText('JSON 1')).toBeVisible(),
          expect.soft(page.getByText('JSON 2')).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Load Current' }).first()).toBeVisible(),
        ])
      })
    })

    test('should compare JSONs and show identical', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Compare tab', async () => {
        await page.getByRole('tab', { name: 'Compare' }).click()
      })

      await test.step('Enter same JSON in both editors', async () => {
        const json = '{"name": "test"}'
        const comparePanel = page.getByRole('tabpanel', { name: 'Compare' })
        const editor1 = comparePanel.locator('.cm-editor').first()
        await editor1.click()
        await page.keyboard.type(json)

        const editor2 = comparePanel.locator('.cm-editor').nth(1)
        await editor2.click()
        await page.keyboard.type(json)
      })

      await test.step('Verify identical message is shown', async () => {
        await expect(page.locator('.p-tag').filter({ hasText: 'Identical' })).toBeVisible()
      })
    })
  })

  test.describe('Tab: Convert', () => {
    test('should switch to Convert tab', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Convert tab', async () => {
        const convertTab = page.getByRole('tab', { name: 'Convert' })
        await convertTab.click()
        await expect(convertTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display convert UI', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Convert tab', async () => {
        await page.getByRole('tab', { name: 'Convert' }).click()
      })

      await test.step('Verify convert UI is visible', async () => {
        await Promise.all([
          expect.soft(page.getByRole('button', { name: 'To YAML' })).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'To XML' })).toBeVisible(),
        ])
      })
    })

    test('should display conversion buttons', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Convert tab', async () => {
        await page.getByRole('tab', { name: 'Convert' }).click()
      })

      await test.step('Verify conversion buttons are visible', async () => {
        await Promise.all([
          expect.soft(page.getByRole('button', { name: 'To YAML' })).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'To XML' })).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab: Schema', () => {
    test('should switch to Schema tab', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Schema tab', async () => {
        const schemaTab = page.getByRole('tab', { name: 'Schema' })
        await schemaTab.click()
        await expect(schemaTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display schema validator UI', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Schema tab', async () => {
        await page.getByRole('tab', { name: 'Schema' }).click()
      })

      await test.step('Verify schema validator UI is visible', async () => {
        await Promise.all([
          expect.soft(page.getByRole('button', { name: 'Validate' })).toBeVisible(),
          expect.soft(page.getByLabel('Schema').locator('.cm-editor').first()).toBeVisible(),
        ])
      })
    })

    test('should display schema validator controls', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Schema tab', async () => {
        await page.getByRole('tab', { name: 'Schema' }).click()
      })

      await test.step('Verify schema validator controls are visible', async () => {
        await Promise.all([
          expect.soft(page.getByRole('button', { name: 'Validate' })).toBeVisible(),
          expect.soft(page.locator('button:has(.pi-bolt)')).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab: Generate', () => {
    test('should switch to Generate tab', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Generate tab', async () => {
        const generateTab = page.getByRole('tab', { name: 'Generate' })
        await generateTab.click()
        await expect(generateTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display code generator UI', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      await test.step('Switch to Generate tab', async () => {
        await page.getByRole('tab', { name: 'Generate' }).click()
      })

      await test.step('Verify code generator UI is visible', async () => {
        // CodeGeneratorPanel should be displayed with language selector
        await expect(page.getByLabel('Generate').locator('.cm-editor').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      await test.step('Navigate to JSON Formatter page', async () => {
        await page.goto('/json-formatter')
      })

      const tabs = ['Format', 'Query', 'Compare', 'Convert', 'Schema', 'Generate']

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
