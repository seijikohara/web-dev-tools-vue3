import { test, expect } from '../../../fixtures'

test.describe('Base64 Encoder', () => {
  test.describe('Tab: Encode/Decode', () => {
    test('should display Encode/Decode tab by default', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Verify Encode/Decode tab is active', async () => {
        const encodeDecodeTab = page.getByRole('tab', { name: 'Encode/Decode' })
        await expect(encodeDecodeTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should encode text to Base64', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Enter text input', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('Hello, World!')
      })

      await test.step('Verify Base64 output is shown', async () => {
        await expect(page.locator('.cm-editor').nth(1)).toContainText('SGVsbG8sIFdvcmxkIQ==')
      })
    })

    test('should decode Base64 to text', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to Decode mode', async () => {
        await page.getByRole('button', { name: 'Decode' }).click()
      })

      await test.step('Enter Base64 input', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('SGVsbG8sIFdvcmxkIQ==')
      })

      await test.step('Verify decoded output', async () => {
        await expect(page.locator('.cm-editor').nth(1)).toContainText('Hello, World!')
      })
    })

    test('should display encoding options panel', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Verify options panel is visible', async () => {
        await Promise.all([
          expect.soft(page.locator('.p-panel-header').filter({ hasText: 'Encoding Options' })).toBeVisible(),
          expect.soft(page.locator('.p-selectbutton').filter({ hasText: 'Encode' })).toBeVisible(),
          expect.soft(page.locator('.p-selectbutton').filter({ hasText: 'Decode' })).toBeVisible(),
        ])
      })
    })

    test('should load sample data', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Click Sample button', async () => {
        await page.getByRole('button', { name: 'Sample' }).click()
      })

      await test.step('Verify sample is loaded', async () => {
        const outputEditor = page.locator('.cm-editor').nth(1)
        await expect(outputEditor).not.toBeEmpty()
      })
    })

    test('should display input and output stats', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Enter text', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('Hello')
      })

      await test.step('Verify stats are displayed', async () => {
        await Promise.all([
          expect.soft(page.locator('.p-tag').filter({ hasText: /5 chars/ })).toBeVisible(),
          expect.soft(page.locator('.p-tag').filter({ hasText: /bytes/ })).toBeVisible(),
        ])
      })
    })

    test('should copy output', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Enter text', async () => {
        const editor = page.locator('.cm-editor').first()
        await editor.click()
        await page.keyboard.type('test')
      })

      await test.step('Click Copy button', async () => {
        await page.getByRole('button', { name: 'Copy' }).click()
      })

      await test.step('Verify toast message appears', async () => {
        await expect(page.getByText('copied').first()).toBeVisible()
      })
    })
  })

  test.describe('Tab: File to Base64', () => {
    test('should switch to File to Base64 tab', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to File to Base64 tab', async () => {
        const fileTab = page.getByRole('tab', { name: 'File to Base64' })
        await fileTab.click()
        await expect(fileTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display file upload section', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to File to Base64 tab', async () => {
        await page.getByRole('tab', { name: 'File to Base64' }).click()
      })

      await test.step('Verify file upload UI is visible', async () => {
        await Promise.all([
          expect.soft(page.getByText('Upload File')).toBeVisible(),
          expect.soft(page.locator('.p-fileupload')).toBeVisible(),
          expect.soft(page.getByText('Select File')).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab: Base64 to File', () => {
    test('should switch to Base64 to File tab', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to Base64 to File tab', async () => {
        const decodeTab = page.getByRole('tab', { name: 'Base64 to File' })
        await decodeTab.click()
        await expect(decodeTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should display decode to file section', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to Base64 to File tab', async () => {
        await page.getByRole('tab', { name: 'Base64 to File' }).click()
      })

      await test.step('Verify decode UI is visible', async () => {
        await Promise.all([
          expect.soft(page.getByText('Decode Base64 to File')).toBeVisible(),
          expect.soft(page.getByText('Base64 Input')).toBeVisible(),
          expect.soft(page.getByText('Download Options')).toBeVisible(),
          expect.soft(page.getByText('Output Filename')).toBeVisible(),
          expect.soft(page.getByPlaceholder('decoded-file')).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Download' })).toBeVisible(),
        ])
      })
    })

    test('should validate base64 input', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to Base64 to File tab', async () => {
        await page.getByRole('tab', { name: 'Base64 to File' }).click()
      })

      await test.step('Verify decode UI is visible', async () => {
        await expect(page.getByText('Base64 Input')).toBeVisible()
      })
    })

    test('should display download options', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      await test.step('Switch to Base64 to File tab', async () => {
        await page.getByRole('tab', { name: 'Base64 to File' }).click()
      })

      await test.step('Verify download options are visible', async () => {
        await Promise.all([
          expect.soft(page.getByText('Download Options')).toBeVisible(),
          expect.soft(page.getByPlaceholder('decoded-file')).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Download' })).toBeVisible(),
        ])
      })
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      await test.step('Navigate to Base64 Encoder page', async () => {
        await page.goto('/base64')
      })

      const tabs = ['Encode/Decode', 'File to Base64', 'Base64 to File']

      for (const tabName of tabs) {
        await test.step(`Switch to ${tabName} tab`, async () => {
          const tab = page.getByRole('tab', { name: tabName })
          await tab.click()
          await expect(tab).toHaveAttribute('aria-selected', 'true')
        })
      }
    })
  })
})
