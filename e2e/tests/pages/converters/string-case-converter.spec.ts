import { test, expect } from '../../../fixtures'

test.describe('String Case Converter', () => {
  test('should convert text to various cases', async ({ page }) => {
    await test.step('Navigate to String Case Converter page', async () => {
      await page.goto('/string-case')
    })

    await test.step('Enter input text', async () => {
      // CodeEditor uses ace-editor
      const editor = page.locator('.ace_text-input').first()
      await editor.fill('hello world')
    })

    await test.step('Verify conversions are displayed', async () => {
      const resultsTable = page.locator('.p-datatable')
      await expect(resultsTable).toBeVisible()

      // Check for camelCase (use first() to avoid strict mode violation)
      const camelCase = page.getByText('helloWorld', { exact: true }).first()
      await expect(camelCase).toBeVisible()

      // Check for PascalCase
      const pascalCase = page.getByText('HelloWorld', { exact: true }).first()
      await expect(pascalCase).toBeVisible()

      // Check for snake_case
      const snakeCase = page.getByText('hello_world', { exact: true }).first()
      await expect(snakeCase).toBeVisible()

      // Check for kebab-case
      const kebabCase = page.getByText('hello-world', { exact: true }).first()
      await expect(kebabCase).toBeVisible()
    })
  })

  test('should load sample text', async ({ page }) => {
    await test.step('Navigate to String Case Converter page', async () => {
      await page.goto('/string-case')
    })

    await test.step('Click Sample button', async () => {
      await page.getByRole('button', { name: 'Sample' }).click()
    })

    await test.step('Verify sample is loaded and results appear', async () => {
      // After loading sample, results table should be visible
      const resultsTable = page.locator('.p-datatable')
      await expect(resultsTable).toBeVisible()
    })
  })

  test('should copy conversion result', async ({ page }) => {
    await test.step('Navigate to String Case Converter page', async () => {
      await page.goto('/string-case')
    })

    await test.step('Click Sample button to load data', async () => {
      await page.getByRole('button', { name: 'Sample' }).click()
    })

    await test.step('Click copy button', async () => {
      // Wait for results table to be visible
      await expect(page.locator('.p-datatable')).toBeVisible()
      // Copy button in table
      const copyButtons = page.locator('.p-datatable button').first()
      await copyButtons.click()
    })

    await test.step('Verify toast message appears', async () => {
      // Use first() to avoid strict mode violation with toast messages
      await expect(page.getByText('Copied').first()).toBeVisible()
    })
  })
})
