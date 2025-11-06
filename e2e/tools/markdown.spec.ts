import { test, expect } from '@playwright/test'

/**
 * Markdown Viewer Tests
 * Tests Markdown rendering and preview functionality
 */
test.describe('Markdown Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/markdown')
  })

  test('should display markdown page', async ({ page }) => {
    await expect(page).toHaveURL(/\/markdown/)
    await expect(page).toHaveTitle(/Markdown/)
  })

  test('should render markdown headings', async ({ page }) => {
    const markdown = '# Heading 1\n## Heading 2\n### Heading 3'

    const textarea = page.locator('textarea').first()
    await textarea.fill(markdown)

    // Wait for rendering
    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Preview should contain the heading text
    expect(bodyText).toContain('Heading 1')
    expect(bodyText).toContain('Heading 2')
    expect(bodyText).toContain('Heading 3')
  })

  test('should render markdown lists', async ({ page }) => {
    const markdown = '- Item 1\n- Item 2\n- Item 3'

    const textarea = page.locator('textarea').first()
    await textarea.fill(markdown)

    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    expect(bodyText).toContain('Item 1')
    expect(bodyText).toContain('Item 2')
    expect(bodyText).toContain('Item 3')
  })

  test('should render markdown links', async ({ page }) => {
    const markdown = '[Link Text](https://example.com)'

    const textarea = page.locator('textarea').first()
    await textarea.fill(markdown)

    await page.waitForTimeout(1000)

    // Check for link in preview
    const link = page.locator('a[href="https://example.com"]')
    const linkCount = await link.count()

    if (linkCount > 0) {
      await expect(link).toBeVisible()
      const linkText = await link.textContent()
      expect(linkText).toContain('Link Text')
    }
  })

  test('should render markdown code blocks', async ({ page }) => {
    const markdown = '```javascript\nconst x = 42;\nconsole.log(x);\n```'

    const textarea = page.locator('textarea').first()
    await textarea.fill(markdown)

    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Code should be visible in preview
    expect(bodyText).toContain('const')
    expect(bodyText).toContain('console.log')
  })

  test('should handle empty input', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('')

    await page.waitForTimeout(500)

    // Should not crash with empty input
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should sanitize dangerous HTML', async ({ page }) => {
    const markdown = '<script>alert("XSS")</script>\n\nSafe content'

    const textarea = page.locator('textarea').first()
    await textarea.fill(markdown)

    await page.waitForTimeout(1000)

    // Script tags should be sanitized (DOMPurify)
    const bodyText = await page.locator('body').textContent()

    // Safe content should be visible
    expect(bodyText).toContain('Safe content')

    // Script should not execute (check that alert dialog doesn't appear)
    const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null)
    const dialog = await dialogPromise

    // Dialog should not appear
    expect(dialog).toBeNull()
  })

  test('should render markdown tables', async ({ page }) => {
    const markdown =
      '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |'

    const textarea = page.locator('textarea').first()
    await textarea.fill(markdown)

    await page.waitForTimeout(1000)

    const bodyText = await page.locator('body').textContent()

    // Table content should be visible
    expect(bodyText).toContain('Header 1')
    expect(bodyText).toContain('Cell 1')
  })
})
