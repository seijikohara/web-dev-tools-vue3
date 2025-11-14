import type { Page } from '@playwright/test'

/**
 * Mock API responses for E2E tests
 */

export const mockApiResponses = {
  ip: {
    ipAddress: '203.0.113.42',
    hostName: 'test.example.com',
  },

  httpHeaders: {
    headers: [
      { name: 'Accept', value: 'text/html,application/xhtml+xml' },
      { name: 'Accept-Encoding', value: 'gzip, deflate, br' },
      { name: 'Accept-Language', value: 'en-US,en;q=0.9' },
      { name: 'User-Agent', value: 'Mozilla/5.0 (Test Browser)' },
      { name: 'Host', value: 'localhost:3000' },
    ],
  },

  geo: {
    country: 'United States',
    region: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
  },

  rdap: {
    objectClassName: 'ip network',
    handle: 'TEST-NET-1',
    name: 'TEST-NET',
    type: 'ALLOCATED',
  },

  htmlEntities: {
    content: [
      {
        name: 'amp',
        code: 38,
        code2: null,
        standard: 'HTML 2.0',
        dtd: 'HTMLlat1',
        description: 'ampersand',
        entityReference: '&amp;',
      },
      {
        name: 'AMP',
        code: 38,
        code2: null,
        standard: 'HTML 5.0',
        dtd: null,
        description: 'ampersand',
        entityReference: '&AMP;',
      },
    ],
    pageable: {
      sort: { sorted: false, unsorted: true, empty: true },
      offset: 0,
      pageNumber: 0,
      pageSize: 50,
      paged: true,
      unpaged: false,
    },
    last: true,
    totalPages: 1,
    totalElements: 2,
    numberOfElements: 2,
    sort: { sorted: false, unsorted: true, empty: true },
    first: true,
    number: 0,
    size: 50,
    empty: false,
  },
}

/**
 * Setup API route mocking for a page
 */
export async function setupApiMocks(page: Page) {
  // Mock /api/ip
  await page.route('**/api/ip', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.ip),
    })
  })

  // Mock /api/http-headers
  await page.route('**/api/http-headers', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.httpHeaders),
    })
  })

  // Mock /api/geo/:ip
  await page.route('**/api/geo/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.geo),
    })
  })

  // Mock /api/rdap/:ip
  await page.route('**/api/rdap/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.rdap),
    })
  })

  // Mock /api/html-entities
  await page.route('**/api/html-entities**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.htmlEntities),
    })
  })
}
