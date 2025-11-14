import { test, expect } from '../../fixtures'

test.describe('Hash Generator', () => {
  test('should generate hash from input', async ({ page }) => {
    await test.step('Navigate to Hash page', async () => {
      await page.goto('/hash')
    })

    await test.step('Enter text to hash', async () => {
      const input = page.getByRole('textbox')
      await input.fill('test')
    })

    await test.step('Verify hashes are generated', async () => {
      const hashTable = page.locator('table')
      await Promise.all([
        expect.soft(hashTable).toBeVisible(),
        expect.soft(hashTable).toContainText('md5'),
        expect.soft(hashTable).toContainText('sha256'),
      ])
    })
  })
})
