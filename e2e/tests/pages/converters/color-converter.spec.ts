import { test, expect } from '../../../fixtures'

test.describe('Color Converter', () => {
  test('should convert HEX to RGB', async ({ page }) => {
    await test.step('Navigate to Color Converter page', async () => {
      await page.goto('/color-converter')
    })

    await test.step('Enter HEX color', async () => {
      const hexInput = page.locator('.format-input').first()
      await hexInput.fill('#FF5733')
      await hexInput.blur()
    })

    await test.step('Verify RGB conversion', async () => {
      const rgbInput = page.locator('.format-input').nth(1)
      await expect(rgbInput).toHaveValue(/rgb\(255, 87, 51\)/i)
    })
  })

  test('should update color preview', async ({ page }) => {
    await test.step('Navigate to Color Converter page', async () => {
      await page.goto('/color-converter')
    })

    await test.step('Verify color preview is visible', async () => {
      await expect(page.locator('.color-preview')).toBeVisible()
    })

    await test.step('Enter new HEX color', async () => {
      const hexInput = page.locator('.format-input').first()
      await hexInput.fill('#00FF00')
      await hexInput.blur()
    })

    await test.step('Verify preview shows green', async () => {
      const preview = page.locator('.color-preview')
      await expect(preview).toHaveCSS('background-color', 'rgb(0, 255, 0)')
    })
  })

  test('should select color from palette', async ({ page }) => {
    await test.step('Navigate to Color Converter page', async () => {
      await page.goto('/color-converter')
    })

    await test.step('Click on palette color', async () => {
      const paletteItem = page.locator('.palette-item').first()
      await paletteItem.click()
    })

    await test.step('Verify HEX input is updated', async () => {
      const hexInput = page.locator('.format-input').first()
      await expect(hexInput).not.toHaveValue('#3B82F6')
    })
  })
})
