import { test, expect } from '../../../fixtures'

test.describe('XML Formatter', () => {
  test('should format valid XML', async ({ page }) => {
    await test.step('Navigate to XML Formatter page', async () => {
      await page.goto('/xml-formatter')
    })

    await test.step('Click Load Sample button', async () => {
      // Click the Load Sample button (icon button with pi-file) in the toolbar end section
      const loadSampleBtn = page
        .locator('.p-toolbar')
        .first()
        .locator('.p-toolbar-end button')
        .first()
      await loadSampleBtn.click()
    })

    await test.step('Click Format button', async () => {
      await page.getByRole('button', { name: 'Format', exact: true }).click()
    })

    await test.step('Verify output is displayed', async () => {
      // Wait for formatting to complete
      await page.waitForTimeout(500)
      // Output editor should show formatted XML (CodeMirror editor)
      const outputEditor = page.locator('.cm-editor').nth(1)
      await expect(outputEditor).toBeVisible()
    })
  })
})
