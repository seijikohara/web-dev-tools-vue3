---
paths: e2e/**/*.{ts,spec.ts}
---

# E2E Testing Guidelines (Playwright)

## Directory Structure

```
e2e/
├── fixtures/
│   ├── index.ts        # Custom test fixtures
│   └── api-mocks.ts    # API mock data
├── tests/
│   ├── critical/       # Smoke tests, core functionality
│   └── pages/          # Feature tests by category
└── playwright.config.ts
```

## Test Structure

```typescript
import { test, expect } from '../fixtures'

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/path')
    })

    await test.step('Enter input', async () => {
      const editor = page.locator('.cm-content')
      await editor.click()
      await page.keyboard.type('test input')
    })

    await test.step('Verify result', async () => {
      await expect(page.locator('.output')).toContainText('expected')
    })
  })
})
```

## Locator Strategies

### CodeMirror Editors

```typescript
const editor = page.locator('.cm-content')
await editor.click()
await page.keyboard.type('content')
```

### PrimeVue Components

```typescript
// Button
await page.click('.p-button:has-text("Execute")')

// DataTable
const table = page.locator('.p-datatable')
await expect(table).toBeVisible()

// Tabs
await page.click('.p-tablist .p-tab:has-text("Tab Name")')
const panel = page.locator('[role="tabpanel"]')

// Dropdown
await page.click('.p-dropdown')
await page.click('.p-dropdown-item:has-text("Option")')

// Toast
await expect(page.locator('.p-toast-message')).toBeVisible()
```

### Test IDs (Preferred)

```typescript
const output = page.locator('[data-testid="output"]')
```

## Best Practices

### Use Test Steps

```typescript
await test.step('Description', async () => {
  // Actions
})
```

### Soft Assertions

```typescript
await Promise.all([
  expect.soft(page.locator('.a')).toBeVisible(),
  expect.soft(page.locator('.b')).toBeVisible(),
])
```

### Wait for Content

```typescript
await expect(page.locator('.result')).toBeVisible()
await page.waitForLoadState('networkidle')
```

### API Mocking

```typescript
await page.route('**/api/endpoint', route =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockData),
  })
)
```

## Custom Fixtures

```typescript
// e2e/fixtures/index.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  // Custom fixtures
})

export { expect } from '@playwright/test'
```

## Running Tests

```bash
npm run test:e2e              # Run all
npm run test:e2e -- --ui      # Visual UI
npm run test:e2e -- --headed  # With browser
npm run test:e2e -- -g "Name" # Filter by name
```
