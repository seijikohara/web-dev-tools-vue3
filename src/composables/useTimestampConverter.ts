import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

// Types
export type TimestampUnit = 'seconds' | 'milliseconds'
export type CalcOperation = 'add' | 'subtract'
export type CalcUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'

export interface TimeFormat {
  label: string
  value: string
  icon: string
}

export interface ConvertedTimestamp {
  local: string
  utc: string
  iso: string
  relative: string
  timezone: string
}

export interface ConvertedDate {
  seconds: number
  milliseconds: number
  iso: string
}

export interface CalculatedResult {
  date: string
  timestamp: number
  iso: string
}

export interface CommonTimestamp {
  label: string
  ts: number
  date: string
}

// Constants
export const UNIT_OPTIONS = [
  { label: 'Seconds', value: 'seconds' as const },
  { label: 'Milliseconds', value: 'milliseconds' as const },
]

export const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
].map(tz => ({ label: tz, value: tz }))

export const OPERATION_OPTIONS = [
  { label: 'Add', value: 'add' as const, icon: 'pi pi-plus' },
  { label: 'Subtract', value: 'subtract' as const, icon: 'pi pi-minus' },
]

export const CALC_UNIT_OPTIONS = [
  { label: 'Seconds', value: 'seconds' as const },
  { label: 'Minutes', value: 'minutes' as const },
  { label: 'Hours', value: 'hours' as const },
  { label: 'Days', value: 'days' as const },
  { label: 'Weeks', value: 'weeks' as const },
  { label: 'Months', value: 'months' as const },
  { label: 'Years', value: 'years' as const },
]

// Pure functions
export const formatCurrentTime = (timestamp: number): TimeFormat[] => {
  const now = dayjs(timestamp)
  return [
    {
      label: 'Unix Timestamp (seconds)',
      value: Math.floor(timestamp / 1000).toString(),
      icon: 'pi pi-clock',
    },
    {
      label: 'Unix Timestamp (milliseconds)',
      value: timestamp.toString(),
      icon: 'pi pi-stopwatch',
    },
    { label: 'ISO 8601', value: now.toISOString(), icon: 'pi pi-calendar' },
    {
      label: 'RFC 2822',
      value: now.format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
      icon: 'pi pi-envelope',
    },
    { label: 'Local', value: now.format('YYYY-MM-DD HH:mm:ss'), icon: 'pi pi-home' },
    { label: 'UTC', value: now.utc().format('YYYY-MM-DD HH:mm:ss [UTC]'), icon: 'pi pi-globe' },
  ]
}

export const convertTimestampToDate = (
  input: string,
  unit: TimestampUnit,
  tz: string,
): ConvertedTimestamp | null => {
  if (!input) return null

  const parsed = parseInt(input)
  if (isNaN(parsed)) return null

  const ts = unit === 'seconds' ? parsed * 1000 : parsed
  const date = dayjs(ts)
  if (!date.isValid()) return null

  return {
    local: date.format('YYYY-MM-DD HH:mm:ss'),
    utc: date.utc().format('YYYY-MM-DD HH:mm:ss [UTC]'),
    iso: date.toISOString(),
    relative: date.fromNow(),
    timezone: date.tz(tz).format('YYYY-MM-DD HH:mm:ss Z'),
  }
}

export const validateTimestampInput = (input: string, unit: TimestampUnit): string => {
  if (!input) return ''

  const ts = parseInt(input)
  if (isNaN(ts)) return 'Invalid timestamp'

  const multiplier = unit === 'seconds' ? 1000 : 1
  const date = dayjs(ts * multiplier)
  if (!date.isValid()) return 'Invalid timestamp'

  return ''
}

export const convertDateToTimestamp = (input: string): ConvertedDate | null => {
  if (!input) return null

  const date = dayjs(input)
  if (!date.isValid()) return null

  return {
    seconds: Math.floor(date.valueOf() / 1000),
    milliseconds: date.valueOf(),
    iso: date.toISOString(),
  }
}

export const calculateDateTime = (
  baseInput: string,
  operation: CalcOperation,
  amount: number,
  unit: CalcUnit,
): CalculatedResult | null => {
  if (!baseInput) return null

  const base = dayjs(baseInput)
  if (!base.isValid()) return null

  const result = operation === 'add' ? base.add(amount, unit) : base.subtract(amount, unit)

  return {
    date: result.format('YYYY-MM-DD HH:mm:ss'),
    timestamp: result.valueOf(),
    iso: result.toISOString(),
  }
}

export const getCommonTimestamps = (): CommonTimestamp[] => {
  const now = dayjs()
  return [
    { label: 'Now', ts: now.valueOf(), date: now.format('YYYY-MM-DD HH:mm:ss') },
    {
      label: 'Start of today',
      ts: now.startOf('day').valueOf(),
      date: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'End of today',
      ts: now.endOf('day').valueOf(),
      date: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Start of week',
      ts: now.startOf('week').valueOf(),
      date: now.startOf('week').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Start of month',
      ts: now.startOf('month').valueOf(),
      date: now.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Start of year',
      ts: now.startOf('year').valueOf(),
      date: now.startOf('year').format('YYYY-MM-DD HH:mm:ss'),
    },
    { label: 'Unix Epoch', ts: 0, date: '1970-01-01 00:00:00' },
    { label: 'Y2K', ts: 946684800000, date: '2000-01-01 00:00:00' },
  ]
}

export const getCurrentTimestampString = (unit: TimestampUnit): string => {
  const now = Date.now()
  return unit === 'seconds' ? Math.floor(now / 1000).toString() : now.toString()
}

export const getCurrentDateTimeString = (): string => dayjs().format('YYYY-MM-DDTHH:mm:ss')

// Composable
export const useTimestampConverter = () => {
  // Current time state
  const currentTimestamp = ref(Date.now())
  const intervalId = ref<number | null>(null)

  onMounted(() => {
    intervalId.value = window.setInterval(() => {
      currentTimestamp.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
    }
  })

  // Converter state
  const timestampInput = ref('')
  const timestampUnit = ref<TimestampUnit>('seconds')
  const dateTimeInput = ref('')
  const selectedTimezone = ref(dayjs.tz.guess())

  // Calculator state
  const calcBaseTimestamp = ref('')
  const calcOperation = ref<CalcOperation>('add')
  const calcAmount = ref(1)
  const calcUnit = ref<CalcUnit>('days')

  // Computed
  const currentTimeFormats = computed(() => formatCurrentTime(currentTimestamp.value))

  const timestampConversionError = computed(() =>
    validateTimestampInput(timestampInput.value, timestampUnit.value),
  )

  const convertedFromTimestamp = computed(() => {
    if (timestampConversionError.value) return null
    return convertTimestampToDate(timestampInput.value, timestampUnit.value, selectedTimezone.value)
  })

  const convertedFromDate = computed(() => convertDateToTimestamp(dateTimeInput.value))

  const calculatedResult = computed(() =>
    calculateDateTime(
      calcBaseTimestamp.value,
      calcOperation.value,
      calcAmount.value,
      calcUnit.value,
    ),
  )

  const commonTimestamps = computed(() => getCommonTimestamps())

  // Actions
  const setCurrentTimestamp = () => {
    timestampInput.value = getCurrentTimestampString(timestampUnit.value)
  }

  const setCurrentDateTime = () => {
    dateTimeInput.value = getCurrentDateTimeString()
  }

  const setCalcBaseNow = () => {
    calcBaseTimestamp.value = getCurrentDateTimeString()
  }

  return {
    // Current time state
    currentTimestamp,

    // Converter state
    timestampInput,
    timestampUnit,
    dateTimeInput,
    selectedTimezone,

    // Calculator state
    calcBaseTimestamp,
    calcOperation,
    calcAmount,
    calcUnit,

    // Computed
    currentTimeFormats,
    timestampConversionError,
    convertedFromTimestamp,
    convertedFromDate,
    calculatedResult,
    commonTimestamps,

    // Actions
    setCurrentTimestamp,
    setCurrentDateTime,
    setCalcBaseNow,
  }
}
