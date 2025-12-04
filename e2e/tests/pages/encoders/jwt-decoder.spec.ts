import { test, expect } from '../../../fixtures'

test.describe('JWT Decoder', () => {
  const sampleJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  test('should decode a valid JWT', async ({ page }) => {
    await test.step('Navigate to JWT Decoder page', async () => {
      await page.goto('/jwt-decoder')
    })

    await test.step('Enter JWT token', async () => {
      // CodeEditor uses ace_editor, click and type
      const editor = page.locator('.ace_editor').first()
      await editor.click()
      await page.keyboard.type(sampleJwt)
    })

    await test.step('Verify header is decoded', async () => {
      // Panel component with Header text
      const headerSection = page.locator('.p-panel').filter({ hasText: 'Header' })
      await expect(headerSection).toBeVisible()
      await expect(headerSection).toContainText('HS256')
    })

    await test.step('Verify payload is decoded', async () => {
      // Panel component with Payload text
      const payloadSection = page.locator('.p-panel').filter({ hasText: 'Payload' })
      await expect(payloadSection).toBeVisible()
      await expect(payloadSection).toContainText('John Doe')
    })

    await test.step('Verify signature section exists', async () => {
      // Panel component with Signature text
      const signatureSection = page.locator('.p-panel').filter({ hasText: 'Signature' })
      await expect(signatureSection).toBeVisible()
    })
  })

  test('should show error for invalid JWT', async ({ page }) => {
    await test.step('Navigate to JWT Decoder page', async () => {
      await page.goto('/jwt-decoder')
    })

    await test.step('Enter invalid JWT', async () => {
      // CodeEditor uses ace_editor
      const editor = page.locator('.ace_editor').first()
      await editor.click()
      await page.keyboard.type('invalid-jwt-token')
    })

    await test.step('Verify error message', async () => {
      // Message severity="error" renders with .p-message and error message text
      await expect(page.locator('.p-message').filter({ hasText: 'Invalid' })).toBeVisible()
    })
  })
})
