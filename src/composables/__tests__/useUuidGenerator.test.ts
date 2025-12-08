import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateUUIDv4,
  generateUUIDv7,
  generateUUIDv1,
  generateUuidByVersion,
  formatUuid,
  useUuidGenerator,
  NIL_UUID,
  MAX_UUID,
  UUID_VERSION_OPTIONS,
} from '../useUuidGenerator'

// UUID regex patterns
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const UUID_V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('useUuidGenerator', () => {
  describe('generateUUIDv4', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUIDv4()
      expect(uuid).toMatch(UUID_V4_REGEX)
    })

    it('should generate unique UUIDs', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUIDv4()))
      expect(uuids.size).toBe(100)
    })

    it('should have version 4 in the correct position', () => {
      const uuid = generateUUIDv4()
      expect(uuid.charAt(14)).toBe('4')
    })

    it('should have variant bits set correctly', () => {
      const uuid = generateUUIDv4()
      const variantChar = uuid.charAt(19)
      expect(['8', '9', 'a', 'b']).toContain(variantChar)
    })
  })

  describe('generateUUIDv7', () => {
    it('should generate a valid UUID v7 format', () => {
      const uuid = generateUUIDv7()
      expect(uuid).toMatch(UUID_V7_REGEX)
    })

    it('should generate unique UUIDs', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUIDv7()))
      expect(uuids.size).toBe(100)
    })

    it('should have version 7 in the correct position', () => {
      const uuid = generateUUIDv7()
      expect(uuid.charAt(14)).toBe('7')
    })

    it('should be time-ordered (later UUIDs should be greater)', () => {
      const uuid1 = generateUUIDv7()
      // Small delay to ensure different timestamp
      const uuid2 = generateUUIDv7()

      // Compare the timestamp portion (first 12 hex chars without dashes)
      const ts1 = uuid1.replace(/-/g, '').substring(0, 12)
      const ts2 = uuid2.replace(/-/g, '').substring(0, 12)

      expect(BigInt('0x' + ts2)).toBeGreaterThanOrEqual(BigInt('0x' + ts1))
    })
  })

  describe('generateUUIDv1', () => {
    it('should generate a valid UUID v1 format', () => {
      const uuid = generateUUIDv1()
      expect(uuid).toMatch(UUID_V1_REGEX)
    })

    it('should generate unique UUIDs', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUIDv1()))
      expect(uuids.size).toBe(100)
    })

    it('should have version 1 in the correct position', () => {
      const uuid = generateUUIDv1()
      expect(uuid.charAt(14)).toBe('1')
    })
  })

  describe('generateUuidByVersion', () => {
    it('should generate UUID v1', () => {
      const uuid = generateUuidByVersion('v1')
      expect(uuid).toMatch(UUID_V1_REGEX)
    })

    it('should generate UUID v4', () => {
      const uuid = generateUuidByVersion('v4')
      expect(uuid).toMatch(UUID_V4_REGEX)
    })

    it('should generate UUID v7', () => {
      const uuid = generateUuidByVersion('v7')
      expect(uuid).toMatch(UUID_V7_REGEX)
    })

    it('should return NIL UUID', () => {
      const uuid = generateUuidByVersion('nil')
      expect(uuid).toBe(NIL_UUID)
    })

    it('should return MAX UUID', () => {
      const uuid = generateUuidByVersion('max')
      expect(uuid).toBe(MAX_UUID)
    })
  })

  describe('NIL_UUID and MAX_UUID constants', () => {
    it('should have correct NIL UUID format', () => {
      expect.soft(NIL_UUID).toBe('00000000-0000-0000-0000-000000000000')
      expect.soft(NIL_UUID).toMatch(UUID_REGEX)
    })

    it('should have correct MAX UUID format', () => {
      expect.soft(MAX_UUID).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff')
      expect.soft(MAX_UUID).toMatch(UUID_REGEX)
    })
  })

  describe('formatUuid', () => {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000'

    it('should format with braces by default', () => {
      const result = formatUuid(testUuid, { uppercase: false, noBraces: false })
      expect(result).toBe(`{${testUuid}}`)
    })

    it('should format without braces when noBraces is true', () => {
      const result = formatUuid(testUuid, { uppercase: false, noBraces: true })
      expect(result).toBe(testUuid)
    })

    it('should format uppercase', () => {
      const result = formatUuid(testUuid, { uppercase: true, noBraces: true })
      expect(result).toBe(testUuid.toUpperCase())
    })

    it('should format uppercase with braces', () => {
      const result = formatUuid(testUuid, { uppercase: true, noBraces: false })
      expect(result).toBe(`{${testUuid.toUpperCase()}}`)
    })
  })

  describe('UUID_VERSION_OPTIONS', () => {
    it('should have all version options', () => {
      const values = UUID_VERSION_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('v1')
      expect.soft(values).toContain('v4')
      expect.soft(values).toContain('v7')
      expect.soft(values).toContain('nil')
      expect.soft(values).toContain('max')
    })

    it('should have labels for all options', () => {
      for (const option of UUID_VERSION_OPTIONS) {
        expect.soft(option.label).toBeTruthy()
        expect.soft(option.description).toBeTruthy()
        expect.soft(option.icon).toBeTruthy()
      }
    })
  })

  describe('useUuidGenerator composable', () => {
    let generator: ReturnType<typeof useUuidGenerator>

    beforeEach(() => {
      generator = useUuidGenerator()
    })

    it('should initialize with default values', () => {
      expect.soft(generator.version.value).toBe('v7')
      expect.soft(generator.count.value).toBe(10)
      expect.soft(generator.uppercase.value).toBe(false)
      expect.soft(generator.noBraces.value).toBe(true)
      expect.soft(generator.generatedUuids.value).toEqual([])
    })

    it('should generate UUIDs', () => {
      generator.generate()
      expect(generator.generatedUuids.value.length).toBe(10)
    })

    it('should generate specified count of UUIDs', () => {
      generator.count.value = 5
      generator.generate()
      expect(generator.generatedUuids.value.length).toBe(5)
    })

    it('should prepend new UUIDs to the list', () => {
      generator.count.value = 2
      generator.generate()
      const firstBatch = [...generator.generatedUuids.value]

      generator.generate()
      expect.soft(generator.generatedUuids.value.length).toBe(4)
      // New UUIDs should be at the beginning
      expect.soft(generator.generatedUuids.value.slice(2)).toEqual(firstBatch)
    })

    it('should generate single UUID', () => {
      const uuid = generator.generateSingle()
      expect(uuid).toMatch(UUID_V7_REGEX)
    })

    it('should clear generated UUIDs', () => {
      generator.generate()
      expect(generator.generatedUuids.value.length).toBeGreaterThan(0)

      generator.clear()
      expect(generator.generatedUuids.value).toEqual([])
    })

    it('should compute uuids as text', () => {
      generator.count.value = 3
      generator.generate()

      const text = generator.uuidsAsText.value
      const lines = text.split('\n')
      expect(lines.length).toBe(3)
    })

    it('should compute uuids count', () => {
      generator.count.value = 5
      generator.generate()
      expect(generator.uuidsCount.value).toBe(5)
    })

    it('should get all UUIDs as string', () => {
      generator.count.value = 3
      generator.generate()

      const text = generator.getAllUuidsAsString()
      expect(text).toBe(generator.uuidsAsText.value)
    })

    it('should respect uppercase option', () => {
      generator.uppercase.value = true
      const uuid = generator.generateSingle()
      expect(uuid).toBe(uuid.toUpperCase())
    })

    it('should respect noBraces option', () => {
      generator.noBraces.value = false
      const uuid = generator.generateSingle()
      expect.soft(uuid.startsWith('{')).toBe(true)
      expect.soft(uuid.endsWith('}')).toBe(true)
    })

    it('should generate different versions', () => {
      generator.version.value = 'v4'
      const uuidV4 = generator.generateSingle()
      expect.soft(uuidV4.charAt(14)).toBe('4')

      generator.version.value = 'v1'
      const uuidV1 = generator.generateSingle()
      expect.soft(uuidV1.charAt(14)).toBe('1')

      generator.version.value = 'nil'
      const nilUuid = generator.generateSingle()
      expect.soft(nilUuid).toBe(NIL_UUID)

      generator.version.value = 'max'
      const maxUuid = generator.generateSingle()
      expect.soft(maxUuid).toBe(MAX_UUID)
    })

    it('should expose version options', () => {
      expect(generator.versionOptions).toBe(UUID_VERSION_OPTIONS)
    })
  })
})
