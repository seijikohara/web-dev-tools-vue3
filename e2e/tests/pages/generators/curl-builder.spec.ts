import { test, expect } from '../../../fixtures'

test.describe('cURL Builder', () => {
  test('should build basic GET request', async ({ page }) => {
    await test.step('Navigate to cURL Builder page', async () => {
      await page.goto('/curl-builder')
    })

    await test.step('Enter URL', async () => {
      const urlInput = page.locator('.url-input')
      await urlInput.fill('https://api.example.com/users')
    })

    await test.step('Verify cURL command is generated', async () => {
      // CodeEditor is used, not textarea
      const output = page.locator('.ace_content').last()
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
      // CodeEditor is used, not textarea
      const output = page.locator('.ace_content').last()
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
      // Editable Select component - type directly instead of clicking dropdown
      const headerKeyInput = page.locator('.key-input input').first()
      await headerKeyInput.click()
      await headerKeyInput.fill('Authorization')

      const headerValueInput = page.locator('.value-input').first()
      await headerValueInput.fill('Bearer token123')
    })

    await test.step('Verify header is in command', async () => {
      // CodeEditor is used, not textarea
      const output = page.locator('.ace_content').last()
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
      // Use first() to avoid strict mode violation with toast messages
      await expect(page.getByText('Copied').first()).toBeVisible()
    })
  })
})
