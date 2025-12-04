import { test, expect } from '../../../fixtures'

test.describe('Base64 Encoder', () => {
  test('should encode text to Base64', async ({ page }) => {
    await test.step('Navigate to Base64 Encoder page', async () => {
      await page.goto('/base64')
    })

    await test.step('Enter text input', async () => {
      // CodeEditor uses ace-editor
      const editor = page.locator('.ace_text-input').first()
      await editor.fill('Hello, World!')
    })

    await test.step('Verify Base64 output is shown', async () => {
      // Output is auto-generated in the second CodeEditor
      // Check that SGVsbG8sIFdvcmxkIQ== appears in the output area
      await expect(page.locator('.ace_content').nth(1)).toContainText('SGVsbG8sIFdvcmxkIQ==')
    })
  })

  test('should decode Base64 to text', async ({ page }) => {
    await test.step('Navigate to Base64 Encoder page', async () => {
      await page.goto('/base64')
    })

    await test.step('Switch to Decode mode', async () => {
      // Click the Decode option in SelectButton
      await page.getByRole('button', { name: 'Decode' }).click()
    })

    await test.step('Enter Base64 input', async () => {
      const editor = page.locator('.ace_text-input').first()
      await editor.fill('SGVsbG8sIFdvcmxkIQ==')
    })

    await test.step('Verify decoded output', async () => {
      await expect(page.locator('.ace_content').nth(1)).toContainText('Hello, World!')
    })
  })
})
