import { test, expect } from '../../../fixtures'

test.describe('Hash Generator', () => {
  test('should generate hash from input', async ({ page }) => {
    await test.step('Navigate to Hash page', async () => {
      await page.goto('/hash')
    })

    await test.step('Enter text to hash', async () => {
      // CodeEditor uses ace-editor
      const editor = page.locator('.ace_text-input').first()
      await editor.fill('test')
    })

    await test.step('Verify hashes are generated', async () => {
      // DataTable for hash results
      const hashTable = page.locator('.p-datatable')
      await Promise.all([
        expect.soft(hashTable).toBeVisible(),
        expect.soft(hashTable).toContainText('MD5'),
        expect.soft(hashTable).toContainText('SHA256'),
      ])
    })
  })
})
