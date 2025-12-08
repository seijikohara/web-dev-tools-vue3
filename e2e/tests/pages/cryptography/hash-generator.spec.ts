import { test, expect } from '../../../fixtures'

test.describe('Hash Generator', () => {
  test('should generate hash from input', async ({ page }) => {
    await test.step('Navigate to Hash page', async () => {
      await page.goto('/hash')
    })

    await test.step('Enter text to hash', async () => {
      // CodeEditor uses CodeMirror 6 - type into the .cm-content element
      const editor = page.locator('.cm-content')
      await editor.click()
      await page.keyboard.type('test')
    })

    await test.step('Verify hashes are generated', async () => {
      // DataTable for hash results - wait for hash values to appear
      const hashTable = page.locator('.p-datatable')
      await expect(hashTable).toBeVisible()

      // Wait for hash values to be computed (they update reactively)
      await expect(hashTable.locator('code.hash-value').first()).toBeVisible()

      await Promise.all([
        expect.soft(hashTable).toContainText('MD5'),
        expect.soft(hashTable).toContainText('SHA256'),
      ])
    })
  })
})
