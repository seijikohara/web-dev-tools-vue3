import { describe, it, expect, beforeEach } from 'vitest'
import {
  METHOD_OPTIONS,
  BODY_TYPE_OPTIONS,
  COMMON_HEADERS,
  DEFAULT_OPTIONS,
  SAMPLE_REQUEST,
  createEmptyHeader,
  createEmptyQueryParam,
  escapeShell,
  buildUrlWithParams,
  generateCurlCommand,
  parseCurlString,
  useCurlBuilder,
} from '../useCurlBuilder'

describe('useCurlBuilder', () => {
  describe('Constants', () => {
    it('should have method options', () => {
      expect(METHOD_OPTIONS.length).toBe(7)
      const values = METHOD_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('GET')
      expect.soft(values).toContain('POST')
      expect.soft(values).toContain('PUT')
      expect.soft(values).toContain('PATCH')
      expect.soft(values).toContain('DELETE')
      expect.soft(values).toContain('HEAD')
      expect.soft(values).toContain('OPTIONS')
    })

    it('should have body type options', () => {
      expect(BODY_TYPE_OPTIONS.length).toBe(4)
      const values = BODY_TYPE_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('none')
      expect.soft(values).toContain('json')
      expect.soft(values).toContain('form')
      expect.soft(values).toContain('raw')
    })

    it('should have common headers', () => {
      expect(COMMON_HEADERS.length).toBeGreaterThan(0)
      const values = COMMON_HEADERS.map(h => h.value)
      expect.soft(values).toContain('Content-Type')
      expect.soft(values).toContain('Authorization')
      expect.soft(values).toContain('Accept')
    })

    it('should have default options', () => {
      expect.soft(DEFAULT_OPTIONS.followRedirects).toBe(true)
      expect.soft(DEFAULT_OPTIONS.insecure).toBe(false)
      expect.soft(DEFAULT_OPTIONS.verbose).toBe(false)
      expect.soft(DEFAULT_OPTIONS.timeout).toBe(0)
    })

    it('should have sample request', () => {
      expect.soft(SAMPLE_REQUEST.method).toBe('POST')
      expect.soft(SAMPLE_REQUEST.url).toBeTruthy()
      expect.soft(SAMPLE_REQUEST.headers.length).toBeGreaterThan(0)
      expect.soft(SAMPLE_REQUEST.body).toBeTruthy()
    })
  })

  describe('createEmptyHeader', () => {
    it('should create empty header with defaults', () => {
      const header = createEmptyHeader()
      expect.soft(header.key).toBe('')
      expect.soft(header.value).toBe('')
      expect.soft(header.enabled).toBe(true)
    })
  })

  describe('createEmptyQueryParam', () => {
    it('should create empty query param with defaults', () => {
      const param = createEmptyQueryParam()
      expect.soft(param.key).toBe('')
      expect.soft(param.value).toBe('')
      expect.soft(param.enabled).toBe(true)
    })
  })

  describe('escapeShell', () => {
    it('should return quoted empty string for empty input', () => {
      expect(escapeShell('')).toBe("''")
    })

    it('should not escape simple alphanumeric strings', () => {
      expect.soft(escapeShell('simple')).toBe('simple')
      expect.soft(escapeShell('test123')).toBe('test123')
    })

    it('should not escape safe characters', () => {
      expect.soft(escapeShell('a-b_c.d')).toBe('a-b_c.d')
      expect.soft(escapeShell('http://example.com')).toBe('http://example.com')
      expect.soft(escapeShell('user:pass@host')).toBe('user:pass@host')
    })

    it('should escape strings with spaces', () => {
      expect(escapeShell('hello world')).toBe("'hello world'")
    })

    it('should escape strings with special characters', () => {
      expect.soft(escapeShell('test$var')).toBe("'test$var'")
      expect.soft(escapeShell('test;cmd')).toBe("'test;cmd'")
    })

    it('should escape single quotes properly', () => {
      const result = escapeShell("it's")
      expect(result).toBe("'it'\\''s'")
    })
  })

  describe('buildUrlWithParams', () => {
    it('should return empty string for empty URL', () => {
      expect(buildUrlWithParams('', [])).toBe('')
    })

    it('should return URL as-is for empty params', () => {
      expect(buildUrlWithParams('https://example.com', [])).toBe('https://example.com')
    })

    it('should ignore disabled params', () => {
      const params = [{ key: 'foo', value: 'bar', enabled: false }]
      expect(buildUrlWithParams('https://example.com', params)).toBe('https://example.com')
    })

    it('should ignore params without key', () => {
      const params = [{ key: '', value: 'bar', enabled: true }]
      expect(buildUrlWithParams('https://example.com', params)).toBe('https://example.com')
    })

    it('should add single query param', () => {
      const params = [{ key: 'foo', value: 'bar', enabled: true }]
      expect(buildUrlWithParams('https://example.com', params)).toBe('https://example.com?foo=bar')
    })

    it('should add multiple query params', () => {
      const params = [
        { key: 'foo', value: 'bar', enabled: true },
        { key: 'baz', value: 'qux', enabled: true },
      ]
      expect(buildUrlWithParams('https://example.com', params)).toBe(
        'https://example.com?foo=bar&baz=qux',
      )
    })

    it('should append to existing query string', () => {
      const params = [{ key: 'foo', value: 'bar', enabled: true }]
      expect(buildUrlWithParams('https://example.com?existing=1', params)).toBe(
        'https://example.com?existing=1&foo=bar',
      )
    })

    it('should encode special characters', () => {
      const params = [{ key: 'key', value: 'value with spaces', enabled: true }]
      expect(buildUrlWithParams('https://example.com', params)).toBe(
        'https://example.com?key=value%20with%20spaces',
      )
    })
  })

  describe('generateCurlCommand', () => {
    const defaultOptions = { ...DEFAULT_OPTIONS }
    const emptyHeaders: Parameters<typeof generateCurlCommand>[2] = []
    const emptyParams: Parameters<typeof generateCurlCommand>[3] = []

    it('should generate basic GET request', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        defaultOptions,
      )
      expect.soft(cmd).toContain('curl')
      expect.soft(cmd).toContain('https://example.com')
      expect.soft(cmd).not.toContain('-X GET')
    })

    it('should include method for non-GET requests', () => {
      const cmd = generateCurlCommand(
        'POST',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        defaultOptions,
      )
      expect(cmd).toContain('-X POST')
    })

    it('should include -L for followRedirects', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, followRedirects: true },
      )
      expect(cmd).toContain('-L')
    })

    it('should include -k for insecure', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, insecure: true },
      )
      expect(cmd).toContain('-k')
    })

    it('should include -v for verbose', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, verbose: true },
      )
      expect(cmd).toContain('-v')
    })

    it('should include -s for silent', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, silent: true },
      )
      expect(cmd).toContain('-s')
    })

    it('should include --compressed', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, compressed: true },
      )
      expect(cmd).toContain('--compressed')
    })

    it('should include timeout options', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, timeout: 30, maxTime: 60 },
      )
      expect.soft(cmd).toContain('--connect-timeout 30')
      expect.soft(cmd).toContain('-m 60')
    })

    it('should include output file', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, output: 'result.json' },
      )
      expect(cmd).toContain('-o result.json')
    })

    it('should include proxy', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, proxy: 'http://proxy:8080' },
      )
      expect(cmd).toContain('-x http://proxy:8080')
    })

    it('should include user agent', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, userAgent: 'MyApp/1.0' },
      )
      expect(cmd).toContain('-A MyApp/1.0')
    })

    it('should include basic auth', () => {
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '',
        'none',
        { ...defaultOptions, basicAuth: 'user:pass' },
      )
      expect(cmd).toContain('-u user:pass')
    })

    it('should include enabled headers', () => {
      const headers = [
        { key: 'Authorization', value: 'Bearer token', enabled: true },
        { key: 'Disabled', value: 'should not appear', enabled: false },
      ]
      const cmd = generateCurlCommand(
        'GET',
        'https://example.com',
        headers,
        emptyParams,
        '',
        'none',
        defaultOptions,
      )
      expect.soft(cmd).toContain('-H')
      expect.soft(cmd).toContain('Authorization: Bearer token')
      expect.soft(cmd).not.toContain('Disabled')
    })

    it('should add Content-Type for JSON body', () => {
      const cmd = generateCurlCommand(
        'POST',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        '{"key": "value"}',
        'json',
        defaultOptions,
      )
      expect.soft(cmd).toContain('Content-Type: application/json')
      expect.soft(cmd).toContain('-d')
    })

    it('should add Content-Type for form body', () => {
      const cmd = generateCurlCommand(
        'POST',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        'key=value',
        'form',
        defaultOptions,
      )
      expect(cmd).toContain('Content-Type: application/x-www-form-urlencoded')
    })

    it('should not add Content-Type if already present', () => {
      const headers = [{ key: 'Content-Type', value: 'text/plain', enabled: true }]
      const cmd = generateCurlCommand(
        'POST',
        'https://example.com',
        headers,
        emptyParams,
        '{"key": "value"}',
        'json',
        defaultOptions,
      )
      const contentTypeCount = (cmd.match(/Content-Type/g) || []).length
      expect(contentTypeCount).toBe(1)
    })

    it('should include body data', () => {
      const cmd = generateCurlCommand(
        'POST',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        'test body',
        'raw',
        defaultOptions,
      )
      expect(cmd).toContain("-d 'test body'")
    })

    it('should not include body for none type', () => {
      const cmd = generateCurlCommand(
        'POST',
        'https://example.com',
        emptyHeaders,
        emptyParams,
        'test body',
        'none',
        defaultOptions,
      )
      expect(cmd).not.toContain('-d')
    })
  })

  describe('parseCurlString', () => {
    it('should parse simple GET request', () => {
      const result = parseCurlString('curl https://example.com')
      expect.soft(result.method).toBe('GET')
      expect.soft(result.url).toBe('https://example.com')
    })

    it('should parse method with -X flag', () => {
      const result = parseCurlString('curl -X POST https://example.com')
      expect(result.method).toBe('POST')
    })

    it('should parse method with --request flag', () => {
      const result = parseCurlString('curl --request PUT https://example.com')
      expect(result.method).toBe('PUT')
    })

    it('should parse headers with -H flag', () => {
      const result = parseCurlString("curl -H 'Content-Type: application/json' https://example.com")
      expect.soft(result.headers.length).toBe(1)
      expect.soft(result.headers[0]?.key).toBe('Content-Type')
      expect.soft(result.headers[0]?.value).toBe('application/json')
    })

    it('should parse multiple headers', () => {
      const result = parseCurlString(
        "curl -H 'Authorization: Bearer token' -H 'Accept: application/json' https://example.com",
      )
      expect(result.headers.length).toBe(2)
    })

    it('should parse body with -d flag', () => {
      const result = parseCurlString('curl -d \'{"key":"value"}\' https://example.com')
      expect(result.body).toBe('{"key":"value"}')
    })

    it('should parse body with --data flag', () => {
      const result = parseCurlString("curl --data 'test=data' https://example.com")
      expect(result.body).toBe('test=data')
    })

    it('should parse body with --data-raw flag', () => {
      const result = parseCurlString("curl --data-raw 'raw data' https://example.com")
      expect(result.body).toBe('raw data')
    })

    it('should handle double quoted values', () => {
      const result = parseCurlString('curl -H "Content-Type: application/json" https://example.com')
      expect.soft(result.headers[0]?.key).toBe('Content-Type')
      expect.soft(result.headers[0]?.value).toBe('application/json')
    })

    it('should handle URL at end without http prefix', () => {
      const result = parseCurlString('curl example.com')
      expect(result.url).toBe('example.com')
    })

    it('should return empty result for empty input', () => {
      const result = parseCurlString('')
      expect.soft(result.method).toBe('GET')
      expect.soft(result.url).toBe('')
      expect.soft(result.headers.length).toBe(0)
      expect.soft(result.body).toBe('')
    })
  })

  describe('useCurlBuilder composable', () => {
    let builder: ReturnType<typeof useCurlBuilder>

    beforeEach(() => {
      builder = useCurlBuilder()
    })

    it('should initialize with default values', () => {
      expect.soft(builder.method.value).toBe('GET')
      expect.soft(builder.url.value).toBe('')
      expect.soft(builder.headers.value.length).toBe(1)
      expect.soft(builder.queryParams.value.length).toBe(1)
      expect.soft(builder.body.value).toBe('')
      expect.soft(builder.bodyType.value).toBe('none')
    })

    it('should have default options', () => {
      expect.soft(builder.options.followRedirects).toBe(true)
      expect.soft(builder.options.insecure).toBe(false)
    })

    it('should add header', () => {
      expect(builder.headers.value.length).toBe(1)
      builder.addHeader()
      expect(builder.headers.value.length).toBe(2)
    })

    it('should remove header', () => {
      builder.addHeader()
      builder.addHeader()
      expect(builder.headers.value.length).toBe(3)

      builder.removeHeader(1)
      expect(builder.headers.value.length).toBe(2)
    })

    it('should keep at least one header after removal', () => {
      expect(builder.headers.value.length).toBe(1)
      builder.removeHeader(0)
      expect(builder.headers.value.length).toBe(1)
    })

    it('should add query param', () => {
      expect(builder.queryParams.value.length).toBe(1)
      builder.addQueryParam()
      expect(builder.queryParams.value.length).toBe(2)
    })

    it('should remove query param', () => {
      builder.addQueryParam()
      builder.addQueryParam()
      expect(builder.queryParams.value.length).toBe(3)

      builder.removeQueryParam(1)
      expect(builder.queryParams.value.length).toBe(2)
    })

    it('should keep at least one query param after removal', () => {
      expect(builder.queryParams.value.length).toBe(1)
      builder.removeQueryParam(0)
      expect(builder.queryParams.value.length).toBe(1)
    })

    it('should compute curl command', async () => {
      builder.method.value = 'POST'
      builder.url.value = 'https://api.example.com'
      builder.body.value = '{"test": true}'
      builder.bodyType.value = 'json'
      await Promise.resolve()

      expect.soft(builder.curlCommand.value).toContain('curl')
      expect.soft(builder.curlCommand.value).toContain('-X POST')
      expect.soft(builder.curlCommand.value).toContain('https://api.example.com')
    })

    it('should compute enabled headers count', async () => {
      builder.headers.value = [
        { key: 'Header1', value: 'value1', enabled: true },
        { key: 'Header2', value: 'value2', enabled: false },
        { key: 'Header3', value: 'value3', enabled: true },
      ]
      await Promise.resolve()

      expect(builder.enabledHeadersCount.value).toBe(2)
    })

    it('should compute enabled params count', async () => {
      builder.queryParams.value = [
        { key: 'param1', value: 'value1', enabled: true },
        { key: 'param2', value: 'value2', enabled: true },
        { key: '', value: 'nokey', enabled: true },
      ]
      await Promise.resolve()

      expect(builder.enabledParamsCount.value).toBe(2)
    })

    it('should parse curl command', () => {
      builder.parsedInput.value =
        "curl -X POST -H 'Content-Type: application/json' https://api.example.com"

      const result = builder.parseCurlCommand()

      expect.soft(result.method).toBe('POST')
      expect.soft(result.url).toBe('https://api.example.com')
      expect.soft(builder.method.value).toBe('POST')
      expect.soft(builder.url.value).toBe('https://api.example.com')
    })

    it('should detect JSON body type when parsing', () => {
      builder.parsedInput.value = 'curl -d \'{"key":"value"}\' https://example.com'

      builder.parseCurlCommand()

      expect.soft(builder.body.value).toBe('{"key":"value"}')
      expect.soft(builder.bodyType.value).toBe('json')
    })

    it('should detect raw body type when parsing non-JSON', () => {
      builder.parsedInput.value = "curl -d 'plain text' https://example.com"

      builder.parseCurlCommand()

      expect.soft(builder.body.value).toBe('plain text')
      expect.soft(builder.bodyType.value).toBe('raw')
    })

    it('should load sample request', () => {
      builder.loadSample()

      expect.soft(builder.method.value).toBe(SAMPLE_REQUEST.method)
      expect.soft(builder.url.value).toBe(SAMPLE_REQUEST.url)
      expect.soft(builder.headers.value.length).toBe(SAMPLE_REQUEST.headers.length)
      expect.soft(builder.body.value).toBe(SAMPLE_REQUEST.body)
      expect.soft(builder.bodyType.value).toBe(SAMPLE_REQUEST.bodyType)
    })

    it('should reset all values', async () => {
      builder.method.value = 'POST'
      builder.url.value = 'https://example.com'
      builder.body.value = 'test'
      builder.bodyType.value = 'json'
      builder.options.insecure = true
      builder.options.verbose = true

      builder.resetAll()

      expect.soft(builder.method.value).toBe('GET')
      expect.soft(builder.url.value).toBe('')
      expect.soft(builder.body.value).toBe('')
      expect.soft(builder.bodyType.value).toBe('none')
      expect.soft(builder.options.insecure).toBe(false)
      expect.soft(builder.options.verbose).toBe(false)
    })

    it('should return empty result for empty parsed input', () => {
      builder.parsedInput.value = ''

      const result = builder.parseCurlCommand()

      expect.soft(result.method).toBe('GET')
      expect.soft(result.url).toBe('')
      expect.soft(result.headers.length).toBe(0)
      expect.soft(result.body).toBe('')
    })
  })
})
