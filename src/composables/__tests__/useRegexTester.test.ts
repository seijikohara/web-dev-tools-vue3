import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildFlagsString,
  validateRegex,
  findMatches,
  escapeHtml,
  highlightMatches,
  replaceMatches,
  formatFullPattern,
  useRegexTester,
  COMMON_PATTERNS,
  SAMPLE_DATA,
} from '../useRegexTester'

describe('useRegexTester', () => {
  describe('Constants', () => {
    it('should have common patterns', () => {
      expect(COMMON_PATTERNS.length).toBeGreaterThan(0)
    })

    it('should have valid common patterns', () => {
      for (const pattern of COMMON_PATTERNS) {
        expect.soft(pattern.name).toBeTruthy()
        expect.soft(pattern.pattern).toBeTruthy()
        expect.soft(pattern.icon).toBeTruthy()
        // Verify pattern is valid regex
        expect.soft(() => new RegExp(pattern.pattern)).not.toThrow()
      }
    })

    it('should have sample data', () => {
      expect.soft(SAMPLE_DATA.pattern).toBeTruthy()
      expect.soft(SAMPLE_DATA.testString).toBeTruthy()
    })
  })

  describe('buildFlagsString', () => {
    it('should return empty string for no flags', () => {
      expect(
        buildFlagsString({
          global: false,
          caseInsensitive: false,
          multiline: false,
          dotAll: false,
          unicode: false,
        }),
      ).toBe('')
    })

    it('should build single flag', () => {
      expect
        .soft(
          buildFlagsString({
            global: true,
            caseInsensitive: false,
            multiline: false,
            dotAll: false,
            unicode: false,
          }),
        )
        .toBe('g')
      expect
        .soft(
          buildFlagsString({
            global: false,
            caseInsensitive: true,
            multiline: false,
            dotAll: false,
            unicode: false,
          }),
        )
        .toBe('i')
    })

    it('should build multiple flags', () => {
      const result = buildFlagsString({
        global: true,
        caseInsensitive: true,
        multiline: true,
        dotAll: true,
        unicode: true,
      })
      expect.soft(result).toContain('g')
      expect.soft(result).toContain('i')
      expect.soft(result).toContain('m')
      expect.soft(result).toContain('s')
      expect.soft(result).toContain('u')
    })
  })

  describe('validateRegex', () => {
    it('should return empty string for valid regex', () => {
      expect.soft(validateRegex('[a-z]+', 'g')).toBe('')
      expect.soft(validateRegex('\\d{3}', 'gi')).toBe('')
      expect.soft(validateRegex('.*', '')).toBe('')
    })

    it('should return empty string for empty pattern', () => {
      expect(validateRegex('', 'g')).toBe('')
    })

    it('should return error message for invalid regex', () => {
      expect.soft(validateRegex('[', 'g')).toBeTruthy()
      expect.soft(validateRegex('(', 'g')).toBeTruthy()
      expect.soft(validateRegex('(?<', 'g')).toBeTruthy()
    })
  })

  describe('findMatches', () => {
    it('should return empty array for empty pattern', () => {
      expect(findMatches('', 'test', 'g')).toEqual([])
    })

    it('should return empty array for empty test string', () => {
      expect(findMatches('[a-z]+', '', 'g')).toEqual([])
    })

    it('should find single match without global flag', () => {
      const matches = findMatches('\\d+', 'abc123def456', '')
      expect.soft(matches.length).toBe(1)
      expect.soft(matches[0]?.match).toBe('123')
    })

    it('should find multiple matches with global flag', () => {
      const matches = findMatches('\\d+', 'abc123def456', 'g')
      expect.soft(matches.length).toBe(2)
      expect.soft(matches[0]?.match).toBe('123')
      expect.soft(matches[1]?.match).toBe('456')
    })

    it('should include start and end positions', () => {
      const matches = findMatches('test', 'this is a test', 'g')
      expect.soft(matches[0]?.start).toBe(10)
      expect.soft(matches[0]?.end).toBe(14)
    })

    it('should capture groups', () => {
      const matches = findMatches('(\\d+)-(\\d+)', '123-456', 'g')
      expect.soft(matches[0]?.groups.length).toBe(2)
      expect.soft(matches[0]?.groups[0]).toBe('123')
      expect.soft(matches[0]?.groups[1]).toBe('456')
    })

    it('should handle case insensitive flag', () => {
      expect.soft(findMatches('test', 'TEST', '').length).toBe(0)
      expect.soft(findMatches('test', 'TEST', 'i').length).toBe(1)
    })

    it('should return empty array for invalid regex', () => {
      expect(findMatches('[', 'test', 'g')).toEqual([])
    })
  })

  describe('escapeHtml', () => {
    it('should escape &', () => {
      expect(escapeHtml('a&b')).toBe('a&amp;b')
    })

    it('should escape <', () => {
      expect(escapeHtml('<tag>')).toBe('&lt;tag&gt;')
    })

    it('should escape quotes', () => {
      expect.soft(escapeHtml('"')).toBe('&quot;')
      expect.soft(escapeHtml("'")).toBe('&#039;')
    })

    it('should escape multiple characters', () => {
      expect(escapeHtml('<script>"test"</script>')).toBe(
        '&lt;script&gt;&quot;test&quot;&lt;/script&gt;',
      )
    })
  })

  describe('highlightMatches', () => {
    it('should return escaped text for empty pattern', () => {
      expect(highlightMatches('', '<test>', 'g')).toBe('&lt;test&gt;')
    })

    it('should wrap matches in mark tags', () => {
      const result = highlightMatches('test', 'this is a test', 'g')
      expect.soft(result).toContain('<mark')
      expect.soft(result).toContain('test')
      expect.soft(result).toContain('</mark>')
    })

    it('should escape HTML in matched parts', () => {
      // The function only escapes HTML within the matched parts
      const result = highlightMatches('<html>', 'test <html> tag', 'g')
      expect.soft(result).toContain('&lt;html&gt;')
      expect.soft(result).toContain('<mark')
    })
  })

  describe('replaceMatches', () => {
    it('should return empty string for empty pattern', () => {
      expect(replaceMatches('', 'test', 'replaced', 'g')).toBe('')
    })

    it('should return empty string for empty test string', () => {
      expect(replaceMatches('test', '', 'replaced', 'g')).toBe('')
    })

    it('should replace single match without global flag', () => {
      expect(replaceMatches('\\d+', 'abc123def456', 'X', '')).toBe('abcXdef456')
    })

    it('should replace all matches with global flag', () => {
      expect(replaceMatches('\\d+', 'abc123def456', 'X', 'g')).toBe('abcXdefX')
    })

    it('should handle backreferences', () => {
      expect(replaceMatches('(\\d+)', 'test123', '[$1]', 'g')).toBe('test[123]')
    })

    it('should return empty string for invalid regex', () => {
      expect(replaceMatches('[', 'test', 'X', 'g')).toBe('')
    })
  })

  describe('formatFullPattern', () => {
    it('should format pattern with slashes', () => {
      expect(formatFullPattern('[a-z]+', 'gi')).toBe('/[a-z]+/gi')
    })

    it('should handle empty flags', () => {
      expect(formatFullPattern('test', '')).toBe('/test/')
    })
  })

  describe('useRegexTester composable', () => {
    let tester: ReturnType<typeof useRegexTester>

    beforeEach(() => {
      tester = useRegexTester()
    })

    it('should initialize with empty values', () => {
      expect.soft(tester.pattern.value).toBe('')
      expect.soft(tester.testString.value).toBe('')
      expect.soft(tester.replacement.value).toBe('')
    })

    it('should initialize with default flags', () => {
      expect.soft(tester.flagGlobal.value).toBe(true)
      expect.soft(tester.flagCaseInsensitive.value).toBe(false)
      expect.soft(tester.flagMultiline.value).toBe(false)
      expect.soft(tester.flagDotAll.value).toBe(false)
      expect.soft(tester.flagUnicode.value).toBe(false)
    })

    it('should compute flags string', async () => {
      tester.flagGlobal.value = true
      tester.flagCaseInsensitive.value = true
      await Promise.resolve()

      expect(tester.flags.value).toBe('gi')
    })

    it('should find matches when pattern and test string are set', async () => {
      tester.pattern.value = '\\d+'
      tester.testString.value = 'abc123def456'
      await Promise.resolve()

      expect.soft(tester.matches.value.length).toBe(2)
      expect.soft(tester.regexError.value).toBe('')
    })

    it('should compute highlighted text', async () => {
      tester.pattern.value = 'test'
      tester.testString.value = 'this is a test'
      await Promise.resolve()

      expect(tester.highlightedText.value).toContain('mark')
    })

    it('should compute replaced text', async () => {
      tester.pattern.value = '\\d+'
      tester.testString.value = 'abc123'
      tester.replacement.value = 'X'
      await Promise.resolve()

      expect(tester.replacedText.value).toBe('abcX')
    })

    it('should show regex error for invalid pattern', async () => {
      tester.pattern.value = '['
      tester.testString.value = 'test'
      await Promise.resolve()

      expect.soft(tester.regexError.value).toBeTruthy()
      expect.soft(tester.matches.value).toEqual([])
    })

    it('should compute full pattern', async () => {
      tester.pattern.value = '[a-z]+'
      tester.flagGlobal.value = true
      tester.flagCaseInsensitive.value = true
      await Promise.resolve()

      expect(tester.fullPattern.value).toBe('/[a-z]+/gi')
    })

    it('should load sample data', () => {
      tester.loadSampleData()

      expect.soft(tester.pattern.value).toBe(SAMPLE_DATA.pattern)
      expect.soft(tester.testString.value).toBe(SAMPLE_DATA.testString)
    })

    it('should clear all values', async () => {
      tester.pattern.value = 'test'
      tester.testString.value = 'test'
      tester.replacement.value = 'replaced'

      tester.clearAll()

      expect.soft(tester.pattern.value).toBe('')
      expect.soft(tester.testString.value).toBe('')
      expect.soft(tester.replacement.value).toBe('')
    })

    it('should use pattern via action', () => {
      tester.usePattern('\\d+')
      expect(tester.pattern.value).toBe('\\d+')
    })
  })
})
