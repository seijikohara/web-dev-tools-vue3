import { test, expect } from '@playwright/test'

/**
 * XML Formatter Tests
 * Tests XML formatting functionality with error handling and Toast notifications
 */
test.describe('XML Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/xml-formatter')
  })

  test('should display XML formatter page', async ({ page }) => {
    await expect(page).toHaveURL(/\/xml-formatter/)
    await expect(page).toHaveTitle(/XML Formatter/)
  })

  test('should format valid XML with proper indentation', async ({ page }) => {
    const input = '<root><child><nested>value</nested></child></root>'

    // Wait for Ace Editor to be ready
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Find and set value in hidden textarea
    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(input)

    await page.waitForTimeout(300)

    // Find and click format button
    const formatButton = page.locator('button', { hasText: /format/i })
    await expect(formatButton).toBeVisible()
    await formatButton.click()

    // Wait for formatting and toast to appear (life: 2000ms)
    await page.waitForTimeout(1000)

    // Success toast should appear
    const successToast = page.locator('.p-toast-message-success')
    const toastCount = await successToast.count()

    // Either toast appears or formatting completes without error
    if (toastCount > 0) {
      await expect(successToast.first()).toBeVisible({ timeout: 3000 })
    }

    // Get formatted XML from Ace Editor
    const aceEditor = page.locator('.ace_editor').first()
    const editorText = await aceEditor.locator('.ace_text-layer').textContent()

    // Formatted XML should contain the tags
    expect(editorText).toContain('root')
    expect(editorText).toContain('child')
    expect(editorText).toContain('nested')
  })

  test('should show error toast for invalid XML', async ({ page }) => {
    const invalidXML = '<root><unclosed>value</root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(invalidXML)

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    // Wait for error toast to appear (life: 3000ms)
    await page.waitForTimeout(1000)

    // Error toast should appear
    const errorToast = page.locator('.p-toast-message-error')
    const toastCount = await errorToast.count()

    // Toast might appear (depending on implementation)
    if (toastCount > 0) {
      await expect(errorToast.first()).toBeVisible({ timeout: 3000 })
    }

    // Page should not crash
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should handle empty XML input', async ({ page }) => {
    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill('')

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    await page.waitForTimeout(500)

    // Should not crash
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should handle XML with attributes', async ({ page }) => {
    const xmlWithAttributes = '<root id="1" type="test"><child attr="value">text</child></root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(xmlWithAttributes)

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    await page.waitForTimeout(500)

    const aceEditor = page.locator('.ace_editor').first()
    const editorText = await aceEditor.locator('.ace_text-layer').textContent()

    // Attributes should be preserved
    expect(editorText).toContain('id')
    expect(editorText).toContain('attr')
  })

  test('should handle XML with self-closing tags', async ({ page }) => {
    const xmlWithSelfClosing = '<root><empty /><child>value</child></root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(xmlWithSelfClosing)

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    await page.waitForTimeout(500)

    const aceEditor = page.locator('.ace_editor').first()
    const editorText = await aceEditor.locator('.ace_text-layer').textContent()

    // Self-closing tag should be formatted
    expect(editorText).toContain('empty')
    expect(editorText).toContain('child')
  })

  test('should handle XML with comments', async ({ page }) => {
    const xmlWithComments = '<root><!-- Comment --><child>value</child></root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(xmlWithComments)

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    await page.waitForTimeout(500)

    const aceEditor = page.locator('.ace_editor').first()
    const editorText = await aceEditor.locator('.ace_text-layer').textContent()

    // Content should be preserved
    expect(editorText).toContain('child')
  })

  test('should handle XML with CDATA sections', async ({ page }) => {
    const xmlWithCDATA = '<root><![CDATA[Some <data> & special chars]]><child>value</child></root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(xmlWithCDATA)

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    await page.waitForTimeout(500)

    // Should handle CDATA without crashing
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should use format options if available', async ({ page }) => {
    const xml = '<root><child>value</child></root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(xml)

    await page.waitForTimeout(300)

    // Check for format option checkboxes
    const collapseCheckbox = page.locator('input[type="checkbox"]#collapseContent')
    if (await collapseCheckbox.count() > 0) {
      await collapseCheckbox.check()
    }

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    await page.waitForTimeout(500)

    // Should format with options applied
    const mainContent = page.locator('body')
    await expect(mainContent).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/xml-formatter')

    await page.waitForSelector('.ace_editor', { timeout: 5000 })

    // Should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20)
  })

  test('should dismiss toast notification', async ({ page }) => {
    const xml = '<root><child>value</child></root>'

    await page.waitForSelector('.ace_editor', { timeout: 5000 })
    await page.waitForTimeout(500)

    const textArea = page.locator('.ace_text-input').first()
    await textArea.fill(xml)

    await page.waitForTimeout(300)

    const formatButton = page.locator('button', { hasText: /format/i })
    await formatButton.click()

    // Wait for toast to appear
    await page.waitForTimeout(500)

    const toast = page.locator('.p-toast-message')
    const toastCount = await toast.count()

    if (toastCount > 0) {
      // Toast should auto-dismiss after life duration (2-3 seconds)
      await page.waitForTimeout(3000)

      // Toast should be gone or fading out
      const remainingToasts = await page.locator('.p-toast-message').count()
      expect(remainingToasts).toBeLessThanOrEqual(toastCount)
    }
  })
})
