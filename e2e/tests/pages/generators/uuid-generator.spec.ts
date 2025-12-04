import { test, expect } from '../../../fixtures'

test.describe('UUID Generator', () => {
  test('should generate UUID v4', async ({ page }) => {
    await test.step('Navigate to UUID Generator page', async () => {
      await page.goto('/uuid-generator')
    })

    await test.step('Click Generate button', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
    })

    await test.step('Verify UUID is generated', async () => {
      const uuidCell = page.locator('.uuid-value').first()
      await expect(uuidCell).toBeVisible()

      const uuidText = await uuidCell.textContent()
      expect(uuidText).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })
  })

  test('should generate multiple UUIDs', async ({ page }) => {
    await test.step('Navigate to UUID Generator page', async () => {
      await page.goto('/uuid-generator')
    })

    await test.step('Set count to 5', async () => {
      // InputNumber - target the inner input element
      const countInput = page.locator('#count input')
      await countInput.click()
      await countInput.fill('5')
    })

    await test.step('Click Generate button', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
    })

    await test.step('Verify 5 UUIDs are generated', async () => {
      const uuidCells = page.locator('.uuid-value')
      await expect(uuidCells).toHaveCount(5)
    })
  })

  test('should clear generated UUIDs', async ({ page }) => {
    await test.step('Navigate to UUID Generator page', async () => {
      await page.goto('/uuid-generator')
    })

    await test.step('Generate UUIDs', async () => {
      await page.getByRole('button', { name: 'Generate' }).click()
      await expect(page.locator('.uuid-value').first()).toBeVisible()
    })

    await test.step('Click Clear button', async () => {
      // Clear All button has pi-trash icon with tooltip
      await page.locator('button:has(.pi-trash)').click()
    })

    await test.step('Verify UUIDs are cleared', async () => {
      await expect(page.locator('.uuid-value')).toHaveCount(0)
    })
  })
})
