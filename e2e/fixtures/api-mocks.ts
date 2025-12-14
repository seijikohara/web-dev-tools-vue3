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
    ip: '8.8.8.8',
    hostname: 'dns.google',
    countryCode: 'US',
    countryName: 'United States',
    region: 'California',
    city: 'Mountain View',
    postal: '94043',
    latitude: 37.4056,
    longitude: -122.0775,
    timezone: 'America/Los_Angeles',
    asn: 'AS15169',
    org: 'Google LLC',
    network: '8.8.8.0/24',
  },

  rdap: {
    objectClassName: 'ip network',
    handle: 'NET-8-8-8-0-1',
    name: 'LVLT-GOGL-8-8-8',
    type: 'ALLOCATION',
    startAddress: '8.8.8.0',
    endAddress: '8.8.8.255',
    ipVersion: 'v4',
    country: 'US',
    parentHandle: 'NET-8-0-0-0-1',
    status: ['active'],
    events: [
      { eventAction: 'registration', eventDate: '2014-03-14T16:52:05Z' },
      { eventAction: 'last changed', eventDate: '2014-03-14T16:52:05Z' },
    ],
    entities: [
      {
        handle: 'GOGL',
        roles: ['registrant'],
        vcardArray: [
          'vcard',
          [
            ['fn', {}, 'text', 'Google LLC'],
            [
              'adr',
              {},
              'text',
              ['', '', '1600 Amphitheatre Parkway', 'Mountain View', 'CA', '94043', 'US'],
            ],
          ],
        ],
      },
    ],
  },

  dns: {
    status: 0,
    truncated: false,
    recursionDesired: true,
    recursionAvailable: true,
    authenticData: false,
    checkingDisabled: false,
    question: [{ name: '8.8.8.8', type: 1 }],
    answer: [{ name: '8.8.8.8.in-addr.arpa', type: 12, ttl: 86400, data: 'dns.google' }],
    authority: null,
    additional: null,
  },

  dnsA: {
    status: 0,
    truncated: false,
    recursionDesired: true,
    recursionAvailable: true,
    authenticData: false,
    checkingDisabled: false,
    question: [{ name: 'google.com', type: 1 }],
    answer: [{ name: 'google.com', type: 1, ttl: 300, data: '142.250.80.46' }],
    authority: null,
    additional: null,
  },

  dnsAAAA: {
    status: 0,
    truncated: false,
    recursionDesired: true,
    recursionAvailable: true,
    authenticData: false,
    checkingDisabled: false,
    question: [{ name: 'google.com', type: 28 }],
    answer: [{ name: 'google.com', type: 28, ttl: 300, data: '2607:f8b0:4004:800::200e' }],
    authority: null,
    additional: null,
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

  // Mock /api/dns/resolve/*
  await page.route('**/api/dns/resolve/**', async route => {
    const url = route.request().url()
    const typeParam = new URL(url).searchParams.get('type')

    let response = mockApiResponses.dns
    if (typeParam === 'A') {
      response = mockApiResponses.dnsA
    } else if (typeParam === 'AAAA') {
      response = mockApiResponses.dnsAAAA
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}
