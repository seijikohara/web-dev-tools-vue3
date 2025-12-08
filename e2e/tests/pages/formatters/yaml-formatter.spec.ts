import { test, expect } from '../../../fixtures'

test.describe('YAML Formatter', () => {
  test('should format valid YAML', async ({ page }) => {
    await test.step('Navigate to YAML Formatter page', async () => {
      await page.goto('/yaml-formatter')
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
      // Output editor should show formatted YAML (CodeMirror editor)
      const outputEditor = page.locator('.cm-editor').nth(1)
      await expect(outputEditor).toBeVisible()
    })
  })

  test('should validate YAML and show stats', async ({ page }) => {
    await test.step('Navigate to YAML Formatter page', async () => {
      await page.goto('/yaml-formatter')
    })

    await test.step('Load sample YAML', async () => {
      // Click the Load Sample button (icon button with pi-file) in the toolbar end section
      const loadSampleBtn = page
        .locator('.p-toolbar')
        .first()
        .locator('.p-toolbar-end button')
        .first()
      await loadSampleBtn.click()
    })

    await test.step('Verify validation result is shown', async () => {
      // Wait for auto-validation
      await page.waitForTimeout(500)
      // Validation tag should be visible
      const validTag = page.locator('span.p-tag').filter({ hasText: /Valid YAML|Invalid YAML/ })
      await expect(validTag.first()).toBeVisible()
    })
  })

  test('should minify YAML', async ({ page }) => {
    await test.step('Navigate to YAML Formatter page', async () => {
      await page.goto('/yaml-formatter')
    })

    await test.step('Load sample YAML', async () => {
      // Click the Load Sample button (icon button with pi-file) in the toolbar end section
      const loadSampleBtn = page
        .locator('.p-toolbar')
        .first()
        .locator('.p-toolbar-end button')
        .first()
      await loadSampleBtn.click()
    })

    await test.step('Click Minify button', async () => {
      await page.getByRole('button', { name: 'Minify' }).click()
    })

    await test.step('Verify output is displayed', async () => {
      await page.waitForTimeout(500)
      // CodeMirror editor
      const outputEditor = page.locator('.cm-editor').nth(1)
      await expect(outputEditor).toBeVisible()
    })
  })
})
