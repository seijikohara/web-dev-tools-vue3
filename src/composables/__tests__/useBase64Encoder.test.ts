import { describe, it, expect, beforeEach } from 'vitest'
import {
  encodeToBase64,
  decodeFromBase64,
  getInputStats,
  getOutputStats,
  getBase64InputStats,
  formatFileSize,
  createDataUrl,
  isImageMimeType,
  useBase64Encoder,
  SAMPLE_TEXT,
} from '../useBase64Encoder'

describe('useBase64Encoder', () => {
  describe('encodeToBase64', () => {
    it('should encode ASCII text correctly', () => {
      expect(encodeToBase64('Hello World!')).toBe('SGVsbG8gV29ybGQh')
    })

    it('should encode empty string', () => {
      expect(encodeToBase64('')).toBe('')
    })

    it('should encode Unicode text (Japanese)', () => {
      expect(encodeToBase64('こんにちは')).toBe('44GT44KT44Gr44Gh44Gv')
    })

    it('should encode Unicode text (Chinese)', () => {
      expect(encodeToBase64('你好')).toBe('5L2g5aW9')
    })

    it('should encode emoji', () => {
      expect(encodeToBase64('🌍')).toBe('8J+MjQ==')
    })

    it('should encode mixed content', () => {
      const encoded = encodeToBase64(SAMPLE_TEXT)
      expect.soft(typeof encoded).toBe('string')
      expect.soft(encoded.length).toBeGreaterThan(0)
    })
  })

  describe('decodeFromBase64', () => {
    it('should decode ASCII text correctly', () => {
      expect(decodeFromBase64('SGVsbG8gV29ybGQh')).toBe('Hello World!')
    })

    it('should decode empty string', () => {
      expect(decodeFromBase64('')).toBe('')
    })

    it('should decode Unicode text (Japanese)', () => {
      expect(decodeFromBase64('44GT44KT44Gr44Gh44Gv')).toBe('こんにちは')
    })

    it('should decode Unicode text (Chinese)', () => {
      expect(decodeFromBase64('5L2g5aW9')).toBe('你好')
    })

    it('should decode emoji', () => {
      expect(decodeFromBase64('8J+MjQ==')).toBe('🌍')
    })

    it('should throw error for invalid base64', () => {
      expect(() => decodeFromBase64('invalid!!!')).toThrow()
    })

    it('should be reversible with encode', () => {
      const original = 'Hello World! こんにちは 你好 🌍'
      const encoded = encodeToBase64(original)
      const decoded = decodeFromBase64(encoded)
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

    it('should return correct stats for emoji', () => {
      const stats = getInputStats('🌍')
      expect.soft(stats?.chars).toBe(2)
      expect.soft(stats?.bytes).toBe(4)
    })
  })

  describe('getOutputStats', () => {
    it('should return null for empty output', () => {
      expect.soft(getOutputStats('input', '')).toBeNull()
      expect.soft(getOutputStats('data', '')).toBeNull()
    })

    it('should return stats with zero ratio for empty input', () => {
      const stats = getOutputStats('', 'image/png')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.ratio).toBe('0')
    })

    it('should calculate correct ratio', () => {
      const stats = getOutputStats('Hello', 'SGVsbG8=')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.chars).toBe(8)
      expect.soft(parseInt(stats!.ratio)).toBeGreaterThan(100)
    })

    it('should handle zero input bytes', () => {
      const stats = getOutputStats('', 'output')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.ratio).toBe('0')
    })
  })

  describe('getBase64InputStats', () => {
    it('should return null for empty string', () => {
      expect(getBase64InputStats('')).toBeNull()
    })

    it('should validate correct base64', () => {
      const stats = getBase64InputStats('SGVsbG8gV29ybGQh')
      expect.soft(stats?.chars).toBe(16)
      expect.soft(stats?.valid).toBe(true)
    })

    it('should validate base64 with padding', () => {
      const stats = getBase64InputStats('SGVsbG8=')
      expect.soft(stats?.chars).toBe(8)
      expect.soft(stats?.valid).toBe(true)
    })

    it('should invalidate incorrect base64', () => {
      const stats = getBase64InputStats('invalid!!!')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.valid).toBe(false)
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
      expect.soft(formatFileSize(1048576)).toBe('1 MB')
      expect.soft(formatFileSize(2621440)).toBe('2.5 MB')
    })

    it('should format GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('createDataUrl', () => {
    it('should return empty string for empty inputs', () => {
      expect.soft(createDataUrl('', '')).toBe('')
      expect.soft(createDataUrl('data', '')).toBe('')
      expect.soft(createDataUrl('', 'image/png')).toBe('')
    })

    it('should create correct data URL', () => {
      expect(createDataUrl('SGVsbG8=', 'text/plain')).toBe('data:text/plain;base64,SGVsbG8=')
    })

    it('should handle image MIME types', () => {
      expect(createDataUrl('iVBORw0KGgo=', 'image/png')).toBe('data:image/png;base64,iVBORw0KGgo=')
    })
  })

  describe('isImageMimeType', () => {
    it('should return true for image MIME types', () => {
      expect.soft(isImageMimeType('image/png')).toBe(true)
      expect.soft(isImageMimeType('image/jpeg')).toBe(true)
      expect.soft(isImageMimeType('image/gif')).toBe(true)
      expect.soft(isImageMimeType('image/svg+xml')).toBe(true)
    })

    it('should return false for non-image MIME types', () => {
      expect.soft(isImageMimeType('text/plain')).toBe(false)
      expect.soft(isImageMimeType('application/json')).toBe(false)
      expect.soft(isImageMimeType('video/mp4')).toBe(false)
    })
  })

  describe('useBase64Encoder composable', () => {
    let encoder: ReturnType<typeof useBase64Encoder>

    beforeEach(() => {
      encoder = useBase64Encoder()
    })

    it('should initialize with empty values', () => {
      expect.soft(encoder.inputText.value).toBe('')
      expect.soft(encoder.outputText.value).toBe('')
      expect.soft(encoder.encodeError.value).toBe('')
      expect.soft(encoder.encodingMode.value).toBe('encode')
    })

    it('should auto-encode when input changes', async () => {
      encoder.inputText.value = 'Hello'
      await Promise.resolve()
      expect(encoder.outputText.value).toBe('SGVsbG8=')
    })

    it('should auto-decode when mode is decode', async () => {
      encoder.encodingMode.value = 'decode'
      encoder.inputText.value = 'SGVsbG8='
      await Promise.resolve()
      expect(encoder.outputText.value).toBe('Hello')
    })

    it('should set error for invalid base64 in decode mode', async () => {
      encoder.encodingMode.value = 'decode'
      encoder.inputText.value = 'invalid!!!'
      await Promise.resolve()
      expect.soft(encoder.encodeError.value).toBe('Invalid Base64 string')
      expect.soft(encoder.outputText.value).toBe('')
    })

    it('should swap values correctly', async () => {
      encoder.inputText.value = 'Hello'
      await Promise.resolve()
      const encoded = encoder.outputText.value

      encoder.swapValues()
      expect.soft(encoder.inputText.value).toBe(encoded)
      expect.soft(encoder.encodingMode.value).toBe('decode')
    })

    it('should load sample text', () => {
      encoder.loadSample()
      expect.soft(encoder.inputText.value).toBe(SAMPLE_TEXT)
      expect.soft(encoder.encodingMode.value).toBe('encode')
    })

    it('should clear all values', async () => {
      encoder.inputText.value = 'Hello'
      await Promise.resolve()

      encoder.clearAll()
      expect.soft(encoder.inputText.value).toBe('')
      expect.soft(encoder.outputText.value).toBe('')
      expect.soft(encoder.encodeError.value).toBe('')
    })

    it('should compute input stats', async () => {
      encoder.inputText.value = 'Hello'
      await Promise.resolve()

      expect.soft(encoder.inputStats.value?.chars).toBe(5)
      expect.soft(encoder.inputStats.value?.bytes).toBe(5)
    })

    it('should compute output stats', async () => {
      encoder.inputText.value = 'Hello'
      await Promise.resolve()

      expect.soft(encoder.outputStats.value).not.toBeNull()
      expect.soft(encoder.outputStats.value!.chars).toBe(8)
    })
  })
})
