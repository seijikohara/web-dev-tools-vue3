import { test, expect } from '../../../fixtures'

test.describe('Regex Tester', () => {
  test('should match pattern in test string', async ({ page }) => {
    await test.step('Navigate to Regex Tester page', async () => {
      await page.goto('/regex-tester')
    })

    await test.step('Enter regex pattern', async () => {
      const patternInput = page.locator('#pattern')
      await patternInput.fill('\\d+')
    })

    await test.step('Enter test string', async () => {
      // CodeEditor is used for test string, not #testString
      const editor = page.locator('.ace_editor').first()
      await editor.click()
      await page.keyboard.type('There are 42 apples and 7 oranges')
    })

    await test.step('Verify matches are found', async () => {
      // Tag component shows match count, not .match-count class
      await expect(page.locator('.match-stats').getByText('2 matches')).toBeVisible()
    })

    await test.step('Verify highlighted text', async () => {
      await expect(page.locator('.highlighted-text')).toBeVisible()
      await expect(page.locator('.highlighted-text .highlight').first()).toBeVisible()
    })
  })

  test('should show error for invalid regex', async ({ page }) => {
    await test.step('Navigate to Regex Tester page', async () => {
      await page.goto('/regex-tester')
    })

    await test.step('Enter invalid pattern', async () => {
      const patternInput = page.locator('#pattern')
      await patternInput.fill('[invalid')
    })

    await test.step('Verify error message', async () => {
      // Tag shows "Invalid" in panel header when pattern is invalid
      await expect(page.locator('.panel-header').getByText('Invalid')).toBeVisible()
      // Message component with severity="error" is also displayed
      await expect(page.locator('.p-message-error')).toBeVisible()
    })
  })

  test('should use common pattern', async ({ page }) => {
    await test.step('Navigate to Regex Tester page', async () => {
      await page.goto('/regex-tester')
    })

    await test.step('Switch to Common Patterns tab', async () => {
      await page.getByRole('tab', { name: 'Common Patterns' }).click()
    })

    await test.step('Click on Email pattern', async () => {
      await page.locator('.pattern-card').filter({ hasText: 'Email' }).click()
    })

    await test.step('Verify pattern is applied', async () => {
      const patternInput = page.locator('#pattern')
      await expect(patternInput).toHaveValue(/\[a-zA-Z0-9/)
    })
  })
})
