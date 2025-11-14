# E2E Tests

## Objective

These tests validate regression detection through basic functionality verification. They confirm:
1. All pages load without errors
2. Core input/output flows function correctly
3. Critical regressions are detected

## Design Principles

- Focus on essential user flows rather than comprehensive coverage
- Prioritize execution speed and maintainability
- Provide clear failure diagnostics
- Follow Playwright community best practices for test organization

## Directory Structure

```
e2e/
├── tests/                     # All test files organized by category
│   ├── critical/              # Critical tests (smoke, layout)
│   │   ├── layout.spec.ts
│   │   └── smoke.spec.ts
│   └── pages/                 # Page-specific tests
│       ├── dashboard.spec.ts
│       ├── hash.spec.ts
│       ├── bcrypt-hash.spec.ts
│       ├── json-formatter.spec.ts
│       ├── xml-formatter.spec.ts
│       ├── url-encoding.spec.ts
│       ├── json-to-typescript.spec.ts
│       └── markdown.spec.ts
├── fixtures/                  # Test fixtures and utilities
│   ├── index.ts               # Main fixture exports
│   └── api-mocks.ts           # API response mocking
├── config/                    # Test configuration
│   └── global-setup.ts        # Test environment setup
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Test documentation
```

## Execution

```bash
# Run all tests
npm run test:e2e

# Run specific test category
npm run test:e2e -- e2e/tests/critical
npm run test:e2e -- e2e/tests/pages

# Run specific test file
npm run test:e2e -- e2e/tests/critical/smoke.spec.ts
npm run test:e2e -- e2e/tests/pages/dashboard.spec.ts

# Run with UI debugger
npm run test:e2e -- --ui
```

## Test Coverage

### Critical Tests (tests/critical/)
**smoke.spec.ts**: Validates page accessibility and basic rendering across all application routes
- Verifies HTTP 200 responses
- Confirms page title accuracy
- Ensures DOM structure renders

**layout.spec.ts**: Validates common layout elements and responsive behavior
- Verifies topbar and logo display
- Desktop: Confirms sidebar is always visible
- Mobile: Confirms menu button opens/closes sidebar
- Tests navigation link functionality

### Page Tests (tests/pages/)
Validates pages covering both API-dependent and client-side functionality:

**dashboard.spec.ts**: Dashboard page with API integration
- Verifies page sections are visible
- Validates API mock data display (IP address, hostname)
- Confirms HTTP headers table population

**Tool Pages**: Validates input-to-output transformation for utility tools
- **hash.spec.ts**: Hash Generator
- **bcrypt-hash.spec.ts**: BCrypt Hash Generator
- **json-formatter.spec.ts**: JSON Formatter
- **xml-formatter.spec.ts**: XML Formatter
- **url-encoding.spec.ts**: URL Encoding
- **json-to-typescript.spec.ts**: JSON to TypeScript
- **markdown.spec.ts**: Markdown Previewer

Each test verifies the happy path without validating implementation details.

### Test Scope

Included:
- Page load verification
- Basic user workflows
- Critical regression detection

Excluded:
- Algorithm correctness validation (covered by unit tests)
- Input edge case handling
- UI styling verification
- Performance metrics

## Configuration

Test configuration is defined in `../playwright.config.ts`:
- Browser targets: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Timeout: 60 seconds per test
- Retry: 1 attempt on failure
- Reporting: HTML, console output

## Test Implementation Guidelines

1. Categorize the test and create file in appropriate directory:
   - **tests/critical/**: Smoke tests and critical path validation
   - **tests/pages/**: All page-specific tests (dashboard, tools, etc.)
2. Add route entry to `ROUTES` array in `tests/critical/smoke.spec.ts`
3. Implement basic workflow test in `tests/pages/[page-name].spec.ts`
4. Use `pageWithMocks` fixture for tests requiring API calls
5. Verify single happy path only; avoid implementation detail validation

### API Mocking
- Add mock responses to `fixtures/api-mocks.ts`
- Use `pageWithMocks` fixture to automatically apply mocks
- Mock data should be minimal but representative

## Debugging

### Generate and View Reports

```bash
npm run test:e2e
npx playwright show-report
```

### Failure Artifacts

Test failures automatically generate:
- Screenshots (PNG) at failure point
- Video recordings (WebM) of test execution
- Detailed error traces with DOM snapshots

Artifacts are stored in `test-results/` directory.
