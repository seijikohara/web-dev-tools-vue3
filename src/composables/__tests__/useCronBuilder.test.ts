import { describe, it, expect, beforeEach } from 'vitest'
import {
  createDefaultCronField,
  generateFieldExpression,
  isValidCronField,
  parseField,
  generateValueOptions,
  matchesCronField,
  useCronBuilder,
  FIELD_TYPE_OPTIONS,
  MONTH_NAMES,
  DAY_NAMES,
  PRESETS,
  CRON_REFERENCE,
} from '../useCronBuilder'

describe('useCronBuilder', () => {
  describe('Constants', () => {
    it('should have correct FIELD_TYPE_OPTIONS', () => {
      const values = FIELD_TYPE_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('every')
      expect.soft(values).toContain('specific')
      expect.soft(values).toContain('range')
      expect.soft(values).toContain('step')
    })

    it('should have 12 months', () => {
      expect(MONTH_NAMES.length).toBe(12)
    })

    it('should have correct month values', () => {
      expect.soft(MONTH_NAMES[0]?.value).toBe(1)
      expect.soft(MONTH_NAMES[11]?.value).toBe(12)
      expect.soft(MONTH_NAMES[0]?.label).toBe('January')
      expect.soft(MONTH_NAMES[11]?.label).toBe('December')
    })

    it('should have 7 days', () => {
      expect(DAY_NAMES.length).toBe(7)
    })

    it('should have correct day values', () => {
      expect.soft(DAY_NAMES[0]?.value).toBe(0)
      expect.soft(DAY_NAMES[6]?.value).toBe(6)
      expect.soft(DAY_NAMES[0]?.label).toBe('Sunday')
      expect.soft(DAY_NAMES[6]?.label).toBe('Saturday')
    })

    it('should have presets with valid cron expressions', () => {
      expect.soft(PRESETS.length).toBeGreaterThan(0)
      for (const preset of PRESETS) {
        expect.soft(preset.value.split(' ').length).toBeGreaterThanOrEqual(5)
      }
    })

    it('should have cron reference entries', () => {
      expect(CRON_REFERENCE.length).toBe(6)
    })
  })

  describe('createDefaultCronField', () => {
    it('should create default field with correct min/max', () => {
      const field = createDefaultCronField(0, 59)
      expect.soft(field.type).toBe('every')
      expect.soft(field.values).toEqual([])
      expect.soft(field.rangeStart).toBe(0)
      expect.soft(field.rangeEnd).toBe(59)
      expect.soft(field.stepValue).toBe(1)
    })

    it('should create field for day of month', () => {
      const field = createDefaultCronField(1, 31)
      expect.soft(field.rangeStart).toBe(1)
      expect.soft(field.rangeEnd).toBe(31)
    })
  })

  describe('generateFieldExpression', () => {
    it('should return * for every type', () => {
      const field = createDefaultCronField(0, 59)
      expect(generateFieldExpression(field, 0, 59)).toBe('*')
    })

    it('should return comma-separated values for specific type', () => {
      const field = {
        ...createDefaultCronField(0, 59),
        type: 'specific' as const,
        values: [1, 5, 10],
      }
      expect(generateFieldExpression(field, 0, 59)).toBe('1,5,10')
    })

    it('should return * for empty specific values', () => {
      const field = { ...createDefaultCronField(0, 59), type: 'specific' as const, values: [] }
      expect(generateFieldExpression(field, 0, 59)).toBe('*')
    })

    it('should sort specific values', () => {
      const field = {
        ...createDefaultCronField(0, 59),
        type: 'specific' as const,
        values: [10, 1, 5],
      }
      expect(generateFieldExpression(field, 0, 59)).toBe('1,5,10')
    })

    it('should return range expression', () => {
      const field = {
        ...createDefaultCronField(0, 59),
        type: 'range' as const,
        rangeStart: 10,
        rangeEnd: 20,
      }
      expect(generateFieldExpression(field, 0, 59)).toBe('10-20')
    })

    it('should clamp range to min/max', () => {
      const field = {
        ...createDefaultCronField(0, 59),
        type: 'range' as const,
        rangeStart: -5,
        rangeEnd: 100,
      }
      expect(generateFieldExpression(field, 0, 59)).toBe('0-59')
    })

    it('should return step expression', () => {
      const field = { ...createDefaultCronField(0, 59), type: 'step' as const, stepValue: 5 }
      expect(generateFieldExpression(field, 0, 59)).toBe('*/5')
    })

    it('should return * for step value 1', () => {
      const field = { ...createDefaultCronField(0, 59), type: 'step' as const, stepValue: 1 }
      expect(generateFieldExpression(field, 0, 59)).toBe('*')
    })
  })

  describe('isValidCronField', () => {
    it('should accept *', () => {
      expect(isValidCronField('*')).toBe(true)
    })

    it('should accept step expression', () => {
      expect.soft(isValidCronField('*/5')).toBe(true)
      expect.soft(isValidCronField('*/15')).toBe(true)
    })

    it('should accept single number', () => {
      expect.soft(isValidCronField('5')).toBe(true)
      expect.soft(isValidCronField('0')).toBe(true)
      expect.soft(isValidCronField('59')).toBe(true)
    })

    it('should accept comma-separated numbers', () => {
      expect.soft(isValidCronField('1,5,10')).toBe(true)
      expect.soft(isValidCronField('0,30')).toBe(true)
    })

    it('should accept range', () => {
      expect.soft(isValidCronField('1-5')).toBe(true)
      expect.soft(isValidCronField('10-20')).toBe(true)
    })

    it('should reject invalid expressions', () => {
      expect.soft(isValidCronField('abc')).toBe(false)
      expect.soft(isValidCronField('/')).toBe(false)
      expect.soft(isValidCronField('1-')).toBe(false)
    })
  })

  describe('parseField', () => {
    it('should parse * as every', () => {
      const field = parseField('*', 0, 59)
      expect.soft(field.type).toBe('every')
      expect.soft(field.values).toEqual([])
    })

    it('should parse step expression', () => {
      const field = parseField('*/15', 0, 59)
      expect.soft(field.type).toBe('step')
      expect.soft(field.stepValue).toBe(15)
    })

    it('should parse range expression', () => {
      const field = parseField('10-20', 0, 59)
      expect.soft(field.type).toBe('range')
      expect.soft(field.rangeStart).toBe(10)
      expect.soft(field.rangeEnd).toBe(20)
    })

    it('should parse specific values', () => {
      const field = parseField('1,5,10', 0, 59)
      expect.soft(field.type).toBe('specific')
      expect.soft(field.values).toEqual([1, 5, 10])
    })

    it('should parse single number as specific', () => {
      const field = parseField('5', 0, 59)
      expect.soft(field.type).toBe('specific')
      expect.soft(field.values).toEqual([5])
    })
  })

  describe('generateValueOptions', () => {
    it('should generate options for minute range', () => {
      const options = generateValueOptions(0, 59)
      expect.soft(options.length).toBe(60)
      expect.soft(options[0]?.value).toBe(0)
      expect.soft(options[59]?.value).toBe(59)
    })

    it('should generate options for hour range', () => {
      const options = generateValueOptions(0, 23)
      expect.soft(options.length).toBe(24)
      expect.soft(options[0]?.value).toBe(0)
      expect.soft(options[23]?.value).toBe(23)
    })

    it('should generate options for day of month', () => {
      const options = generateValueOptions(1, 31)
      expect.soft(options.length).toBe(31)
      expect.soft(options[0]?.value).toBe(1)
      expect.soft(options[30]?.value).toBe(31)
    })
  })

  describe('matchesCronField', () => {
    it('should match everything for every type', () => {
      const field = createDefaultCronField(0, 59)
      expect.soft(matchesCronField(0, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(30, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(59, field, 0, 59)).toBe(true)
    })

    it('should match specific values only', () => {
      const field = {
        ...createDefaultCronField(0, 59),
        type: 'specific' as const,
        values: [5, 10, 15],
      }
      expect.soft(matchesCronField(5, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(10, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(7, field, 0, 59)).toBe(false)
    })

    it('should match within range', () => {
      const field = {
        ...createDefaultCronField(0, 59),
        type: 'range' as const,
        rangeStart: 10,
        rangeEnd: 20,
      }
      expect.soft(matchesCronField(10, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(15, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(20, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(9, field, 0, 59)).toBe(false)
      expect.soft(matchesCronField(21, field, 0, 59)).toBe(false)
    })

    it('should match step values', () => {
      const field = { ...createDefaultCronField(0, 59), type: 'step' as const, stepValue: 5 }
      expect.soft(matchesCronField(0, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(5, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(10, field, 0, 59)).toBe(true)
      expect.soft(matchesCronField(3, field, 0, 59)).toBe(false)
    })
  })

  describe('useCronBuilder composable', () => {
    let builder: ReturnType<typeof useCronBuilder>

    beforeEach(() => {
      builder = useCronBuilder()
    })

    it('should initialize with default values', () => {
      expect.soft(builder.useSeconds.value).toBe(false)
      expect.soft(builder.cronExpression.value).toBe('* * * * *')
      expect.soft(builder.manualInput.value).toBe('* * * * *')
      expect.soft(builder.parseError.value).toBe('')
    })

    it('should initialize fields with correct defaults', () => {
      expect.soft(builder.seconds.value.type).toBe('every')
      expect.soft(builder.minutes.value.type).toBe('every')
      expect.soft(builder.hours.value.type).toBe('every')
      expect.soft(builder.dayOfMonth.value.type).toBe('every')
      expect.soft(builder.month.value.type).toBe('every')
      expect.soft(builder.dayOfWeek.value.type).toBe('every')
    })

    it('should update cron expression when field changes', async () => {
      builder.minutes.value = {
        type: 'specific',
        values: [0, 30],
        rangeStart: 0,
        rangeEnd: 59,
        stepValue: 1,
      }
      await Promise.resolve()

      expect(builder.cronExpression.value).toBe('0,30 * * * *')
    })

    it('should generate cron with seconds when enabled', async () => {
      builder.useSeconds.value = true
      await Promise.resolve()

      expect(builder.cronExpression.value.split(' ').length).toBe(6)
    })

    it('should compute human readable description', () => {
      expect(builder.humanReadable.value).toBe('Every minute')
    })

    it('should update human readable for step values', async () => {
      builder.minutes.value = {
        type: 'step',
        values: [],
        rangeStart: 0,
        rangeEnd: 59,
        stepValue: 15,
      }
      await Promise.resolve()

      expect(builder.humanReadable.value).toContain('15 minutes')
    })

    it('should apply preset correctly', async () => {
      builder.applyPreset('0 * * * *')
      await Promise.resolve()

      expect.soft(builder.cronExpression.value).toBe('0 * * * *')
      expect.soft(builder.minutes.value.type).toBe('specific')
      expect.soft(builder.minutes.value.values).toEqual([0])
    })

    it('should reset all fields', async () => {
      builder.minutes.value = {
        type: 'specific',
        values: [0, 30],
        rangeStart: 0,
        rangeEnd: 59,
        stepValue: 1,
      }
      await Promise.resolve()

      builder.resetAll()
      await Promise.resolve()

      expect.soft(builder.cronExpression.value).toBe('* * * * *')
      expect.soft(builder.useSeconds.value).toBe(false)
      expect.soft(builder.minutes.value.type).toBe('every')
    })

    it('should compute next executions', () => {
      expect(builder.nextExecutions.value.length).toBe(5)
    })

    it('should format execution date', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formatted = builder.formatDate(date)
      expect.soft(formatted).toContain('2024')
      expect.soft(formatted).toContain('Jan')
    })

    it('should handle range expressions', async () => {
      builder.applyPreset('0 0 * * 1-5')
      await Promise.resolve()

      expect.soft(builder.dayOfWeek.value.type).toBe('range')
      expect.soft(builder.dayOfWeek.value.rangeStart).toBe(1)
      expect.soft(builder.dayOfWeek.value.rangeEnd).toBe(5)
    })

    it('should handle step expressions', async () => {
      builder.applyPreset('*/15 * * * *')
      await Promise.resolve()

      expect.soft(builder.minutes.value.type).toBe('step')
      expect.soft(builder.minutes.value.stepValue).toBe(15)
    })
  })
})
