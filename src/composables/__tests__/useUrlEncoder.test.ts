import { describe, it, expect, beforeEach } from 'vitest'
import {
  encodeUrl,
  decodeUrl,
  getInputStats,
  getOutputStats,
  parseUrl,
  validateUrl,
  extractQueryParams,
  buildUrl,
  parseUrlForBuilder,
  useUrlEncoder,
  SAMPLE_TEXT,
  SAMPLE_URL,
} from '../useUrlEncoder'

describe('useUrlEncoder', () => {
  describe('encodeUrl', () => {
    it('should encode with encodeURIComponent', () => {
      expect(encodeUrl('Hello World', 'encodeURIComponent')).toBe('Hello%20World')
    })

    it('should encode with encodeURI', () => {
      expect(encodeUrl('Hello World', 'encodeURI')).toBe('Hello%20World')
    })

    it('should encode special characters with encodeURIComponent', () => {
      expect(encodeUrl('a=b&c=d', 'encodeURIComponent')).toBe('a%3Db%26c%3Dd')
    })

    it('should preserve special characters with encodeURI', () => {
      expect(encodeUrl('a=b&c=d', 'encodeURI')).toBe('a=b&c=d')
    })

    it('should encode Unicode characters', () => {
      const encoded = encodeUrl('こんにちは', 'encodeURIComponent')
      expect(encoded).toContain('%')
    })
  })

  describe('decodeUrl', () => {
    it('should decode with decodeURIComponent', () => {
      expect(decodeUrl('Hello%20World', 'encodeURIComponent')).toBe('Hello World')
    })

    it('should decode with decodeURI', () => {
      expect(decodeUrl('Hello%20World', 'encodeURI')).toBe('Hello World')
    })

    it('should decode special characters with decodeURIComponent', () => {
      expect(decodeUrl('a%3Db%26c%3Dd', 'encodeURIComponent')).toBe('a=b&c=d')
    })

    it('should be reversible with encode', () => {
      const original = 'Hello World! こんにちは 你好 🌍'
      const encoded = encodeUrl(original, 'encodeURIComponent')
      const decoded = decodeUrl(encoded, 'encodeURIComponent')
      expect(decoded).toBe(original)
    })
  })

  describe('getInputStats', () => {
    it('should return null for empty string', () => {
      expect(getInputStats('')).toBeNull()
    })

    it('should return correct stats for ASCII text', () => {
      const stats = getInputStats('Hello')
      expect.soft(stats?.chars).toBe(5)
      expect.soft(stats?.bytes).toBe(5)
    })

    it('should return correct stats for Unicode text', () => {
      const stats = getInputStats('こんにちは')
      expect.soft(stats?.chars).toBe(5)
      expect.soft(stats?.bytes).toBe(15)
    })
  })

  describe('getOutputStats', () => {
    it('should return null for empty output', () => {
      expect(getOutputStats('input', '')).toBeNull()
    })

    it('should calculate correct ratio', () => {
      const stats = getOutputStats('Hello World', 'Hello%20World')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.chars).toBe(13)
      expect.soft(parseInt(stats!.ratio)).toBeGreaterThan(100)
    })
  })

  describe('parseUrl', () => {
    it('should return null for empty string', () => {
      expect.soft(parseUrl('')).toBeNull()
      expect.soft(parseUrl('  ')).toBeNull()
    })

    it('should parse valid URL correctly', () => {
      const result = parseUrl('https://example.com:8080/path?query=value#hash')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.protocol).toBe('https:')
      expect.soft(result!.hostname).toBe('example.com')
      expect.soft(result!.port).toBe('8080')
      expect.soft(result!.pathname).toBe('/path')
      expect.soft(result!.search).toBe('?query=value')
      expect.soft(result!.hash).toBe('#hash')
    })

    it('should parse URL with auth credentials', () => {
      const result = parseUrl('https://user:pass@example.com/path')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.username).toBe('user')
      expect.soft(result!.password).toBe('pass')
    })

    it('should return null for invalid URL', () => {
      expect(parseUrl('not a url')).toBeNull()
    })
  })

  describe('validateUrl', () => {
    it('should return empty string for valid URL', () => {
      expect.soft(validateUrl('https://example.com')).toBe('')
      expect.soft(validateUrl('http://localhost:3000/path')).toBe('')
    })

    it('should return empty string for empty input', () => {
      expect.soft(validateUrl('')).toBe('')
      expect.soft(validateUrl('  ')).toBe('')
    })

    it('should return error message for invalid URL', () => {
      expect(validateUrl('not a url')).toBe('Invalid URL format')
    })
  })

  describe('extractQueryParams', () => {
    it('should return empty array for empty string', () => {
      expect(extractQueryParams('')).toEqual([])
    })

    it('should extract query parameters correctly', () => {
      const params = extractQueryParams('https://example.com?name=John&age=30')
      expect.soft(params).toHaveLength(2)
      expect.soft(params[0]).toEqual({
        key: 'name',
        value: 'John',
        encodedKey: 'name',
        encodedValue: 'John',
      })
      expect.soft(params[1]).toEqual({
        key: 'age',
        value: '30',
        encodedKey: 'age',
        encodedValue: '30',
      })
    })

    it('should handle encoded values', () => {
      const params = extractQueryParams('https://example.com?name=John%20Doe')
      expect.soft(params).toHaveLength(1)
      expect.soft(params[0]!.value).toBe('John Doe')
      expect.soft(params[0]!.encodedValue).toBe('John%20Doe')
    })

    it('should return empty array for invalid URL', () => {
      expect(extractQueryParams('not a url')).toEqual([])
    })
  })

  describe('buildUrl', () => {
    it('should build URL with parameters', () => {
      const params = [
        { id: 1, key: 'name', value: 'John' },
        { id: 2, key: 'age', value: '30' },
      ]
      expect(buildUrl('https://example.com/path', params)).toBe(
        'https://example.com/path?name=John&age=30',
      )
    })

    it('should skip empty keys', () => {
      const params = [
        { id: 1, key: '', value: 'value' },
        { id: 2, key: 'name', value: 'John' },
      ]
      expect(buildUrl('https://example.com', params)).toBe('https://example.com/?name=John')
    })

    it('should return empty string for invalid base URL', () => {
      expect(buildUrl('not a url', [])).toBe('')
    })
  })

  describe('parseUrlForBuilder', () => {
    it('should return null for invalid URL', () => {
      expect(parseUrlForBuilder('not a url', 1)).toBeNull()
    })

    it('should parse URL and extract params', () => {
      const result = parseUrlForBuilder('https://example.com/path?name=John&age=30', 1)
      expect.soft(result).not.toBeNull()
      expect.soft(result!.baseUrl).toBe('https://example.com/path')
      expect.soft(result!.params).toHaveLength(2)
      expect.soft(result!.params[0]).toEqual({ id: 1, key: 'name', value: 'John' })
      expect.soft(result!.params[1]).toEqual({ id: 2, key: 'age', value: '30' })
      expect.soft(result!.nextId).toBe(3)
    })

    it('should add empty param if no query params exist', () => {
      const result = parseUrlForBuilder('https://example.com/path', 1)
      expect.soft(result).not.toBeNull()
      expect.soft(result!.params).toHaveLength(1)
      expect.soft(result!.params[0]).toEqual({ id: 1, key: '', value: '' })
    })
  })

  describe('useUrlEncoder composable', () => {
    let encoder: ReturnType<typeof useUrlEncoder>

    beforeEach(() => {
      encoder = useUrlEncoder()
    })

    it('should initialize with empty values', () => {
      expect.soft(encoder.inputText.value).toBe('')
      expect.soft(encoder.outputText.value).toBe('')
      expect.soft(encoder.encodeError.value).toBe('')
      expect.soft(encoder.encodingMode.value).toBe('encodeURIComponent')
    })

    it('should auto-encode when input changes', async () => {
      encoder.inputText.value = 'Hello World'
      await Promise.resolve()
      expect(encoder.outputText.value).toBe('Hello%20World')
    })

    it('should decode output', async () => {
      encoder.inputText.value = 'Hello World'
      await Promise.resolve()

      // Set encoded value to output for decoding
      encoder.outputText.value = 'Hello%20World'
      const success = encoder.decodeOutput()
      expect(success).toBe(true)
    })

    it('should load sample text', () => {
      encoder.loadSample()
      expect(encoder.inputText.value).toBe(SAMPLE_TEXT)
    })

    it('should clear all values', async () => {
      encoder.inputText.value = 'Hello World'
      await Promise.resolve()

      encoder.clearAll()
      expect.soft(encoder.inputText.value).toBe('')
      expect.soft(encoder.outputText.value).toBe('')
    })

    it('should load sample URL', () => {
      encoder.loadSampleUrl()
      expect(encoder.urlInput.value).toBe(SAMPLE_URL)
    })

    it('should parse URL and compute values', async () => {
      encoder.urlInput.value = 'https://example.com/path?name=John'
      await Promise.resolve()

      expect.soft(encoder.urlParseError.value).toBe('')
      expect.soft(encoder.parsedUrl.value).not.toBeNull()
      expect.soft(encoder.queryParams.value).toHaveLength(1)
    })

    it('should manage query builder params', () => {
      expect(encoder.builderParams.value).toHaveLength(1)

      encoder.addParam()
      expect(encoder.builderParams.value).toHaveLength(2)

      const id = encoder.builderParams.value[1]!.id
      encoder.removeParam(id)
      expect(encoder.builderParams.value).toHaveLength(1)
    })

    it('should not allow removing all params', () => {
      const id = encoder.builderParams.value[0]!.id
      encoder.removeParam(id)
      expect(encoder.builderParams.value).toHaveLength(1)
    })

    it('should load URL to builder', () => {
      encoder.urlInput.value = 'https://example.com/path?name=John&age=30'
      const success = encoder.loadUrlToBuilder()

      expect.soft(success).toBe(true)
      expect.soft(encoder.builderBaseUrl.value).toBe('https://example.com/path')
      expect.soft(encoder.builderParams.value).toHaveLength(2)
    })

    it('should clear builder', () => {
      encoder.builderBaseUrl.value = 'https://custom.com'
      encoder.addParam()

      encoder.clearBuilder()
      expect.soft(encoder.builderBaseUrl.value).toBe('https://example.com/path')
      expect.soft(encoder.builderParams.value).toHaveLength(1)
    })

    it('should compute built URL', async () => {
      encoder.builderBaseUrl.value = 'https://example.com'
      encoder.builderParams.value = [{ id: 1, key: 'name', value: 'John' }]
      await Promise.resolve()

      expect(encoder.builtUrl.value).toBe('https://example.com/?name=John')
    })
  })
})
