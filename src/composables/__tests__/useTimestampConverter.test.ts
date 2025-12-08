import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  formatCurrentTime,
  convertTimestampToDate,
  validateTimestampInput,
  convertDateToTimestamp,
  calculateDateTime,
  getCommonTimestamps,
  getCurrentTimestampString,
  getCurrentDateTimeString,
  UNIT_OPTIONS,
  TIMEZONE_OPTIONS,
  OPERATION_OPTIONS,
  CALC_UNIT_OPTIONS,
} from '../useTimestampConverter'

describe('useTimestampConverter', () => {
  describe('Constants', () => {
    it('should have unit options', () => {
      expect.soft(UNIT_OPTIONS.length).toBe(2)
      const values = UNIT_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('seconds')
      expect.soft(values).toContain('milliseconds')
    })

    it('should have timezone options', () => {
      expect(TIMEZONE_OPTIONS.length).toBeGreaterThan(0)
    })

    it('should have operation options', () => {
      expect.soft(OPERATION_OPTIONS.length).toBe(2)
      const values = OPERATION_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('add')
      expect.soft(values).toContain('subtract')
    })

    it('should have calculation unit options', () => {
      expect.soft(CALC_UNIT_OPTIONS.length).toBe(7)
      const values = CALC_UNIT_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('seconds')
      expect.soft(values).toContain('minutes')
      expect.soft(values).toContain('hours')
      expect.soft(values).toContain('days')
      expect.soft(values).toContain('weeks')
      expect.soft(values).toContain('months')
      expect.soft(values).toContain('years')
    })
  })

  describe('formatCurrentTime', () => {
    it('should return array of time formats', () => {
      const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC
      const formats = formatCurrentTime(timestamp)

      expect.soft(formats.length).toBe(6)
      expect.soft(formats.some(f => f.label.includes('seconds'))).toBe(true)
      expect.soft(formats.some(f => f.label.includes('milliseconds'))).toBe(true)
      expect.soft(formats.some(f => f.label.includes('ISO'))).toBe(true)
    })

    it('should include correct timestamp values', () => {
      const timestamp = 1704067200000
      const formats = formatCurrentTime(timestamp)

      const secondsFormat = formats.find(f => f.label.includes('seconds'))
      expect.soft(secondsFormat?.value).toBe('1704067200')

      const msFormat = formats.find(f => f.label.includes('milliseconds'))
      expect.soft(msFormat?.value).toBe('1704067200000')
    })
  })

  describe('convertTimestampToDate', () => {
    it('should return null for empty input', () => {
      expect(convertTimestampToDate('', 'seconds', 'UTC')).toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(convertTimestampToDate('abc', 'seconds', 'UTC')).toBeNull()
    })

    it('should convert seconds timestamp', () => {
      const result = convertTimestampToDate('1704067200', 'seconds', 'UTC')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.iso).toContain('2024-01-01')
    })

    it('should convert milliseconds timestamp', () => {
      const result = convertTimestampToDate('1704067200000', 'milliseconds', 'UTC')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.iso).toContain('2024-01-01')
    })

    it('should include relative time', () => {
      const result = convertTimestampToDate('0', 'seconds', 'UTC')
      expect.soft(result?.relative).toBeTruthy()
    })

    it('should include timezone formatted date', () => {
      const result = convertTimestampToDate('1704067200', 'seconds', 'America/New_York')
      expect.soft(result?.timezone).toBeTruthy()
    })
  })

  describe('validateTimestampInput', () => {
    it('should return empty string for empty input', () => {
      expect(validateTimestampInput('', 'seconds')).toBe('')
    })

    it('should return empty string for valid timestamp', () => {
      expect.soft(validateTimestampInput('1704067200', 'seconds')).toBe('')
      expect.soft(validateTimestampInput('1704067200000', 'milliseconds')).toBe('')
    })

    it('should return error for non-numeric input', () => {
      expect(validateTimestampInput('abc', 'seconds')).toBe('Invalid timestamp')
    })
  })

  describe('convertDateToTimestamp', () => {
    it('should return null for empty input', () => {
      expect(convertDateToTimestamp('')).toBeNull()
    })

    it('should return null for invalid date', () => {
      expect(convertDateToTimestamp('not-a-date')).toBeNull()
    })

    it('should convert valid date string', () => {
      const result = convertDateToTimestamp('2024-01-01T00:00:00Z')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.seconds).toBe(1704067200)
      expect.soft(result?.milliseconds).toBe(1704067200000)
    })

    it('should include ISO format', () => {
      const result = convertDateToTimestamp('2024-01-01')
      expect.soft(result?.iso).toBeTruthy()
    })
  })

  describe('calculateDateTime', () => {
    it('should return null for empty base input', () => {
      expect(calculateDateTime('', 'add', 1, 'days')).toBeNull()
    })

    it('should return null for invalid date', () => {
      expect(calculateDateTime('invalid', 'add', 1, 'days')).toBeNull()
    })

    it('should add days correctly', () => {
      const result = calculateDateTime('2024-01-01T00:00:00', 'add', 5, 'days')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.date).toContain('2024-01-06')
    })

    it('should subtract days correctly', () => {
      const result = calculateDateTime('2024-01-10T00:00:00', 'subtract', 5, 'days')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.date).toContain('2024-01-05')
    })

    it('should add months correctly', () => {
      const result = calculateDateTime('2024-01-15T00:00:00', 'add', 2, 'months')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.date).toContain('2024-03-15')
    })

    it('should add years correctly', () => {
      const result = calculateDateTime('2024-01-01T00:00:00', 'add', 1, 'years')
      expect.soft(result).not.toBeNull()
      expect.soft(result?.date).toContain('2025-01-01')
    })

    it('should include timestamp in result', () => {
      const result = calculateDateTime('2024-01-01T00:00:00', 'add', 1, 'days')
      expect.soft(result?.timestamp).toBeGreaterThan(0)
    })
  })

  describe('getCommonTimestamps', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return array of common timestamps', () => {
      const timestamps = getCommonTimestamps()
      expect(timestamps.length).toBeGreaterThan(0)
    })

    it('should include Now timestamp', () => {
      const timestamps = getCommonTimestamps()
      const now = timestamps.find(t => t.label === 'Now')
      expect(now).toBeDefined()
    })

    it('should include Unix Epoch', () => {
      const timestamps = getCommonTimestamps()
      const epoch = timestamps.find(t => t.label === 'Unix Epoch')
      expect.soft(epoch).toBeDefined()
      expect.soft(epoch?.ts).toBe(0)
    })

    it('should include Y2K', () => {
      const timestamps = getCommonTimestamps()
      const y2k = timestamps.find(t => t.label === 'Y2K')
      expect.soft(y2k).toBeDefined()
      expect.soft(y2k?.ts).toBe(946684800000)
    })

    it('should include start of day', () => {
      const timestamps = getCommonTimestamps()
      const startOfDay = timestamps.find(t => t.label === 'Start of today')
      expect(startOfDay).toBeDefined()
    })
  })

  describe('getCurrentTimestampString', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(1704067200000)) // 2024-01-01 00:00:00 UTC
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return timestamp in seconds', () => {
      const result = getCurrentTimestampString('seconds')
      expect(result).toBe('1704067200')
    })

    it('should return timestamp in milliseconds', () => {
      const result = getCurrentTimestampString('milliseconds')
      expect(result).toBe('1704067200000')
    })
  })

  describe('getCurrentDateTimeString', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T14:30:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return formatted date time string', () => {
      const result = getCurrentDateTimeString()
      expect.soft(result).toContain('2024')
      expect.soft(result).toContain('06')
      expect.soft(result).toContain('15')
    })
  })
})
