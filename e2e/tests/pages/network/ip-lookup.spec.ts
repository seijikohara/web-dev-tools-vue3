import { test, expect } from '../../../fixtures'
import { setupApiMocks } from '../../../fixtures/api-mocks'

test.describe('IP Lookup', () => {
  test.describe('Input Validation', () => {
    test('should validate IPv4 input', async ({ page }) => {
      await test.step('Navigate to IP Lookup page', async () => {
        await page.goto('/ip-lookup')
      })

      await test.step('Enter valid IPv4 address', async () => {
        const input = page.locator('.lookup-input')
        await input.fill('8.8.8.8')
      })

      await test.step('Verify IPv4 tag is shown', async () => {
        const ipv4Tag = page.locator('span.p-tag').filter({ hasText: 'IPV4' })
        await expect(ipv4Tag).toBeVisible()
      })
    })

    test('should validate hostname input', async ({ page }) => {
      await test.step('Navigate to IP Lookup page', async () => {
        await page.goto('/ip-lookup')
      })

      await test.step('Enter valid hostname', async () => {
        const input = page.locator('.lookup-input')
        await input.fill('google.com')
      })

      await test.step('Verify HOSTNAME tag is shown', async () => {
        const hostnameTag = page.locator('span.p-tag').filter({ hasText: 'HOSTNAME' })
        await expect(hostnameTag).toBeVisible()
      })
    })

    test('should show invalid for bad input', async ({ page }) => {
      await test.step('Navigate to IP Lookup page', async () => {
        await page.goto('/ip-lookup')
      })

      await test.step('Enter invalid input', async () => {
        const input = page.locator('.lookup-input')
        await input.fill('not-valid')
      })

      await test.step('Verify Invalid tag is shown', async () => {
        const invalidTag = page.locator('span.p-tag').filter({ hasText: 'Invalid' })
        await expect(invalidTag).toBeVisible()
      })
    })
  })

  test.describe('Lookup Functionality', () => {
    test('should lookup IP address using sample', async ({ page }) => {
      await setupApiMocks(page)

      await test.step('Navigate to IP Lookup page', async () => {
        await page.goto('/ip-lookup')
      })

      await test.step('Click sample button (Google DNS)', async () => {
        await page.getByRole('button', { name: 'Google DNS' }).click()
      })

      await test.step('Verify results section is visible', async () => {
        await expect(page.locator('.results-section')).toBeVisible()
      })
    })

    test('should display sample buttons', async ({ page }) => {
      await test.step('Navigate to IP Lookup page', async () => {
        await page.goto('/ip-lookup')
      })

      await test.step('Verify sample buttons are visible', async () => {
        await Promise.all([
          expect.soft(page.getByRole('button', { name: 'Google DNS' })).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Cloudflare' })).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'Google.com' })).toBeVisible(),
          expect.soft(page.getByRole('button', { name: 'GitHub.com' })).toBeVisible(),
        ])
      })
    })

    test('should clear input', async ({ page }) => {
      await test.step('Navigate to IP Lookup page', async () => {
        await page.goto('/ip-lookup')
      })

      await test.step('Enter input', async () => {
        const input = page.locator('.lookup-input')
        await input.fill('8.8.8.8')
      })

      await test.step('Click Clear button', async () => {
        // Use getByRole for better accessibility and force click to handle mobile overlay issues
        await page.getByRole('button', { name: 'Clear' }).click({ force: true })
      })

      await test.step('Verify input is cleared', async () => {
        const input = page.locator('.lookup-input')
        await expect(input).toHaveValue('')
      })
    })
  })

  test.describe('Result Tabs', () => {
    test.beforeEach(async ({ page }) => {
      await setupApiMocks(page)
      await page.goto('/ip-lookup')
      // Trigger lookup with a sample
      await page.getByRole('button', { name: 'Google DNS' }).click()
      // Wait for results
      await expect(page.locator('.results-section')).toBeVisible()
    })

    test('should display all result tabs', async ({ page }) => {
      await test.step('Verify all tabs are present', async () => {
        await Promise.all([
          expect.soft(page.getByRole('tab', { name: 'GEO Location' })).toBeVisible(),
          expect.soft(page.getByRole('tab', { name: 'RDAP / Whois' })).toBeVisible(),
          expect.soft(page.getByRole('tab', { name: 'DNS Records' })).toBeVisible(),
          expect.soft(page.getByRole('tab', { name: 'Raw Data' })).toBeVisible(),
        ])
      })
    })

    test('should switch to RDAP / Whois tab', async ({ page }) => {
      await test.step('Switch to RDAP / Whois tab', async () => {
        const rdapTab = page.getByRole('tab', { name: 'RDAP / Whois' })
        await rdapTab.click()
        await expect(rdapTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    test('should switch to DNS Records tab', async ({ page }) => {
      await test.step('Switch to DNS Records tab', async () => {
        const dnsTab = page.getByRole('tab', { name: 'DNS Records' })
        await dnsTab.click()
        await expect(dnsTab).toHaveAttribute('aria-selected', 'true')
      })

      await test.step('Verify DNS type selector is visible', async () => {
        await expect(page.getByText('Record Type:')).toBeVisible()
      })
    })

    test('should switch to Raw Data tab', async ({ page }) => {
      await test.step('Switch to Raw Data tab', async () => {
        const rawTab = page.getByRole('tab', { name: 'Raw Data' })
        await rawTab.click()
        await expect(rawTab).toHaveAttribute('aria-selected', 'true')
      })

      await test.step('Verify raw data sections are visible', async () => {
        await expect(page.getByRole('heading', { name: 'GEO Data (JSON)' })).toBeVisible()
      })
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      await setupApiMocks(page)

      await test.step('Navigate and trigger lookup', async () => {
        await page.goto('/ip-lookup')
        await page.getByRole('button', { name: 'Google DNS' }).click()
        await expect(page.locator('.results-section')).toBeVisible()
      })

      const tabs = ['GEO Location', 'RDAP / Whois', 'DNS Records', 'Raw Data']

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
