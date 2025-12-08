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
  // Replace URL-safe characters and add padding if necessary
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64
  return decodeURIComponent(
    globalThis
      .atob(paddedBase64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
}

export const decodeJwt = (token: string): DecodedJwt => {
  const parts = token.trim().split('.')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('Invalid JWT format: must have 3 parts separated by dots')
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload
    const signature = parts[2]

    return { header, payload, signature }
  } catch {
    throw new Error('Failed to decode JWT: invalid Base64 or JSON')
  }
}

export const formatTimestamp = (timestamp: number | undefined): string => {
  if (!timestamp) return 'N/A'
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss (Z)')
}

export const calculateExpirationInfo = (exp: number): string => {
  const now = Date.now() / 1000
  const diff = exp - now

  if (diff < 0) {
    const absDiff = Math.abs(diff)
    if (absDiff < 60) return `Expired ${Math.floor(absDiff)} seconds ago`
    if (absDiff < 3600) return `Expired ${Math.floor(absDiff / 60)} minutes ago`
    if (absDiff < 86400) return `Expired ${Math.floor(absDiff / 3600)} hours ago`
    return `Expired ${Math.floor(absDiff / 86400)} days ago`
  } else {
    if (diff < 60) return `Expires in ${Math.floor(diff)} seconds`
    if (diff < 3600) return `Expires in ${Math.floor(diff / 60)} minutes`
    if (diff < 86400) return `Expires in ${Math.floor(diff / 3600)} hours`
    return `Expires in ${Math.floor(diff / 86400)} days`
  }
}

export const isTokenExpired = (exp: number | undefined): boolean | null => {
  if (!exp) return null
  return Date.now() / 1000 > exp
}

export const getJwtStats = (token: string): JwtStats | null => {
  if (!token) return null
  const parts = token.trim().split('.')
  return {
    length: token.length,
    parts: parts.length,
    valid: parts.length === 3,
  }
}

export const buildStandardClaims = (payload: JwtPayload): StandardClaim[] => [
  {
    key: 'iss',
    name: 'Issuer',
    description: 'Who issued the token',
    value: payload.iss,
  },
  {
    key: 'sub',
    name: 'Subject',
    description: 'Who the token is about',
    value: payload.sub,
  },
  {
    key: 'aud',
    name: 'Audience',
    description: 'Who the token is intended for',
    value: Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud,
  },
  {
    key: 'exp',
    name: 'Expiration Time',
    description: 'When the token expires',
    value: formatTimestamp(payload.exp),
    isTime: true,
  },
  {
    key: 'nbf',
    name: 'Not Before',
    description: 'When the token becomes valid',
    value: formatTimestamp(payload.nbf),
    isTime: true,
  },
  {
    key: 'iat',
    name: 'Issued At',
    description: 'When the token was issued',
    value: formatTimestamp(payload.iat),
    isTime: true,
  },
  {
    key: 'jti',
    name: 'JWT ID',
    description: 'Unique identifier for the token',
    value: payload.jti,
  },
]

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

    if (!newValue.trim()) return

    try {
      decodedJwt.value = decodeJwt(newValue)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to decode JWT'
    }
  })

  // Computed
  const headerJson = computed(() =>
    decodedJwt.value ? JSON.stringify(decodedJwt.value.header, null, 2) : '',
  )

  const payloadJson = computed(() =>
    decodedJwt.value ? JSON.stringify(decodedJwt.value.payload, null, 2) : '',
  )

  const isExpired = computed(() =>
    decodedJwt.value ? isTokenExpired(decodedJwt.value.payload.exp) : null,
  )

  const expirationInfo = computed(() => {
    if (!decodedJwt.value?.payload.exp) return null
    return calculateExpirationInfo(decodedJwt.value.payload.exp)
  })

  const standardClaims = computed(() =>
    decodedJwt.value ? buildStandardClaims(decodedJwt.value.payload) : [],
  )

  const jwtStats = computed(() => getJwtStats(jwtInput.value))

  const hasInput = computed(() => jwtInput.value.length > 0)

  const hasError = computed(() => error.value.length > 0)

  const isDecoded = computed(() => decodedJwt.value !== null)

  const claimsCount = computed(() =>
    decodedJwt.value ? Object.keys(decodedJwt.value.payload).length : 0,
  )

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
