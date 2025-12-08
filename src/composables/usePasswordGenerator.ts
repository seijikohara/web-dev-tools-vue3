import { ref, computed } from 'vue'

// Character sets
export const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'il1Lo0O',
} as const

export type CharSetKey = keyof typeof CHAR_SETS

export interface PasswordStrength {
  label: string
  severity: 'danger' | 'warn' | 'info' | 'success'
  score: number
}

export interface EntropyInfo {
  label: string
  severity: 'danger' | 'warn' | 'info' | 'success'
}

export interface GeneratedPassword {
  id: number
  password: string
  strength: PasswordStrength
}

export interface PasswordOptions {
  length: number
  includeLowercase: boolean
  includeUppercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
  customChars: string
}

export type PasswordPreset = 'simple' | 'strong' | 'pin' | 'passphrase'

export const PASSWORD_PRESETS: Record<PasswordPreset, Partial<PasswordOptions>> = {
  simple: {
    length: 8,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: false,
    includeSymbols: false,
    excludeAmbiguous: true,
  },
  strong: {
    length: 20,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
  },
  pin: {
    length: 6,
    includeLowercase: false,
    includeUppercase: false,
    includeNumbers: true,
    includeSymbols: false,
    excludeAmbiguous: false,
  },
  passphrase: {
    length: 32,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeAmbiguous: true,
  },
}

// Pure functions for password operations
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const lengthScore = [
    password.length >= 8,
    password.length >= 12,
    password.length >= 16,
    password.length >= 24,
  ].filter(Boolean).length

  const varietyScore =
    [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length +
    (/[^a-zA-Z0-9]/.test(password) ? 2 : 0)

  const penaltyScore = [
    /(.)\1{2,}/.test(password), // Repeated characters
    /^[a-zA-Z]+$/.test(password), // Only letters
  ].filter(Boolean).length

  const score = lengthScore + varietyScore - penaltyScore

  if (score <= 2) return { label: 'Weak', severity: 'danger', score }
  if (score <= 4) return { label: 'Fair', severity: 'warn', score }
  if (score <= 6) return { label: 'Good', severity: 'info', score }
  return { label: 'Strong', severity: 'success', score }
}

export const buildCharacterPool = (options: PasswordOptions): string => {
  const baseParts = [
    options.includeLowercase ? CHAR_SETS.lowercase : '',
    options.includeUppercase ? CHAR_SETS.uppercase : '',
    options.includeNumbers ? CHAR_SETS.numbers : '',
    options.includeSymbols ? CHAR_SETS.symbols : '',
    options.customChars,
  ]

  const basePool = baseParts.join('')

  const filteredPool = options.excludeAmbiguous
    ? Array.from(basePool)
        .filter(char => !CHAR_SETS.ambiguous.includes(char))
        .join('')
    : basePool

  // Remove duplicates
  return Array.from(new Set(Array.from(filteredPool))).join('')
}

export const calculateEntropy = (poolSize: number, length: number): number => {
  if (poolSize <= 0) return 0
  return Math.round(length * Math.log2(poolSize))
}

export const getEntropyInfo = (entropy: number): EntropyInfo => {
  if (entropy < 28) return { label: 'Very Weak', severity: 'danger' }
  if (entropy < 36) return { label: 'Weak', severity: 'danger' }
  if (entropy < 60) return { label: 'Reasonable', severity: 'warn' }
  if (entropy < 128) return { label: 'Strong', severity: 'success' }
  return { label: 'Very Strong', severity: 'info' }
}

export const generateSecurePassword = (pool: string, length: number): string => {
  if (!pool.length) return ''

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)

  return Array.from(array, num => pool[num % pool.length]).join('')
}

// Composable
export const usePasswordGenerator = () => {
  // State
  const length = ref(16)
  const count = ref(10)
  const includeLowercase = ref(true)
  const includeUppercase = ref(true)
  const includeNumbers = ref(true)
  const includeSymbols = ref(true)
  const excludeAmbiguous = ref(false)
  const customChars = ref('')
  const generatedPasswords = ref<GeneratedPassword[]>([])

  // Computed
  const options = computed<PasswordOptions>(() => ({
    length: length.value,
    includeLowercase: includeLowercase.value,
    includeUppercase: includeUppercase.value,
    includeNumbers: includeNumbers.value,
    includeSymbols: includeSymbols.value,
    excludeAmbiguous: excludeAmbiguous.value,
    customChars: customChars.value,
  }))

  const characterPool = computed(() => buildCharacterPool(options.value))

  const isValid = computed(() => characterPool.value.length > 0 && length.value >= 4)

  const entropy = computed(() => calculateEntropy(characterPool.value.length, length.value))

  const entropyInfo = computed(() => getEntropyInfo(entropy.value))

  const passwordCount = computed(() => generatedPasswords.value.length)

  const allPasswordsAsText = computed(() =>
    generatedPasswords.value.map(item => item.password).join('\n'),
  )

  // Actions
  const generateSingle = (): string => generateSecurePassword(characterPool.value, length.value)

  const generate = (): boolean => {
    if (!isValid.value) return false

    const newPasswords = Array.from({ length: count.value }, (_, i) => {
      const password = generateSingle()
      return {
        id: generatedPasswords.value.length + i + 1,
        password,
        strength: calculatePasswordStrength(password),
      }
    })

    generatedPasswords.value = [...newPasswords, ...generatedPasswords.value]
    return true
  }

  const clear = () => {
    generatedPasswords.value = []
  }

  const applyPreset = (preset: PasswordPreset) => {
    const config = PASSWORD_PRESETS[preset]
    if (config.length !== undefined) length.value = config.length
    if (config.includeLowercase !== undefined) includeLowercase.value = config.includeLowercase
    if (config.includeUppercase !== undefined) includeUppercase.value = config.includeUppercase
    if (config.includeNumbers !== undefined) includeNumbers.value = config.includeNumbers
    if (config.includeSymbols !== undefined) includeSymbols.value = config.includeSymbols
    if (config.excludeAmbiguous !== undefined) excludeAmbiguous.value = config.excludeAmbiguous
  }

  return {
    // State
    length,
    count,
    includeLowercase,
    includeUppercase,
    includeNumbers,
    includeSymbols,
    excludeAmbiguous,
    customChars,
    generatedPasswords,

    // Computed
    characterPool,
    isValid,
    entropy,
    entropyInfo,
    passwordCount,
    allPasswordsAsText,

    // Actions
    generate,
    generateSingle,
    clear,
    applyPreset,
  }
}
