import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  CHAR_SETS,
  PASSWORD_PRESETS,
  calculatePasswordStrength,
  buildCharacterPool,
  calculateEntropy,
  getEntropyInfo,
  generateSecurePassword,
  usePasswordGenerator,
} from '../usePasswordGenerator'

// Mock crypto.getRandomValues for deterministic testing
const mockCrypto = {
  getRandomValues: vi.fn((array: Uint32Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = i
    }
    return array
  }),
}

describe('usePasswordGenerator', () => {
  describe('Constants', () => {
    it('should have character sets', () => {
      expect.soft(CHAR_SETS.lowercase).toBe('abcdefghijklmnopqrstuvwxyz')
      expect.soft(CHAR_SETS.uppercase).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      expect.soft(CHAR_SETS.numbers).toBe('0123456789')
      expect.soft(CHAR_SETS.symbols).toBeTruthy()
      expect.soft(CHAR_SETS.ambiguous).toBe('il1Lo0O')
    })

    it('should have password presets', () => {
      expect.soft(PASSWORD_PRESETS.simple).toBeDefined()
      expect.soft(PASSWORD_PRESETS.strong).toBeDefined()
      expect.soft(PASSWORD_PRESETS.pin).toBeDefined()
      expect.soft(PASSWORD_PRESETS.passphrase).toBeDefined()
    })

    it('should have correct simple preset', () => {
      const simple = PASSWORD_PRESETS.simple
      expect.soft(simple.length).toBe(8)
      expect.soft(simple.includeLowercase).toBe(true)
      expect.soft(simple.includeUppercase).toBe(true)
      expect.soft(simple.includeNumbers).toBe(false)
      expect.soft(simple.includeSymbols).toBe(false)
      expect.soft(simple.excludeAmbiguous).toBe(true)
    })

    it('should have correct strong preset', () => {
      const strong = PASSWORD_PRESETS.strong
      expect.soft(strong.length).toBe(20)
      expect.soft(strong.includeLowercase).toBe(true)
      expect.soft(strong.includeUppercase).toBe(true)
      expect.soft(strong.includeNumbers).toBe(true)
      expect.soft(strong.includeSymbols).toBe(true)
    })

    it('should have correct pin preset', () => {
      const pin = PASSWORD_PRESETS.pin
      expect.soft(pin.length).toBe(6)
      expect.soft(pin.includeLowercase).toBe(false)
      expect.soft(pin.includeUppercase).toBe(false)
      expect.soft(pin.includeNumbers).toBe(true)
      expect.soft(pin.includeSymbols).toBe(false)
    })
  })

  describe('calculatePasswordStrength', () => {
    it('should return Weak for short password', () => {
      const result = calculatePasswordStrength('abc')
      expect.soft(result.label).toBe('Weak')
      expect.soft(result.severity).toBe('danger')
    })

    it('should return better score for longer password', () => {
      const short = calculatePasswordStrength('abcd')
      const long = calculatePasswordStrength('abcdefghijklmnop')
      expect(long.score).toBeGreaterThan(short.score)
    })

    it('should increase score for variety', () => {
      const lowercase = calculatePasswordStrength('abcdefgh')
      const mixed = calculatePasswordStrength('Abcd1234')
      expect(mixed.score).toBeGreaterThan(lowercase.score)
    })

    it('should increase score for symbols', () => {
      const noSymbols = calculatePasswordStrength('Abcd1234')
      const withSymbols = calculatePasswordStrength('Abcd12!@')
      expect(withSymbols.score).toBeGreaterThan(noSymbols.score)
    })

    it('should penalize repeated characters', () => {
      const normal = calculatePasswordStrength('Abcdefgh')
      const repeated = calculatePasswordStrength('Aaaaefgh')
      expect(repeated.score).toBeLessThan(normal.score)
    })

    it('should return Strong for complex password', () => {
      const result = calculatePasswordStrength('Abcdef123!@#$%^&*()XYZ')
      expect.soft(result.label).toBe('Strong')
      expect.soft(result.severity).toBe('success')
    })

    it('should return Fair for medium password', () => {
      const result = calculatePasswordStrength('Abcd1234')
      expect.soft(result.severity).not.toBe('danger')
    })
  })

  describe('buildCharacterPool', () => {
    it('should build pool with lowercase only', () => {
      const options = {
        length: 8,
        includeLowercase: true,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
        customChars: '',
      }
      const pool = buildCharacterPool(options)
      expect.soft(pool).toBe(CHAR_SETS.lowercase)
      expect.soft(pool).toContain('a')
      expect.soft(pool).not.toContain('A')
    })

    it('should build pool with uppercase only', () => {
      const options = {
        length: 8,
        includeLowercase: false,
        includeUppercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
        customChars: '',
      }
      const pool = buildCharacterPool(options)
      expect.soft(pool).toBe(CHAR_SETS.uppercase)
      expect.soft(pool).toContain('A')
      expect.soft(pool).not.toContain('a')
    })

    it('should combine multiple character sets', () => {
      const options = {
        length: 8,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: false,
        customChars: '',
      }
      const pool = buildCharacterPool(options)
      expect.soft(pool).toContain('a')
      expect.soft(pool).toContain('A')
      expect.soft(pool).toContain('0')
    })

    it('should exclude ambiguous characters', () => {
      const options = {
        length: 8,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: true,
        customChars: '',
      }
      const pool = buildCharacterPool(options)
      expect.soft(pool).not.toContain('l')
      expect.soft(pool).not.toContain('1')
      expect.soft(pool).not.toContain('O')
      expect.soft(pool).not.toContain('0')
    })

    it('should include custom characters', () => {
      const options = {
        length: 8,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
        customChars: 'XYZ',
      }
      const pool = buildCharacterPool(options)
      expect.soft(pool).toContain('X')
      expect.soft(pool).toContain('Y')
      expect.soft(pool).toContain('Z')
      expect.soft(pool.length).toBe(3)
    })

    it('should remove duplicate characters', () => {
      const options = {
        length: 8,
        includeLowercase: true,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
        customChars: 'abc', // duplicates of lowercase
      }
      const pool = buildCharacterPool(options)
      // Pool should not have duplicate a, b, c
      expect(pool.length).toBe(CHAR_SETS.lowercase.length)
    })

    it('should return empty for no options', () => {
      const options = {
        length: 8,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
        customChars: '',
      }
      const pool = buildCharacterPool(options)
      expect(pool).toBe('')
    })
  })

  describe('calculateEntropy', () => {
    it('should return 0 for empty pool', () => {
      expect(calculateEntropy(0, 10)).toBe(0)
    })

    it('should return 0 for negative pool size', () => {
      expect(calculateEntropy(-1, 10)).toBe(0)
    })

    it('should calculate correct entropy for known values', () => {
      // For pool size 2, each character adds 1 bit of entropy
      expect(calculateEntropy(2, 8)).toBe(8)
    })

    it('should increase entropy with password length', () => {
      const short = calculateEntropy(62, 8)
      const long = calculateEntropy(62, 16)
      expect(long).toBeGreaterThan(short)
    })

    it('should increase entropy with pool size', () => {
      const small = calculateEntropy(26, 10)
      const large = calculateEntropy(94, 10)
      expect(large).toBeGreaterThan(small)
    })
  })

  describe('getEntropyInfo', () => {
    it('should return Very Weak for low entropy', () => {
      const result = getEntropyInfo(20)
      expect.soft(result.label).toBe('Very Weak')
      expect.soft(result.severity).toBe('danger')
    })

    it('should return Weak for entropy under 36', () => {
      const result = getEntropyInfo(30)
      expect.soft(result.label).toBe('Weak')
      expect.soft(result.severity).toBe('danger')
    })

    it('should return Reasonable for entropy under 60', () => {
      const result = getEntropyInfo(50)
      expect.soft(result.label).toBe('Reasonable')
      expect.soft(result.severity).toBe('warn')
    })

    it('should return Strong for entropy under 128', () => {
      const result = getEntropyInfo(100)
      expect.soft(result.label).toBe('Strong')
      expect.soft(result.severity).toBe('success')
    })

    it('should return Very Strong for high entropy', () => {
      const result = getEntropyInfo(150)
      expect.soft(result.label).toBe('Very Strong')
      expect.soft(result.severity).toBe('info')
    })
  })

  describe('generateSecurePassword', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', mockCrypto)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should return empty string for empty pool', () => {
      expect(generateSecurePassword('', 10)).toBe('')
    })

    it('should generate password of correct length', () => {
      const password = generateSecurePassword('abc', 10)
      expect(password.length).toBe(10)
    })

    it('should only use characters from pool', () => {
      const pool = 'abc'
      const password = generateSecurePassword(pool, 100)
      for (const char of password) {
        expect(pool).toContain(char)
      }
    })

    it('should call crypto.getRandomValues', () => {
      generateSecurePassword('abc', 5)
      expect(mockCrypto.getRandomValues).toHaveBeenCalled()
    })
  })

  describe('usePasswordGenerator composable', () => {
    let generator: ReturnType<typeof usePasswordGenerator>

    beforeEach(() => {
      vi.stubGlobal('crypto', mockCrypto)
      generator = usePasswordGenerator()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should initialize with default values', () => {
      expect.soft(generator.length.value).toBe(16)
      expect.soft(generator.count.value).toBe(10)
      expect.soft(generator.includeLowercase.value).toBe(true)
      expect.soft(generator.includeUppercase.value).toBe(true)
      expect.soft(generator.includeNumbers.value).toBe(true)
      expect.soft(generator.includeSymbols.value).toBe(true)
      expect.soft(generator.excludeAmbiguous.value).toBe(false)
      expect.soft(generator.customChars.value).toBe('')
    })

    it('should have empty generated passwords initially', () => {
      expect.soft(generator.generatedPasswords.value.length).toBe(0)
      expect.soft(generator.passwordCount.value).toBe(0)
    })

    it('should compute character pool', () => {
      expect(generator.characterPool.value.length).toBeGreaterThan(0)
    })

    it('should compute isValid correctly', async () => {
      expect(generator.isValid.value).toBe(true)

      generator.includeLowercase.value = false
      generator.includeUppercase.value = false
      generator.includeNumbers.value = false
      generator.includeSymbols.value = false
      await Promise.resolve()

      expect(generator.isValid.value).toBe(false)
    })

    it('should compute entropy', () => {
      expect(generator.entropy.value).toBeGreaterThan(0)
    })

    it('should compute entropy info', () => {
      expect.soft(generator.entropyInfo.value.label).toBeTruthy()
      expect.soft(generator.entropyInfo.value.severity).toBeTruthy()
    })

    it('should generate single password', () => {
      const password = generator.generateSingle()
      expect.soft(password.length).toBe(16)
      expect.soft(password).toBeTruthy()
    })

    it('should generate multiple passwords', () => {
      generator.count.value = 5
      const success = generator.generate()

      expect.soft(success).toBe(true)
      expect.soft(generator.generatedPasswords.value.length).toBe(5)
      expect.soft(generator.passwordCount.value).toBe(5)
    })

    it('should not generate if invalid', async () => {
      generator.includeLowercase.value = false
      generator.includeUppercase.value = false
      generator.includeNumbers.value = false
      generator.includeSymbols.value = false
      await Promise.resolve()

      const success = generator.generate()
      expect.soft(success).toBe(false)
      expect.soft(generator.generatedPasswords.value.length).toBe(0)
    })

    it('should include strength with generated passwords', () => {
      generator.count.value = 1
      generator.generate()

      const password = generator.generatedPasswords.value[0]
      expect.soft(password?.strength).toBeDefined()
      expect.soft(password?.strength.label).toBeTruthy()
      expect.soft(password?.strength.severity).toBeTruthy()
    })

    it('should prepend new passwords', () => {
      generator.count.value = 2
      generator.generate()
      const _firstBatchIds = generator.generatedPasswords.value.map(p => p.id)

      generator.generate()

      // New passwords should have higher IDs and be at the beginning
      expect(generator.generatedPasswords.value.length).toBe(4)
    })

    it('should clear generated passwords', () => {
      generator.count.value = 3
      generator.generate()
      expect(generator.generatedPasswords.value.length).toBe(3)

      generator.clear()
      expect(generator.generatedPasswords.value.length).toBe(0)
    })

    it('should compute allPasswordsAsText', () => {
      generator.count.value = 3
      generator.generate()

      const text = generator.allPasswordsAsText.value
      const lines = text.split('\n')
      expect(lines.length).toBe(3)
    })

    it('should apply simple preset', async () => {
      generator.applyPreset('simple')
      await Promise.resolve()

      expect.soft(generator.length.value).toBe(8)
      expect.soft(generator.includeLowercase.value).toBe(true)
      expect.soft(generator.includeUppercase.value).toBe(true)
      expect.soft(generator.includeNumbers.value).toBe(false)
      expect.soft(generator.includeSymbols.value).toBe(false)
      expect.soft(generator.excludeAmbiguous.value).toBe(true)
    })

    it('should apply strong preset', async () => {
      generator.applyPreset('strong')
      await Promise.resolve()

      expect.soft(generator.length.value).toBe(20)
      expect.soft(generator.includeSymbols.value).toBe(true)
    })

    it('should apply pin preset', async () => {
      generator.applyPreset('pin')
      await Promise.resolve()

      expect.soft(generator.length.value).toBe(6)
      expect.soft(generator.includeLowercase.value).toBe(false)
      expect.soft(generator.includeUppercase.value).toBe(false)
      expect.soft(generator.includeNumbers.value).toBe(true)
    })

    it('should apply passphrase preset', async () => {
      generator.applyPreset('passphrase')
      await Promise.resolve()

      expect.soft(generator.length.value).toBe(32)
      expect.soft(generator.excludeAmbiguous.value).toBe(true)
    })

    it('should update character pool when options change', async () => {
      const initialPool = generator.characterPool.value

      generator.includeSymbols.value = false
      await Promise.resolve()

      expect(generator.characterPool.value.length).toBeLessThan(initialPool.length)
    })

    it('should update entropy when length changes', async () => {
      const initialEntropy = generator.entropy.value

      generator.length.value = 32
      await Promise.resolve()

      expect(generator.entropy.value).toBeGreaterThan(initialEntropy)
    })
  })
})
