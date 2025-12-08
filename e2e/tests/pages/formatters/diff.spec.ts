import { test, expect } from '../../../fixtures'

test.describe('Diff Viewer', () => {
  test('should show differences between two texts', async ({ page }) => {
    await test.step('Navigate to Diff Viewer page', async () => {
      await page.goto('/diff-viewer')
    })

    await test.step('Enter original text', async () => {
      // First CodeMirror editor is for original text
      const originalEditor = page.locator('.cm-editor').first()
      await originalEditor.click()
      await page.keyboard.type('Hello World\nThis is a test')
    })

    await test.step('Enter modified text', async () => {
      // Second CodeMirror editor is for modified text
      const modifiedEditor = page.locator('.cm-editor').nth(1)
      await modifiedEditor.click()
      await page.keyboard.type('Hello World\nThis is modified')
    })

    await test.step('Verify diff output is displayed', async () => {
      // Diff container is the main container class
      await expect(page.locator('.diff-container')).toBeVisible()
      // Verify the diff output is shown
      await expect(page.locator('.diff-output')).toBeVisible()
    })
  })

  test('should load sample texts', async ({ page }) => {
    await test.step('Navigate to Diff Viewer page', async () => {
      await page.goto('/diff-viewer')
    })

    await test.step('Click Sample button', async () => {
      // Load Sample button is in Panel header with icon pi-file-import
      await page.locator('button:has(.pi-file-import)').first().click()
    })

    await test.step('Verify diff is displayed', async () => {
      // After loading sample, diff output should be visible
      await expect(page.locator('.diff-output')).toBeVisible()
    })
  })

  test('should swap texts', async ({ page }) => {
    await test.step('Navigate to Diff Viewer page', async () => {
      await page.goto('/diff-viewer')
    })

    await test.step('Load sample texts', async () => {
      await page.locator('button:has(.pi-file-import)').first().click()
    })

    await test.step('Click Swap button', async () => {
      // Swap button has pi-arrows-h icon
      await page.locator('button:has(.pi-arrows-h)').click()
    })

    await test.step('Verify swap completed', async () => {
      // After swapping, diff should still be visible
      await expect(page.locator('.diff-output')).toBeVisible()
    })
  })

  test('should switch to split view', async ({ page }) => {
    await test.step('Navigate to Diff Viewer page', async () => {
      await page.goto('/diff-viewer')
    })

    await test.step('Load sample texts', async () => {
      await page.locator('button:has(.pi-file-import)').first().click()
    })

    await test.step('Switch to split view', async () => {
      // SelectButton has "Split" option
      await page.getByRole('button', { name: 'Split' }).click()
    })

    await test.step('Verify split view is displayed', async () => {
      // Split view uses .diff-output.split class
      await expect(page.locator('.diff-output.split')).toBeVisible()
    })
  })
})
