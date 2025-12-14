import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'

// Types
export interface JwtHeader {
  alg?: string
  typ?: string
  kid?: string
  [key: string]: unknown
}

export interface JwtPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  [key: string]: unknown
}

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
}

export interface StandardClaim {
  key: string
  name: string
  description: string
  value: string | undefined
  isTime?: boolean
}

export interface JwtStats {
  length: number
  parts: number
  valid: boolean
}

// Pure functions
export const base64UrlDecode = (str: string): string => {
  // Early return for empty string
  if (!str) {
    throw new Error('Empty string cannot be decoded')
  }

  // Replace URL-safe characters and add padding if necessary
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  const paddedBase64 = padding ? `${base64}${'='.repeat(4 - padding)}` : base64

  return decodeURIComponent(
    globalThis
      .atob(paddedBase64)
      .split('')
      .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join(''),
  )
}

export const decodeJwt = (token: string): DecodedJwt => {
  // Early return for empty or invalid token
  if (!token?.trim()) {
    throw new Error('JWT token cannot be empty')
  }

  const parts = token.trim().split('.')

  // Early return for invalid format
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: must have 3 parts separated by dots')
  }

  const [headerPart, payloadPart, signaturePart] = parts
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Invalid JWT format: all parts must be non-empty')
  }

  try {
    const header = JSON.parse(base64UrlDecode(headerPart)) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as JwtPayload

    return { header, payload, signature: signaturePart }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to decode JWT: invalid Base64 or JSON'
    throw new Error(message)
  }
}

export const formatTimestamp = (timestamp: number | undefined): string => {
  // Early return for missing timestamp
  if (!timestamp) {
    return 'N/A'
  }

  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss (Z)')
}

const TIME_UNITS = [
  { seconds: 86400, label: 'days' },
  { seconds: 3600, label: 'hours' },
  { seconds: 60, label: 'minutes' },
  { seconds: 1, label: 'seconds' },
] as const

export const calculateExpirationInfo = (exp: number): string => {
  const now = Date.now() / 1000
  const diff = exp - now
  const isExpired = diff < 0
  const absDiff = Math.abs(diff)

  // Find the appropriate time unit using method chaining
  const unit = TIME_UNITS.find(u => absDiff >= u.seconds) ?? TIME_UNITS[TIME_UNITS.length - 1]!
  const value = Math.floor(absDiff / unit.seconds)

  return isExpired ? `Expired ${value} ${unit.label} ago` : `Expires in ${value} ${unit.label}`
}

export const isTokenExpired = (exp: number | undefined): boolean | null => {
  // Early return for missing expiration
  if (!exp) {
    return null
  }

  return Date.now() / 1000 > exp
}

export const getJwtStats = (token: string): JwtStats | null => {
  // Early return for empty token
  if (!token) {
    return null
  }

  const parts = token.trim().split('.')
  return {
    length: token.length,
    parts: parts.length,
    valid: parts.length === 3,
  }
}

const STANDARD_CLAIM_DEFINITIONS = [
  {
    key: 'iss',
    name: 'Issuer',
    description: 'Who issued the token',
    getValue: (payload: JwtPayload) => payload.iss,
  },
  {
    key: 'sub',
    name: 'Subject',
    description: 'Who the token is about',
    getValue: (payload: JwtPayload) => payload.sub,
  },
  {
    key: 'aud',
    name: 'Audience',
    description: 'Who the token is intended for',
    getValue: (payload: JwtPayload) =>
      Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud,
  },
  {
    key: 'exp',
    name: 'Expiration Time',
    description: 'When the token expires',
    getValue: (payload: JwtPayload) => formatTimestamp(payload.exp),
    isTime: true,
  },
  {
    key: 'nbf',
    name: 'Not Before',
    description: 'When the token becomes valid',
    getValue: (payload: JwtPayload) => formatTimestamp(payload.nbf),
    isTime: true,
  },
  {
    key: 'iat',
    name: 'Issued At',
    description: 'When the token was issued',
    getValue: (payload: JwtPayload) => formatTimestamp(payload.iat),
    isTime: true,
  },
  {
    key: 'jti',
    name: 'JWT ID',
    description: 'Unique identifier for the token',
    getValue: (payload: JwtPayload) => payload.jti,
  },
] as const

export const buildStandardClaims = (payload: JwtPayload): StandardClaim[] =>
  STANDARD_CLAIM_DEFINITIONS.map(({ getValue, ...rest }) => ({
    ...rest,
    value: getValue(payload),
  }))

// Sample JWT for demo
export const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// Composable
export const useJwtDecoder = () => {
  // State
  const jwtInput = ref('')
  const error = ref('')
  const decodedJwt = ref<DecodedJwt | null>(null)

  // Auto-decode on input change
  watch(jwtInput, newValue => {
    error.value = ''
    decodedJwt.value = null

    // Early return for empty input
    if (!newValue.trim()) {
      return
    }

    try {
      decodedJwt.value = decodeJwt(newValue)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to decode JWT'
    }
  })

  // Computed
  const headerJson = computed(() =>
    decodedJwt.value?.header ? JSON.stringify(decodedJwt.value.header, null, 2) : '',
  )

  const payloadJson = computed(() =>
    decodedJwt.value?.payload ? JSON.stringify(decodedJwt.value.payload, null, 2) : '',
  )

  const isExpired = computed(() => isTokenExpired(decodedJwt.value?.payload.exp))

  const expirationInfo = computed(() => {
    const exp = decodedJwt.value?.payload.exp
    // Early return for missing expiration
    if (!exp) {
      return null
    }
    return calculateExpirationInfo(exp)
  })

  const standardClaims = computed(() =>
    decodedJwt.value ? buildStandardClaims(decodedJwt.value.payload) : [],
  )

  const jwtStats = computed(() => getJwtStats(jwtInput.value))

  const hasInput = computed(() => jwtInput.value.length > 0)

  const hasError = computed(() => error.value.length > 0)

  const isDecoded = computed(() => decodedJwt.value !== null)

  const claimsCount = computed(() => Object.keys(decodedJwt.value?.payload ?? {}).length)

  // Actions
  const loadSample = () => {
    jwtInput.value = SAMPLE_JWT
  }

  const clear = () => {
    jwtInput.value = ''
    error.value = ''
    decodedJwt.value = null
  }

  const decode = (token: string): DecodedJwt | null => {
    jwtInput.value = token
    return decodedJwt.value
  }

  return {
    // State
    jwtInput,
    error,
    decodedJwt,

    // Computed
    headerJson,
    payloadJson,
    isExpired,
    expirationInfo,
    standardClaims,
    jwtStats,
    hasInput,
    hasError,
    isDecoded,
    claimsCount,

    // Actions
    loadSample,
    clear,
    decode,
  }
}
