import { test, expect } from '../../../fixtures'

test.describe('QR Code Generator', () => {
  test('should generate QR code from text', async ({ page }) => {
    await test.step('Navigate to QR Code Generator page', async () => {
      await page.goto('/qr-code')
    })

    await test.step('Enter text content', async () => {
      const textarea = page.locator('textarea')
      await textarea.fill('https://example.com')
    })

    await test.step('Verify QR code is generated', async () => {
      const qrImage = page.locator('.qr-image')
      await expect(qrImage).toBeVisible()
    })
  })

  test('should load URL sample', async ({ page }) => {
    await test.step('Navigate to QR Code Generator page', async () => {
      await page.goto('/qr-code')
    })

    await test.step('Click URL sample button', async () => {
      await page.getByRole('button', { name: 'URL' }).click()
    })

    await test.step('Verify sample URL is loaded and QR code is generated', async () => {
      const textarea = page.locator('textarea')
      await expect(textarea).toHaveValue('https://example.com')
      const qrImage = page.locator('.qr-image')
      await expect(qrImage).toBeVisible()
    })
  })

  test('should load vCard sample', async ({ page }) => {
    await test.step('Navigate to QR Code Generator page', async () => {
      await page.goto('/qr-code')
    })

    await test.step('Click vCard sample button', async () => {
      await page.getByRole('button', { name: 'vCard' }).click()
    })

    await test.step('Verify vCard is loaded', async () => {
      const textarea = page.locator('textarea')
      const value = await textarea.inputValue()
      expect(value).toContain('BEGIN:VCARD')
    })
  })

  test('should download PNG', async ({ page }) => {
    await test.step('Navigate to QR Code Generator page', async () => {
      await page.goto('/qr-code')
    })

    await test.step('Enter text content', async () => {
      const textarea = page.locator('textarea')
      await textarea.fill('Test content')
    })

    await test.step('Verify Download PNG button is visible', async () => {
      const downloadButton = page.getByRole('button', { name: 'Download PNG' })
      await expect(downloadButton).toBeVisible()
    })
  })
})
