import { ref, computed } from 'vue'

// UUID version types
export type UuidVersion = 'v1' | 'v4' | 'v7' | 'nil' | 'max'

export interface UuidVersionOption {
  label: string
  value: UuidVersion
  icon: string
  description: string
}

export interface GeneratedUuid {
  id: number
  uuid: string
}

export interface UuidFormatOptions {
  uppercase: boolean
  noBraces: boolean
}

// Constants
export const NIL_UUID = '00000000-0000-0000-0000-000000000000'
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

export const UUID_VERSION_OPTIONS: UuidVersionOption[] = [
  {
    label: 'UUID v1 (Timestamp + Node)',
    value: 'v1',
    icon: 'pi pi-clock',
    description: 'Time-based with simulated MAC',
  },
  {
    label: 'UUID v4 (Random)',
    value: 'v4',
    icon: 'pi pi-box',
    description: 'Cryptographically random',
  },
  {
    label: 'UUID v7 (Time-ordered)',
    value: 'v7',
    icon: 'pi pi-sort-amount-down',
    description: 'Unix timestamp + random (recommended)',
  },
  { label: 'NIL UUID', value: 'nil', icon: 'pi pi-minus', description: 'All zeros' },
  { label: 'MAX UUID', value: 'max', icon: 'pi pi-plus', description: 'All ones (0xff)' },
]

// UUID Generation functions (pure functions)
export const generateUUIDv4 = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export const generateUUIDv7 = (): string => {
  const timestamp = Date.now()
  const timestampHex = timestamp.toString(16).padStart(12, '0')

  const randomPart1 = Math.random().toString(16).slice(2, 6).padEnd(4, '0')
  const randomPart2 = Math.random().toString(16).slice(2, 6).padEnd(4, '0')
  const randomPart3 = Math.random().toString(16).slice(2, 14).padEnd(12, '0')

  const variantByte = ((parseInt(randomPart2[0] ?? '0', 16) & 0x3) | 0x8).toString(16)

  return (
    `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-7${randomPart1.slice(0, 3)}-` +
    `${variantByte}${randomPart2.slice(1, 4)}-${randomPart3}`
  )
}

export const generateUUIDv1 = (): string => {
  const now = Date.now()
  // UUID epoch is October 15, 1582
  const uuidEpoch = 122192928000000000n
  const timestamp = BigInt(now) * 10000n + uuidEpoch

  const timeLow = (timestamp & 0xffffffffn).toString(16).padStart(8, '0')
  const timeMid = ((timestamp >> 32n) & 0xffffn).toString(16).padStart(4, '0')
  const timeHiAndVersion = (((timestamp >> 48n) & 0x0fffn) | 0x1000n).toString(16).padStart(4, '0')

  // Random clock sequence with variant bits
  const clockSeq = ((Math.random() * 0x3fff) | 0x8000) >>> 0
  const clockSeqHex = clockSeq.toString(16).padStart(4, '0')

  // Random node (simulated MAC address)
  const node = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('')

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHex}-${node}`
}

// Generate a single UUID based on version
export const generateUuidByVersion = (version: UuidVersion): string => {
  switch (version) {
    case 'v1':
      return generateUUIDv1()
    case 'v4':
      return generateUUIDv4()
    case 'v7':
      return generateUUIDv7()
    case 'nil':
      return NIL_UUID
    case 'max':
      return MAX_UUID
    default:
      return generateUUIDv7()
  }
}

// Format UUID based on options
export const formatUuid = (uuid: string, options: UuidFormatOptions): string => {
  const cased = options.uppercase ? uuid.toUpperCase() : uuid
  return options.noBraces ? cased : `{${cased}}`
}

// Composable for UUID generation with state management
export const useUuidGenerator = () => {
  // State
  const version = ref<UuidVersion>('v7')
  const count = ref(10)
  const uppercase = ref(false)
  const noBraces = ref(true)
  const generatedUuids = ref<GeneratedUuid[]>([])

  // Computed
  const formatOptions = computed<UuidFormatOptions>(() => ({
    uppercase: uppercase.value,
    noBraces: noBraces.value,
  }))

  const uuidsAsText = computed(() => generatedUuids.value.map(item => item.uuid).join('\n'))

  const uuidsCount = computed(() => generatedUuids.value.length)

  // Actions
  const generate = () => {
    const newUuids = Array.from({ length: count.value }, (_, i) => ({
      id: generatedUuids.value.length + i + 1,
      uuid: formatUuid(generateUuidByVersion(version.value), formatOptions.value),
    }))

    generatedUuids.value = [...newUuids, ...generatedUuids.value]
  }

  const generateSingle = (): string =>
    formatUuid(generateUuidByVersion(version.value), formatOptions.value)

  const clear = () => {
    generatedUuids.value = []
  }

  const getAllUuidsAsString = (): string => uuidsAsText.value

  return {
    // State
    version,
    count,
    uppercase,
    noBraces,
    generatedUuids,

    // Computed
    uuidsAsText,
    uuidsCount,

    // Actions
    generate,
    generateSingle,
    clear,
    getAllUuidsAsString,

    // Constants
    versionOptions: UUID_VERSION_OPTIONS,
  }
}
