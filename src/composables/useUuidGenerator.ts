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
export const NIL_UUID = '00000000-0000-0000-0000-000000000000' as const
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff' as const

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
const getRandomHex = (): number => (Math.random() * 16) | 0

const getUuidV4Character = (char: string): string => {
  const random = getRandomHex()
  const value = char === 'x' ? random : (random & 0x3) | 0x8
  return value.toString(16)
}

export const generateUUIDv4 = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, getUuidV4Character)

const getRandomHexPart = (length: number): string =>
  Math.random()
    .toString(16)
    .slice(2, 2 + length)
    .padEnd(length, '0')

const createVariantByte = (firstChar: string): string => {
  const parsed = parseInt(firstChar, 16)
  return ((parsed & 0x3) | 0x8).toString(16)
}

export const generateUUIDv7 = (): string => {
  const timestampHex = Date.now().toString(16).padStart(12, '0')
  const randomPart1 = getRandomHexPart(4)
  const randomPart2 = getRandomHexPart(4)
  const randomPart3 = getRandomHexPart(12)

  const variantByte = createVariantByte(randomPart2[0] ?? '0')

  return [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    `7${randomPart1.slice(0, 3)}`,
    `${variantByte}${randomPart2.slice(1, 4)}`,
    randomPart3,
  ].join('-')
}

const UUID_EPOCH = 122192928000000000n
const CLOCK_SEQ_MASK = 0x3fff
const VARIANT_BITS = 0x8000

const getUuidV1Timestamp = (now: number): bigint => BigInt(now) * 10000n + UUID_EPOCH

const createClockSequence = (): string =>
  (((Math.random() * CLOCK_SEQ_MASK) | VARIANT_BITS) >>> 0).toString(16).padStart(4, '0')

const createNodeId = (): string =>
  Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('')

export const generateUUIDv1 = (): string => {
  const timestamp = getUuidV1Timestamp(Date.now())

  const timeLow = (timestamp & 0xffffffffn).toString(16).padStart(8, '0')
  const timeMid = ((timestamp >> 32n) & 0xffffn).toString(16).padStart(4, '0')
  const timeHiAndVersion = (((timestamp >> 48n) & 0x0fffn) | 0x1000n).toString(16).padStart(4, '0')
  const clockSeqHex = createClockSequence()
  const node = createNodeId()

  return [timeLow, timeMid, timeHiAndVersion, clockSeqHex, node].join('-')
}

// UUID version generators map
const uuidGenerators = {
  v1: generateUUIDv1,
  v4: generateUUIDv4,
  v7: generateUUIDv7,
  nil: () => NIL_UUID,
  max: () => MAX_UUID,
} satisfies Record<UuidVersion, () => string>

// Generate a single UUID based on version
export const generateUuidByVersion = (version: UuidVersion): string => {
  const generator = uuidGenerators[version]
  return generator()
}

// Format UUID based on options
const applyCasing = (uuid: string, uppercase: boolean): string =>
  uppercase ? uuid.toUpperCase() : uuid

const applyBraces = (uuid: string, noBraces: boolean): string => (noBraces ? uuid : `{${uuid}}`)

export const formatUuid = (uuid: string, options: UuidFormatOptions): string => {
  const cased = applyCasing(uuid, options.uppercase)
  return applyBraces(cased, options.noBraces)
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

  const uuidsAsText = computed(() => generatedUuids.value.map(({ uuid }) => uuid).join('\n'))

  const uuidsCount = computed(() => generatedUuids.value.length)

  // Pure helper functions for generation
  const createUuidEntry = (
    id: number,
    options: UuidFormatOptions,
    ver: UuidVersion,
  ): GeneratedUuid => ({
    id,
    uuid: formatUuid(generateUuidByVersion(ver), options),
  })

  // Actions
  const generate = (): void => {
    const currentLength = generatedUuids.value.length
    const countValue = count.value
    const options = formatOptions.value
    const ver = version.value

    const newUuids = Array.from({ length: countValue }, (_, i) =>
      createUuidEntry(currentLength + i + 1, options, ver),
    )

    generatedUuids.value = [...newUuids, ...generatedUuids.value]
  }

  const generateSingle = (): string =>
    formatUuid(generateUuidByVersion(version.value), formatOptions.value)

  const clear = (): void => {
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
