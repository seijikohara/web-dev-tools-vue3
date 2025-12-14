import { ref, computed, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'

// Types
export type CronFieldType = 'every' | 'specific' | 'range' | 'step'

export interface CronField {
  type: CronFieldType
  values: number[]
  rangeStart: number
  rangeEnd: number
  stepValue: number
}

export interface FieldTypeOption {
  label: string
  value: CronFieldType
}

export interface NamedOption {
  label: string
  value: number
}

export interface CronPreset {
  label: string
  value: string
}

// Constants
export const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  { label: 'Every', value: 'every' },
  { label: 'Specific', value: 'specific' },
  { label: 'Range', value: 'range' },
  { label: 'Step', value: 'step' },
]

export const MONTH_NAMES: NamedOption[] = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

export const DAY_NAMES: NamedOption[] = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

export const PRESETS: CronPreset[] = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every Monday', value: '0 0 * * 1' },
  { label: 'Every weekday', value: '0 0 * * 1-5' },
  { label: 'Every month (1st)', value: '0 0 1 * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
]

export const CRON_REFERENCE = [
  { field: 'Seconds', range: '0-59', allowed: '* , - /' },
  { field: 'Minutes', range: '0-59', allowed: '* , - /' },
  { field: 'Hours', range: '0-23', allowed: '* , - /' },
  { field: 'Day of Month', range: '1-31', allowed: '* , - / ? L W' },
  { field: 'Month', range: '1-12', allowed: '* , - /' },
  { field: 'Day of Week', range: '0-6', allowed: '* , - / ? L #' },
]

// Pure functions
export const createDefaultCronField = (min: number, max: number): CronField => ({
  type: 'every',
  values: [],
  rangeStart: min,
  rangeEnd: max,
  stepValue: 1,
})

export const generateFieldExpression = (field: CronField, min: number, max: number): string => {
  switch (field.type) {
    case 'every':
      return '*'
    case 'specific':
      return field.values.length > 0 ? field.values.sort((a, b) => a - b).join(',') : '*'
    case 'range':
      return `${Math.max(min, field.rangeStart)}-${Math.min(max, field.rangeEnd)}`
    case 'step':
      return field.stepValue > 1 ? `*/${field.stepValue}` : '*'
    default:
      return '*'
  }
}

export const isValidCronField = (value: string): boolean => {
  const cronFieldPattern = /^(\*|(\*\/\d+)|(\d+(-\d+)?)(,\d+(-\d+)?)*)$/
  return cronFieldPattern.test(value)
}

export const parseField = (value: string, min: number, max: number): CronField => {
  if (value === '*') {
    return { type: 'every', values: [], rangeStart: min, rangeEnd: max, stepValue: 1 }
  }
  if (value.startsWith('*/')) {
    const step = parseInt(value.slice(2), 10)
    return { type: 'step', values: [], rangeStart: min, rangeEnd: max, stepValue: step }
  }
  if (value.includes('-') && !value.includes(',')) {
    const rangeMatch = /(\d+)-(\d+)/.exec(value)
    if (rangeMatch?.[1] && rangeMatch[2]) {
      return {
        type: 'range',
        values: [],
        rangeStart: parseInt(rangeMatch[1], 10),
        rangeEnd: parseInt(rangeMatch[2], 10),
        stepValue: 1,
      }
    }
  }
  if (value.includes(',') || /^\d+$/.test(value)) {
    const values = value.split(',').map(v => parseInt(v, 10))
    return { type: 'specific', values, rangeStart: min, rangeEnd: max, stepValue: 1 }
  }
  return { type: 'every', values: [], rangeStart: min, rangeEnd: max, stepValue: 1 }
}

export const generateValueOptions = (min: number, max: number): NamedOption[] => {
  return Array.from({ length: max - min + 1 }, (_, i) => ({
    label: String(min + i),
    value: min + i,
  }))
}

export const formatExecutionDate = (date: Date, includeSeconds: boolean): string => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  })
}

export const matchesCronField = (
  value: number,
  field: CronField,
  min: number,
  max: number,
): boolean => {
  switch (field.type) {
    case 'every':
      return true
    case 'specific':
      return field.values.includes(value)
    case 'range':
      return value >= Math.max(min, field.rangeStart) && value <= Math.min(max, field.rangeEnd)
    case 'step':
      return value % field.stepValue === 0
    default:
      return true
  }
}

// Composable
export const useCronBuilder = () => {
  // State
  const useSeconds = ref(false)
  const cronExpression = ref('* * * * *')
  const manualInput = ref('* * * * *')
  const parseError = ref('')
  const isManualEdit = ref(false)

  // Field states
  const seconds = ref<CronField>(createDefaultCronField(0, 59))
  const minutes = ref<CronField>(createDefaultCronField(0, 59))
  const hours = ref<CronField>(createDefaultCronField(0, 23))
  const dayOfMonth = ref<CronField>(createDefaultCronField(1, 31))
  const month = ref<CronField>(createDefaultCronField(1, 12))
  const dayOfWeek = ref<CronField>(createDefaultCronField(0, 6))

  // Generate cron expression from fields
  const generateCronExpression = () => {
    const parts = [
      generateFieldExpression(minutes.value, 0, 59),
      generateFieldExpression(hours.value, 0, 23),
      generateFieldExpression(dayOfMonth.value, 1, 31),
      generateFieldExpression(month.value, 1, 12),
      generateFieldExpression(dayOfWeek.value, 0, 6),
    ]

    if (useSeconds.value) {
      parts.unshift(generateFieldExpression(seconds.value, 0, 59))
    }

    cronExpression.value = parts.join(' ')

    if (!isManualEdit.value) {
      manualInput.value = cronExpression.value
      parseError.value = ''
    }
  }

  // Watch for field changes
  watch(
    [useSeconds, seconds, minutes, hours, dayOfMonth, month, dayOfWeek],
    () => {
      generateCronExpression()
    },
    { deep: true, immediate: true },
  )

  // Pure helper functions for human readable description
  const describeSeconds = (sec: CronField, enabled: boolean): string | null => {
    if (!enabled) return null
    const typeMap: Record<string, () => string | null> = {
      every: () => 'Every second',
      step: () => `Every ${sec.stepValue} seconds`,
      specific: () => (sec.values.length > 0 ? `At second ${sec.values.join(', ')}` : null),
      range: () => `Seconds ${sec.rangeStart}-${sec.rangeEnd}`,
    }
    return typeMap[sec.type]?.() ?? null
  }

  const describeMinutes = (min: CronField, sec: CronField, usesSec: boolean): string | null => {
    const typeMap: Record<string, () => string | null> = {
      every: () => (!usesSec || sec.type !== 'every' ? 'Every minute' : null),
      step: () => `Every ${min.stepValue} minutes`,
      specific: () => (min.values.length > 0 ? `At minute ${min.values.join(', ')}` : null),
      range: () => `Minutes ${min.rangeStart}-${min.rangeEnd}`,
    }
    return typeMap[min.type]?.() ?? null
  }

  const describeHours = (hr: CronField): string | null => {
    const typeMap: Record<string, () => string | null> = {
      step: () => `every ${hr.stepValue} hours`,
      specific: () => (hr.values.length > 0 ? `at hour ${hr.values.join(', ')}` : null),
      range: () => `hours ${hr.rangeStart}-${hr.rangeEnd}`,
    }
    return typeMap[hr.type]?.() ?? null
  }

  const describeDayOfMonth = (dom: CronField): string | null => {
    const typeMap: Record<string, () => string | null> = {
      specific: () => (dom.values.length > 0 ? `on day ${dom.values.join(', ')} of the month` : null),
      range: () => `days ${dom.rangeStart}-${dom.rangeEnd} of the month`,
      step: () => `every ${dom.stepValue} days`,
    }
    return typeMap[dom.type]?.() ?? null
  }

  const describeMonth = (mon: CronField): string | null => {
    if (mon.type === 'specific' && mon.values.length > 0) {
      const monthLabels = mon.values
        .map((v: number) => MONTH_NAMES.find(m => m.value === v)?.label ?? v.toString())
        .join(', ')
      return `in ${monthLabels}`
    }
    if (mon.type === 'range') {
      const startMonth = MONTH_NAMES.find(m => m.value === mon.rangeStart)?.label
      const endMonth = MONTH_NAMES.find(m => m.value === mon.rangeEnd)?.label
      return `from ${startMonth} to ${endMonth}`
    }
    return null
  }

  const describeDayOfWeek = (dow: CronField): string | null => {
    if (dow.type === 'specific' && dow.values.length > 0) {
      const dayLabels = dow.values
        .map((v: number) => DAY_NAMES.find(d => d.value === v)?.label ?? v.toString())
        .join(', ')
      return `on ${dayLabels}`
    }
    if (dow.type === 'range') {
      const startDay = DAY_NAMES.find(d => d.value === dow.rangeStart)?.label
      const endDay = DAY_NAMES.find(d => d.value === dow.rangeEnd)?.label
      return `from ${startDay} to ${endDay}`
    }
    return null
  }

  // Human readable description
  const humanReadable = computed(() => {
    const parts = [
      describeSeconds(seconds.value, useSeconds.value),
      describeMinutes(minutes.value, seconds.value, useSeconds.value),
      describeHours(hours.value),
      describeDayOfMonth(dayOfMonth.value),
      describeMonth(month.value),
      describeDayOfWeek(dayOfWeek.value),
    ].filter((part): part is string => part !== null)

    return parts.length > 0 ? parts.join(', ') : 'Every minute'
  })

  // Next executions
  const nextExecutions = computed(() => {
    const now = new Date()
    const maxIterations = 1000

    const matchesCron = (date: Date): boolean => {
      if (useSeconds.value && !matchesCronField(date.getSeconds(), seconds.value, 0, 59))
        return false
      if (!matchesCronField(date.getMinutes(), minutes.value, 0, 59)) return false
      if (!matchesCronField(date.getHours(), hours.value, 0, 23)) return false
      if (!matchesCronField(date.getDate(), dayOfMonth.value, 1, 31)) return false
      if (!matchesCronField(date.getMonth() + 1, month.value, 1, 12)) return false
      if (!matchesCronField(date.getDay(), dayOfWeek.value, 0, 6)) return false
      return true
    }

    const findNextExecutions = (
      current: Date,
      executions: Date[],
      iterationCount: number,
    ): Date[] => {
      if (executions.length >= 5 || iterationCount >= maxIterations) {
        return executions
      }

      const next = new Date(current)
      if (useSeconds.value) {
        next.setSeconds(next.getSeconds() + 1)
      } else {
        next.setMinutes(next.getMinutes() + 1)
      }

      const newExecutions = matchesCron(next) ? [...executions, new Date(next)] : executions

      return findNextExecutions(next, newExecutions, iterationCount + 1)
    }

    return findNextExecutions(new Date(now), [], 0)
  })

  // Parse cron expression
  const parseCronExpression = (expr: string): boolean => {
    const parts = expr.trim().split(/\s+/)

    if (parts.length !== 5 && parts.length !== 6) {
      parseError.value = `Invalid format: Expected 5 or 6 fields, got ${parts.length}`
      return false
    }

    const fieldNames =
      parts.length === 6
        ? ['seconds', 'minutes', 'hours', 'day of month', 'month', 'day of week']
        : ['minutes', 'hours', 'day of month', 'month', 'day of week']

    const invalidField = parts
      .map((part, i) => ({ part, index: i }))
      .find(({ part }) => !isValidCronField(part))

    if (invalidField) {
      parseError.value = `Invalid ${fieldNames[invalidField.index]}: "${invalidField.part}"`
      return false
    }

    parseError.value = ''

    if (parts.length === 6) {
      useSeconds.value = true
      seconds.value = parseField(parts[0] ?? '*', 0, 59)
      minutes.value = parseField(parts[1] ?? '*', 0, 59)
      hours.value = parseField(parts[2] ?? '*', 0, 23)
      dayOfMonth.value = parseField(parts[3] ?? '*', 1, 31)
      month.value = parseField(parts[4] ?? '*', 1, 12)
      dayOfWeek.value = parseField(parts[5] ?? '*', 0, 6)
    } else {
      useSeconds.value = false
      minutes.value = parseField(parts[0] ?? '*', 0, 59)
      hours.value = parseField(parts[1] ?? '*', 0, 23)
      dayOfMonth.value = parseField(parts[2] ?? '*', 1, 31)
      month.value = parseField(parts[3] ?? '*', 1, 12)
      dayOfWeek.value = parseField(parts[4] ?? '*', 0, 6)
    }

    return true
  }

  // Watch manual input with debounce
  watchDebounced(
    manualInput,
    newValue => {
      if (newValue !== cronExpression.value) {
        isManualEdit.value = true
        const success = parseCronExpression(newValue)
        if (success) {
          cronExpression.value = newValue
        }
        isManualEdit.value = false
      }
    },
    { debounce: 300 },
  )

  // Actions
  const applyPreset = (preset: string) => {
    manualInput.value = preset
    parseCronExpression(preset)
    cronExpression.value = preset
  }

  const resetAll = () => {
    useSeconds.value = false
    seconds.value = createDefaultCronField(0, 59)
    minutes.value = createDefaultCronField(0, 59)
    hours.value = createDefaultCronField(0, 23)
    dayOfMonth.value = createDefaultCronField(1, 31)
    month.value = createDefaultCronField(1, 12)
    dayOfWeek.value = createDefaultCronField(0, 6)
    manualInput.value = '* * * * *'
    parseError.value = ''
  }

  const formatDate = (date: Date): string => formatExecutionDate(date, useSeconds.value)

  return {
    // State
    useSeconds,
    cronExpression,
    manualInput,
    parseError,

    // Fields
    seconds,
    minutes,
    hours,
    dayOfMonth,
    month,
    dayOfWeek,

    // Computed
    humanReadable,
    nextExecutions,

    // Actions
    applyPreset,
    resetAll,
    formatDate,
  }
}
