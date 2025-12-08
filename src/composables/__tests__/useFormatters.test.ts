import { describe, it, expect, beforeEach } from 'vitest'
import { useFormatters } from '../useFormatters'

describe('useFormatters', () => {
  let formatters: ReturnType<typeof useFormatters>

  beforeEach(() => {
    formatters = useFormatters()
  })

  describe('formatJson', () => {
    it('should format valid JSON with default indent (2 spaces)', () => {
      const input = '{"name":"John","age":30,"city":"New York"}'
      const expected = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`

      const result = formatters.formatJson(input)
      expect(result).toBe(expected)
    })

    it('should format valid JSON with custom indent (4 spaces)', () => {
      const input = '{"name":"John","age":30}'
      const expected = `{
    "name": "John",
    "age": 30
}`

      const result = formatters.formatJson(input, 4)
      expect(result).toBe(expected)
    })

    it('should format valid JSON with tab indent', () => {
      const input = '{"name":"John","age":30}'

      const result = formatters.formatJson(input, '\t')
      expect(result).toContain('\t')
    })

    it('should format nested JSON objects', () => {
      const input = '{"user":{"name":"John","address":{"city":"New York","zip":"10001"}}}'

      const result = formatters.formatJson(input)
      expect(result).toContain('"user"')
      expect(result).toContain('"address"')
      expect(result).toContain('"city"')
    })

    it('should format JSON arrays', () => {
      const input = '{"items":[1,2,3,4,5]}'

      const result = formatters.formatJson(input)
      expect(result).toContain('"items"')
      expect(result).toContain('[')
      expect(result).toContain(']')
    })

    it('should throw error for invalid JSON', () => {
      const input = '{invalid json}'

      expect(() => formatters.formatJson(input)).toThrow()
    })

    it('should set error message for invalid JSON', () => {
      const input = '{invalid json}'

      try {
        formatters.formatJson(input)
      } catch {
        // Error message format varies between Node.js versions
        expect(formatters.error.value).toBeTruthy()
        expect(formatters.error.value).toContain('JSON')
      }
    })

    it('should clear error on successful format', () => {
      const invalidInput = '{invalid}'
      const validInput = '{"valid":"json"}'

      try {
        formatters.formatJson(invalidInput)
      } catch {
        // Error expected
      }

      expect(formatters.error.value).not.toBeNull()

      formatters.formatJson(validInput)
      expect(formatters.error.value).toBeNull()
    })

    it('should handle empty object', () => {
      const input = '{}'

      const result = formatters.formatJson(input)
      expect(result).toBe('{}')
    })

    it('should handle empty array', () => {
      const input = '[]'

      const result = formatters.formatJson(input)
      expect(result).toBe('[]')
    })

    it('should preserve special characters', () => {
      const input = '{"text":"Hello\\nWorld\\t!"}'

      const result = formatters.formatJson(input)
      expect(result).toContain('Hello\\nWorld\\t!')
    })
  })

  describe('minifyJson', () => {
    it('should minify formatted JSON', () => {
      const input = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`
      const expected = '{"name":"John","age":30,"city":"New York"}'

      const result = formatters.minifyJson(input)
      expect(result).toBe(expected)
    })

    it('should handle already minified JSON', () => {
      const input = '{"name":"John","age":30}'

      const result = formatters.minifyJson(input)
      expect(result).toBe(input)
    })

    it('should minify nested objects', () => {
      const input = `{
  "user": {
    "name": "John",
    "address": {
      "city": "New York"
    }
  }
}`

      const result = formatters.minifyJson(input)
      expect(result).toBe('{"user":{"name":"John","address":{"city":"New York"}}}')
    })

    it('should minify arrays', () => {
      const input = `{
  "items": [
    1,
    2,
    3
  ]
}`

      const result = formatters.minifyJson(input)
      expect(result).toBe('{"items":[1,2,3]}')
    })

    it('should throw error for invalid JSON', () => {
      const input = '{invalid json}'

      expect(() => formatters.minifyJson(input)).toThrow()
    })

    it('should set error message for invalid JSON', () => {
      const input = '{invalid json}'

      try {
        formatters.minifyJson(input)
      } catch {
        // Error message format varies between Node.js versions
        expect(formatters.error.value).toBeTruthy()
        expect(formatters.error.value).toContain('JSON')
      }
    })

    it('should handle empty object', () => {
      const input = '{}'

      const result = formatters.minifyJson(input)
      expect(result).toBe('{}')
    })

    it('should handle empty array', () => {
      const input = '[]'

      const result = formatters.minifyJson(input)
      expect(result).toBe('[]')
    })
  })

  describe('encodeUrl', () => {
    it('should encode simple text', () => {
      const input = 'Hello World'
      const expected = 'Hello%20World'

      const result = formatters.encodeUrl(input)
      expect(result).toBe(expected)
    })

    it('should encode special characters', () => {
      const input = 'name=John&age=30'

      const result = formatters.encodeUrl(input)
      expect(result).toContain('%3D')
      expect(result).toContain('%26')
    })

    it('should encode URL with query parameters', () => {
      const input = 'https://example.com?name=John Doe&city=New York'

      const result = formatters.encodeUrl(input)
      expect(result).toContain('%3A')
      expect(result).toContain('%2F')
      expect(result).toContain('%3F')
      expect(result).toContain('%3D')
      expect(result).toContain('%26')
      expect(result).toContain('%20')
    })

    it('should encode Unicode characters', () => {
      const input = 'こんにちは'

      const result = formatters.encodeUrl(input)
      expect(result).toContain('%')
      expect(result).not.toBe(input)
    })

    it('should encode emoji', () => {
      const input = '🌍'

      const result = formatters.encodeUrl(input)
      expect(result).toContain('%')
    })

    it('should handle empty string', () => {
      const input = ''

      const result = formatters.encodeUrl(input)
      expect(result).toBe('')
    })

    it('should clear error on successful encoding', () => {
      formatters.error.value = 'Previous error'

      formatters.encodeUrl('test')
      expect(formatters.error.value).toBeNull()
    })
  })

  describe('decodeUrl', () => {
    it('should decode simple URL encoded text', () => {
      const input = 'Hello%20World'
      const expected = 'Hello World'

      const result = formatters.decodeUrl(input)
      expect(result).toBe(expected)
    })

    it('should decode special characters', () => {
      const input = 'name%3DJohn%26age%3D30'
      const expected = 'name=John&age=30'

      const result = formatters.decodeUrl(input)
      expect(result).toBe(expected)
    })

    it('should decode URL with query parameters', () => {
      const input = 'https%3A%2F%2Fexample.com%3Fname%3DJohn%20Doe'

      const result = formatters.decodeUrl(input)
      expect(result).toContain('https://')
      expect(result).toContain('?name=John Doe')
    })

    it('should decode Unicode characters', () => {
      const input = '%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF'
      const expected = 'こんにちは'

      const result = formatters.decodeUrl(input)
      expect(result).toBe(expected)
    })

    it('should handle already decoded text', () => {
      const input = 'Hello World'

      const result = formatters.decodeUrl(input)
      expect(result).toBe(input)
    })

    it('should handle empty string', () => {
      const input = ''

      const result = formatters.decodeUrl(input)
      expect(result).toBe('')
    })

    it('should throw error for malformed URL encoding', () => {
      const input = '%E0%A4%A' // Incomplete encoding

      expect(() => formatters.decodeUrl(input)).toThrow()
    })

    it('should set error message for malformed URL encoding', () => {
      const input = '%E0%A4%A'

      try {
        formatters.decodeUrl(input)
      } catch {
        expect(formatters.error.value).toContain('URI malformed')
      }
    })

    it('should be reversible with encodeUrl', () => {
      const original = 'Hello World! こんにちは name=value&test=123'

      const encoded = formatters.encodeUrl(original)
      const decoded = formatters.decodeUrl(encoded)

      expect(decoded).toBe(original)
    })
  })

  describe('error handling', () => {
    it('should initialize with null error', () => {
      expect(formatters.error.value).toBeNull()
    })

    it('should clear error on subsequent successful operation', () => {
      try {
        formatters.formatJson('{invalid}')
      } catch {
        // Error expected
      }

      expect(formatters.error.value).not.toBeNull()

      formatters.formatJson('{"valid":"json"}')
      expect(formatters.error.value).toBeNull()
    })

    it('should update error for each failed operation', () => {
      try {
        formatters.formatJson('{invalid}')
      } catch {
        // Error expected
      }

      const firstError = formatters.error.value

      try {
        formatters.decodeUrl('%E0%A4%A')
      } catch {
        // Error expected
      }

      const secondError = formatters.error.value

      expect(secondError).not.toBe(firstError)
    })
  })
})
