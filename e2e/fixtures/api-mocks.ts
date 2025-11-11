import { test as base, Page } from '@playwright/test'
import type { HtmlEntities } from '@/types/api/html-entities'
import type { IpInfo, HttpHeaders } from '@/types/api/ip'
import type { GeoInfo, RdapInfo } from '@/types/api/geo'

/**
 * Mock IP information data for E2E tests
 */
const mockIpInfo: IpInfo = {
  ipAddress: '127.0.0.1',
  hostName: 'localhost',
}

/**
 * Mock HTTP headers data for E2E tests
 */
const mockHttpHeaders: HttpHeaders = {
  headers: [
    { name: 'User-Agent', value: 'Mozilla/5.0 (Test Browser)' },
    { name: 'Accept', value: 'text/html,application/xhtml+xml' },
    { name: 'Accept-Language', value: 'en-US,en;q=0.9' },
    { name: 'Accept-Encoding', value: 'gzip, deflate' },
    { name: 'Connection', value: 'keep-alive' },
  ],
}

/**
 * Mock Geo location data for E2E tests
 */
const mockGeoInfo: GeoInfo = {
  country: 'United States',
  region: 'California',
  city: 'San Francisco',
  timezone: 'America/Los_Angeles',
  latitude: 37.7749,
  longitude: -122.4194,
}

/**
 * Mock RDAP information data for E2E tests
 */
const mockRdapInfo: RdapInfo = {
  rdapConformance: ['rdap_level_0'],
  notices: [
    {
      title: 'Test RDAP Response',
      description: ['This is a mock RDAP response for E2E testing'],
    },
  ],
  handle: '127.0.0.0 - 127.255.255.255',
  startAddress: '127.0.0.0',
  endAddress: '127.255.255.255',
  ipVersion: 'v4',
  name: 'LOOPBACK',
  type: 'RESERVED',
  country: 'US',
}

/**
 * Mock HTML entities data for E2E tests
 * Includes common entities that tests expect to find (amp, lt, gt, etc.)
 */
const mockHtmlEntities: HtmlEntities = {
  content: [
    {
      name: 'amp',
      code: 38,
      code2: null,
      standard: 'HTML 2.0',
      dtd: 'HTMLspecial',
      description: 'ampersand',
      entityReference: '&amp;',
    },
    {
      name: 'lt',
      code: 60,
      code2: null,
      standard: 'HTML 2.0',
      dtd: 'HTMLspecial',
      description: 'less-than sign',
      entityReference: '&lt;',
    },
    {
      name: 'gt',
      code: 62,
      code2: null,
      standard: 'HTML 2.0',
      dtd: 'HTMLspecial',
      description: 'greater-than sign',
      entityReference: '&gt;',
    },
    {
      name: 'quot',
      code: 34,
      code2: null,
      standard: 'HTML 2.0',
      dtd: 'HTMLspecial',
      description: 'quotation mark',
      entityReference: '&quot;',
    },
    {
      name: 'apos',
      code: 39,
      code2: null,
      standard: 'XHTML 1.0',
      dtd: 'HTMLspecial',
      description: 'apostrophe',
      entityReference: '&apos;',
    },
  ],
  pageable: {
    sort: {
      sorted: false,
      unsorted: true,
      empty: true,
    },
    offset: 0,
    pageNumber: 0,
    pageSize: 50,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalPages: 1,
  totalElements: 5,
  numberOfElements: 5,
  sort: {
    sorted: false,
    unsorted: true,
    empty: true,
  },
  first: true,
  number: 0,
  size: 50,
  empty: false,
}

/**
 * Setup API mocks using Playwright's page.route()
 * This intercepts browser HTTP requests at the network level
 */
async function setupApiMocks(page: Page) {
  // Mock IP information API endpoint
  await page.route('**/api/ip', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockIpInfo),
    })
  })

  // Mock HTTP headers API endpoint
  await page.route('**/api/http-headers', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockHttpHeaders),
    })
  })

  // Mock Geo location API endpoint
  await page.route('**/api/geo/**', async route => {
    const url = new URL(route.request().url())
    const ip = url.pathname.split('/').pop()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockGeoInfo,
        ip, // Include the requested IP in the response
      }),
    })
  })

  // Mock RDAP information API endpoint
  await page.route('**/api/rdap/**', async route => {
    const url = new URL(route.request().url())
    const ip = url.pathname.split('/').pop()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockRdapInfo,
        ip, // Include the requested IP in the response
      }),
    })
  })

  // Mock HTML entities API endpoint
  await page.route('**/api/html-entities**', async route => {
    const url = new URL(route.request().url())
    const name = url.searchParams.get('name') || ''
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '50')

    // Filter entities by name if search term provided
    let filteredContent = mockHtmlEntities.content
    if (name) {
      filteredContent = mockHtmlEntities.content.filter(
        entity =>
          entity.name.toLowerCase().includes(name.toLowerCase()) ||
          entity.description?.toLowerCase().includes(name.toLowerCase()),
      )
    }

    // Apply pagination
    const start = page * size
    const end = start + size
    const paginatedContent = filteredContent.slice(start, end)

    const response: HtmlEntities = {
      ...mockHtmlEntities,
      content: paginatedContent,
      totalElements: filteredContent.length,
      totalPages: Math.ceil(filteredContent.length / size),
      numberOfElements: paginatedContent.length,
      number: page,
      size: size,
      first: page === 0,
      last: page >= Math.ceil(filteredContent.length / size) - 1,
      empty: paginatedContent.length === 0,
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * Custom test fixture that automatically sets up API mocks for each test
 */
export const test = base.extend<{ setupMocks: void }>({
  setupMocks: [
    async ({ page }, use) => {
      // Setup API mocks before each test
      await setupApiMocks(page)
      await use()
    },
    { auto: true }, // Automatically apply to all tests that use this fixture
  ],
})

export { expect } from '@playwright/test'
