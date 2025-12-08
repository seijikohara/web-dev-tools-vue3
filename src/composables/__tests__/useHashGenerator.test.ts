import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeHash,
  computeAllHashes,
  compareHashes,
  getTextStats,
  formatFileSize,
  useHashGenerator,
  HASH_METHODS,
  HASH_INFO,
} from '../useHashGenerator'

describe('useHashGenerator', () => {
  describe('computeHash', () => {
    it('should compute MD5 hash correctly', () => {
      const hash = computeHash('md5', 'Hello World')
      expect(hash).toBe('b10a8db164e0754105b7a99be72e3fe5')
    })

    it('should compute SHA1 hash correctly', () => {
      const hash = computeHash('sha1', 'Hello World')
      expect(hash).toBe('0a4d55a8d778e5022fab701977c5d840bbc486d0')
    })

    it('should compute SHA224 hash correctly', () => {
      const hash = computeHash('sha224', 'Hello World')
      expect(hash).toBe('c4890faffdb0105d991a461e668e276685401b02eab1ef4372795047')
    })

    it('should compute SHA256 hash correctly', () => {
      const hash = computeHash('sha256', 'Hello World')
      expect(hash).toBe('a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e')
    })

    it('should compute SHA384 hash correctly', () => {
      const hash = computeHash('sha384', 'Hello World')
      expect(hash).toBe(
        '99514329186b2f6ae4a1329e7ee6c610a729636335174ac6b740f9028396fcc803d0e93863a7c3d90f86beee782f4f3f',
      )
    })

    it('should compute SHA512 hash correctly', () => {
      const hash = computeHash('sha512', 'Hello World')
      expect(hash).toBe(
        '2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b',
      )
    })

    it('should handle empty string', () => {
      const hash = computeHash('md5', '')
      expect(hash).toBe('d41d8cd98f00b204e9800998ecf8427e')
    })

    it('should handle Unicode text', () => {
      const hash = computeHash('md5', 'こんにちは')
      expect.soft(typeof hash).toBe('string')
      expect.soft(hash.length).toBe(32) // MD5 is always 32 hex chars
    })

    it('should handle emoji', () => {
      const hash = computeHash('sha256', '🌍')
      expect.soft(typeof hash).toBe('string')
      expect.soft(hash.length).toBe(64) // SHA256 is always 64 hex chars
    })
  })

  describe('computeAllHashes', () => {
    it('should compute all hash types', () => {
      const results = computeAllHashes('Hello World')
      expect(results.length).toBe(HASH_METHODS.length)
    })

    it('should include correct method names', () => {
      const results = computeAllHashes('Hello World')
      const methods = results.map(r => r.method)

      expect.soft(methods).toContain('MD5')
      expect.soft(methods).toContain('SHA1')
      expect.soft(methods).toContain('SHA224')
      expect.soft(methods).toContain('SHA256')
      expect.soft(methods).toContain('SHA384')
      expect.soft(methods).toContain('SHA512')
    })

    it('should include correct bit sizes', () => {
      const results = computeAllHashes('Hello World')

      const md5Result = results.find(r => r.method === 'MD5')
      expect.soft(md5Result!.bits).toBe(128)

      const sha256Result = results.find(r => r.method === 'SHA256')
      expect.soft(sha256Result!.bits).toBe(256)

      const sha512Result = results.find(r => r.method === 'SHA512')
      expect.soft(sha512Result!.bits).toBe(512)
    })

    it('should include severity/color info', () => {
      const results = computeAllHashes('Hello World')

      for (const result of results) {
        expect(result.severity).toBeTruthy()
      }
    })
  })

  describe('compareHashes', () => {
    it('should return true for matching hashes', () => {
      expect(compareHashes('abc123', 'abc123')).toBe(true)
    })

    it('should ignore case', () => {
      expect.soft(compareHashes('ABC123', 'abc123')).toBe(true)
      expect.soft(compareHashes('abc123', 'ABC123')).toBe(true)
    })

    it('should ignore whitespace', () => {
      expect.soft(compareHashes('  abc123  ', 'abc123')).toBe(true)
      expect.soft(compareHashes('abc123', '  abc123  ')).toBe(true)
    })

    it('should return false for different hashes', () => {
      expect(compareHashes('abc123', 'def456')).toBe(false)
    })

    it('should return false for empty inputs', () => {
      expect.soft(compareHashes('', 'abc123')).toBe(false)
      expect.soft(compareHashes('abc123', '')).toBe(false)
      expect.soft(compareHashes('', '')).toBe(false)
    })
  })

  describe('getTextStats', () => {
    it('should return correct stats for ASCII text', () => {
      const stats = getTextStats('Hello')
      expect.soft(stats.chars).toBe(5)
      expect.soft(stats.bytes).toBe(5)
    })

    it('should return correct stats for Unicode text', () => {
      const stats = getTextStats('こんにちは')
      expect.soft(stats.chars).toBe(5)
      expect.soft(stats.bytes).toBe(15) // Each Japanese char is 3 bytes in UTF-8
    })

    it('should return correct stats for empty string', () => {
      const stats = getTextStats('')
      expect.soft(stats.chars).toBe(0)
      expect.soft(stats.bytes).toBe(0)
    })
  })

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format KB', () => {
      expect.soft(formatFileSize(1024)).toBe('1 KB')
      expect.soft(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
    })

    it('should format GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('HASH_METHODS and HASH_INFO', () => {
    it('should have all hash methods defined', () => {
      expect.soft(HASH_METHODS).toContain('md5')
      expect.soft(HASH_METHODS).toContain('sha1')
      expect.soft(HASH_METHODS).toContain('sha224')
      expect.soft(HASH_METHODS).toContain('sha256')
      expect.soft(HASH_METHODS).toContain('sha384')
      expect.soft(HASH_METHODS).toContain('sha512')
    })

    it('should have hash info for all methods', () => {
      for (const method of HASH_METHODS) {
        expect.soft(HASH_INFO[method]).toBeDefined()
        expect.soft(HASH_INFO[method].bits).toBeGreaterThan(0)
        expect.soft(HASH_INFO[method].color).toBeTruthy()
      }
    })
  })

  describe('useHashGenerator composable', () => {
    let generator: ReturnType<typeof useHashGenerator>

    beforeEach(() => {
      generator = useHashGenerator()
    })

    it('should initialize with empty values', () => {
      expect.soft(generator.text.value).toBe('')
      expect.soft(generator.fileName.value).toBe('')
      expect.soft(generator.fileSize.value).toBe(0)
      expect.soft(generator.fileHashedValues.value).toEqual([])
      expect.soft(generator.compareHash.value).toBe('')
      expect.soft(generator.compareInput.value).toBe('')
    })

    it('should compute hashed values when text changes', async () => {
      generator.text.value = 'Hello World'
      await Promise.resolve()

      expect(generator.hashedValues.value.length).toBe(HASH_METHODS.length)
    })

    it('should compute text stats', async () => {
      generator.text.value = 'Hello'
      await Promise.resolve()

      expect.soft(generator.textStats.value?.chars).toBe(5)
      expect.soft(generator.textStats.value?.bytes).toBe(5)
    })

    it('should track hasFile state', () => {
      expect.soft(generator.hasFile.value).toBe(false)

      generator.fileName.value = 'test.txt'
      expect.soft(generator.hasFile.value).toBe(true)
    })

    it('should clear file info', () => {
      generator.fileName.value = 'test.txt'
      generator.fileSize.value = 1024
      generator.fileHashedValues.value = [
        { method: 'MD5', value: 'abc', bits: 128, severity: 'secondary' },
      ]

      generator.clearFile()

      expect.soft(generator.fileName.value).toBe('')
      expect.soft(generator.fileSize.value).toBe(0)
      expect.soft(generator.fileHashedValues.value).toEqual([])
    })

    it('should compare hashes correctly', async () => {
      generator.compareHash.value = 'abc123'
      generator.compareInput.value = 'ABC123'
      await Promise.resolve()

      expect(generator.compareResult.value).toBe(true)
    })

    it('should return null for incomplete comparison', async () => {
      generator.compareHash.value = 'abc123'
      generator.compareInput.value = ''
      await Promise.resolve()

      expect(generator.compareResult.value).toBeNull()
    })

    it('should return false for non-matching comparison', async () => {
      generator.compareHash.value = 'abc123'
      generator.compareInput.value = 'def456'
      await Promise.resolve()

      expect(generator.compareResult.value).toBe(false)
    })
  })
})
