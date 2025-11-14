import { test, expect } from '../../fixtures'

/**
 * Smoke Tests - Basic page load verification
 */

const ROUTES = [
  { path: '/', title: /Dashboard/, name: 'Home (Dashboard)' },
  { path: '/dashboard', title: /Dashboard/, name: 'Dashboard' },
  { path: '/json-formatter', title: /JSON Formatter/, name: 'JSON Formatter' },
  { path: '/xml-formatter', title: /XML Formatter/, name: 'XML Formatter' },
  { path: '/url-encoding', title: /URL Encoding/, name: 'URL Encoding' },
  { path: '/hash', title: /Hash/, name: 'Hash' },
  { path: '/b-crypt-hash', title: /BCrypt/, name: 'BCrypt Hash' },
  // HTML Entities removed - requires backend API (out of scope for regression tests)
  { path: '/json-to-typescript', title: /JSON to TypeScript/, name: 'JSON to TypeScript' },
  { path: '/markdown', title: /Markdown/, name: 'Markdown' },
] as const

test.describe('Smoke Tests - All Pages Load', () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) should load successfully`, async ({ page }) => {
      await test.step('Navigate to page', async () => {
        await page.goto(route.path)
      })

      await test.step('Verify page loaded correctly', async () => {
        await Promise.all([
          expect.soft(page).toHaveTitle(route.title),
          expect.soft(page.locator('body')).toBeVisible(),
        ])
      })
    })
  }
})
