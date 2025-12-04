import { test, expect } from '../../../fixtures'

test.describe('Markdown Previewer', () => {
  test('should preview markdown', async ({ page }) => {
    await test.step('Navigate to Markdown page', async () => {
      await page.goto('/markdown')
    })

    await test.step('Enter markdown text', async () => {
      const editor = page.locator('.ace_editor').first()
      await editor.click()
      await page.keyboard.type('# Hello World')
    })

    await test.step('Verify preview is displayed', async () => {
      // Preview uses .preview-content class
      const preview = page.locator('.preview-content')
      await Promise.all([
        expect.soft(preview).toBeVisible(),
        expect.soft(preview).toContainText('Hello World'),
      ])
    })
  })
})
