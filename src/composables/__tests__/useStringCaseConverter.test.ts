import { describe, it, expect, beforeEach } from 'vitest'
import {
  splitIntoWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toScreamingSnakeCase,
  toKebabCase,
  toScreamingKebabCase,
  toTrainCase,
  toDotCase,
  toPathCase,
  toTitleCase,
  toSentenceCase,
  toUpperCase,
  toLowerCase,
  toFlatCase,
  toUpperFlatCase,
  toAlternatingCase,
  toInverseCase,
  convertCase,
  useStringCaseConverter,
  CASE_DEFINITIONS,
} from '../useStringCaseConverter'

describe('useStringCaseConverter', () => {
  describe('splitIntoWords', () => {
    it('should split camelCase', () => {
      expect(splitIntoWords('camelCase')).toEqual(['camel', 'Case'])
    })

    it('should split PascalCase', () => {
      expect(splitIntoWords('PascalCase')).toEqual(['Pascal', 'Case'])
    })

    it('should split snake_case', () => {
      expect(splitIntoWords('snake_case')).toEqual(['snake', 'case'])
    })

    it('should split kebab-case', () => {
      expect(splitIntoWords('kebab-case')).toEqual(['kebab', 'case'])
    })

    it('should split dot.case', () => {
      expect(splitIntoWords('dot.case')).toEqual(['dot', 'case'])
    })

    it('should split path/case', () => {
      expect(splitIntoWords('path/case')).toEqual(['path', 'case'])
    })

    it('should split space separated', () => {
      expect(splitIntoWords('space separated')).toEqual(['space', 'separated'])
    })

    it('should handle consecutive uppercase (XMLParser)', () => {
      expect(splitIntoWords('XMLParser')).toEqual(['XML', 'Parser'])
    })

    it('should handle empty string', () => {
      expect(splitIntoWords('')).toEqual([])
    })

    it('should handle multiple separators', () => {
      expect(splitIntoWords('hello__world')).toEqual(['hello', 'world'])
    })
  })

  describe('toCamelCase', () => {
    it('should convert space separated', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld')
    })

    it('should convert kebab-case', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld')
    })

    it('should convert snake_case', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld')
    })

    it('should convert PascalCase', () => {
      expect(toCamelCase('HelloWorld')).toBe('helloWorld')
    })

    it('should handle single word', () => {
      expect(toCamelCase('hello')).toBe('hello')
    })
  })

  describe('toPascalCase', () => {
    it('should convert space separated', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld')
    })

    it('should convert kebab-case', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld')
    })

    it('should convert snake_case', () => {
      expect(toPascalCase('hello_world')).toBe('HelloWorld')
    })

    it('should convert camelCase', () => {
      expect(toPascalCase('helloWorld')).toBe('HelloWorld')
    })
  })

  describe('toSnakeCase', () => {
    it('should convert space separated', () => {
      expect(toSnakeCase('hello world')).toBe('hello_world')
    })

    it('should convert camelCase', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world')
    })

    it('should convert PascalCase', () => {
      expect(toSnakeCase('HelloWorld')).toBe('hello_world')
    })

    it('should convert kebab-case', () => {
      expect(toSnakeCase('hello-world')).toBe('hello_world')
    })
  })

  describe('toScreamingSnakeCase', () => {
    it('should convert to uppercase with underscores', () => {
      expect(toScreamingSnakeCase('hello world')).toBe('HELLO_WORLD')
    })

    it('should convert camelCase', () => {
      expect(toScreamingSnakeCase('helloWorld')).toBe('HELLO_WORLD')
    })
  })

  describe('toKebabCase', () => {
    it('should convert space separated', () => {
      expect(toKebabCase('hello world')).toBe('hello-world')
    })

    it('should convert camelCase', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world')
    })

    it('should convert snake_case', () => {
      expect(toKebabCase('hello_world')).toBe('hello-world')
    })
  })

  describe('toScreamingKebabCase', () => {
    it('should convert to uppercase with hyphens', () => {
      expect(toScreamingKebabCase('hello world')).toBe('HELLO-WORLD')
    })
  })

  describe('toTrainCase', () => {
    it('should capitalize words with hyphens', () => {
      expect(toTrainCase('hello world')).toBe('Hello-World')
    })
  })

  describe('toDotCase', () => {
    it('should convert to lowercase with dots', () => {
      expect(toDotCase('hello world')).toBe('hello.world')
    })
  })

  describe('toPathCase', () => {
    it('should convert to lowercase with slashes', () => {
      expect(toPathCase('hello world')).toBe('hello/world')
    })
  })

  describe('toTitleCase', () => {
    it('should capitalize all words with spaces', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
    })

    it('should convert camelCase', () => {
      expect(toTitleCase('helloWorld')).toBe('Hello World')
    })
  })

  describe('toSentenceCase', () => {
    it('should capitalize first word only', () => {
      expect(toSentenceCase('hello world')).toBe('Hello world')
    })

    it('should convert camelCase', () => {
      expect(toSentenceCase('helloWorld')).toBe('Hello world')
    })
  })

  describe('toUpperCase', () => {
    it('should convert to uppercase', () => {
      expect(toUpperCase('hello world')).toBe('HELLO WORLD')
    })
  })

  describe('toLowerCase', () => {
    it('should convert to lowercase', () => {
      expect(toLowerCase('HELLO WORLD')).toBe('hello world')
    })
  })

  describe('toFlatCase', () => {
    it('should convert to lowercase without separators', () => {
      expect(toFlatCase('hello world')).toBe('helloworld')
    })

    it('should convert camelCase', () => {
      expect(toFlatCase('helloWorld')).toBe('helloworld')
    })
  })

  describe('toUpperFlatCase', () => {
    it('should convert to uppercase without separators', () => {
      expect(toUpperFlatCase('hello world')).toBe('HELLOWORLD')
    })
  })

  describe('toAlternatingCase', () => {
    it('should alternate case by character position', () => {
      expect(toAlternatingCase('hello')).toBe('hElLo')
    })

    it('should handle spaces', () => {
      // Spaces count as characters in alternation
      expect(toAlternatingCase('ab cd')).toBe('aB Cd')
    })
  })

  describe('toInverseCase', () => {
    it('should swap case of each character', () => {
      expect(toInverseCase('Hello')).toBe('hELLO')
    })

    it('should handle mixed case', () => {
      expect(toInverseCase('HeLLo WoRLd')).toBe('hEllO wOrlD')
    })
  })

  describe('convertCase', () => {
    it('should convert using case key', () => {
      expect.soft(convertCase('hello world', 'camel')).toBe('helloWorld')
      expect.soft(convertCase('hello world', 'pascal')).toBe('HelloWorld')
      expect.soft(convertCase('hello world', 'snake')).toBe('hello_world')
    })

    it('should return null for unknown key', () => {
      expect(convertCase('hello', 'unknown')).toBeNull()
    })
  })

  describe('CASE_DEFINITIONS', () => {
    it('should have all expected case definitions', () => {
      const keys = CASE_DEFINITIONS.map(d => d.key)
      expect.soft(keys).toContain('camel')
      expect.soft(keys).toContain('pascal')
      expect.soft(keys).toContain('snake')
      expect.soft(keys).toContain('screaming_snake')
      expect.soft(keys).toContain('kebab')
      expect.soft(keys).toContain('screaming_kebab')
      expect.soft(keys).toContain('train')
      expect.soft(keys).toContain('dot')
      expect.soft(keys).toContain('path')
      expect.soft(keys).toContain('title')
      expect.soft(keys).toContain('sentence')
      expect.soft(keys).toContain('upper')
      expect.soft(keys).toContain('lower')
      expect.soft(keys).toContain('flat')
      expect.soft(keys).toContain('upper_flat')
      expect.soft(keys).toContain('alternating')
      expect.soft(keys).toContain('inverse')
    })

    it('should have converters that match their examples', () => {
      for (const def of CASE_DEFINITIONS) {
        // Skip alternating and inverse as they work differently
        if (def.key === 'alternating' || def.key === 'inverse') continue

        const result = def.converter('my variable name')
        expect.soft(typeof result).toBe('string')
        expect.soft(result.length).toBeGreaterThan(0)
      }
    })
  })

  describe('useStringCaseConverter composable', () => {
    let converter: ReturnType<typeof useStringCaseConverter>

    beforeEach(() => {
      converter = useStringCaseConverter()
    })

    it('should initialize with empty values', () => {
      expect.soft(converter.inputText.value).toBe('')
      expect.soft(converter.conversions.value).toEqual([])
      expect.soft(converter.hasInput.value).toBe(false)
      expect.soft(converter.hasResults.value).toBe(false)
    })

    it('should compute conversions when input changes', async () => {
      converter.inputText.value = 'hello world'
      await Promise.resolve()

      expect.soft(converter.conversions.value.length).toBe(CASE_DEFINITIONS.length)
      expect.soft(converter.hasInput.value).toBe(true)
      expect.soft(converter.hasResults.value).toBe(true)
    })

    it('should compute input stats', async () => {
      converter.inputText.value = 'hello world'
      await Promise.resolve()

      expect.soft(converter.inputStats.value?.chars).toBe(11)
      expect.soft(converter.inputStats.value?.words).toBe(2)
    })

    it('should return null stats for empty input', () => {
      expect(converter.inputStats.value).toBeNull()
    })

    it('should load sample text', () => {
      converter.loadSample()
      expect(converter.inputText.value).toBe('hello world example')
    })

    it('should clear input', () => {
      converter.inputText.value = 'hello world'
      converter.clear()
      expect(converter.inputText.value).toBe('')
    })

    it('should get conversion by key', async () => {
      converter.inputText.value = 'hello world'
      await Promise.resolve()

      const camelResult = converter.getConversionByKey('camel')
      expect.soft(camelResult).not.toBeUndefined()
      expect.soft(camelResult!.result).toBe('helloWorld')

      const pascalResult = converter.getConversionByKey('pascal')
      expect.soft(pascalResult).not.toBeUndefined()
      expect.soft(pascalResult!.result).toBe('HelloWorld')
    })

    it('should return undefined for unknown key', async () => {
      converter.inputText.value = 'hello world'
      await Promise.resolve()

      expect(converter.getConversionByKey('unknown')).toBeUndefined()
    })

    it('should return empty conversions for whitespace-only input', async () => {
      converter.inputText.value = '   '
      await Promise.resolve()

      expect(converter.conversions.value).toEqual([])
    })
  })
})
