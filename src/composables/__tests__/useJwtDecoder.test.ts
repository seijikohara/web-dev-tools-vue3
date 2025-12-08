import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  base64UrlDecode,
  decodeJwt,
  formatTimestamp,
  calculateExpirationInfo,
  isTokenExpired,
  getJwtStats,
  buildStandardClaims,
  useJwtDecoder,
  SAMPLE_JWT,
} from '../useJwtDecoder'

// Test JWT tokens
const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const _JWT_WITH_EXPIRY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.4Adcj3UFYzPUVaVF43FmMo'

describe('useJwtDecoder', () => {
  describe('base64UrlDecode', () => {
    it('should decode standard base64url string', () => {
      // 'Hello' in base64url
      const decoded = base64UrlDecode('SGVsbG8')
      expect(decoded).toBe('Hello')
    })

    it('should handle URL-safe characters (- and _)', () => {
      // base64url uses - instead of + and _ instead of /
      const decoded = base64UrlDecode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      const parsed = JSON.parse(decoded)
      expect.soft(parsed.alg).toBe('HS256')
      expect.soft(parsed.typ).toBe('JWT')
    })

    it('should add padding when needed', () => {
      // 'Test' without padding
      const decoded = base64UrlDecode('VGVzdA')
      expect(decoded).toBe('Test')
    })

    it('should handle UTF-8 encoded strings', () => {
      // '日本語' in base64url
      const decoded = base64UrlDecode('5pel5pys6Kqe')
      expect(decoded).toBe('日本語')
    })
  })

  describe('decodeJwt', () => {
    it('should decode a valid JWT', () => {
      const result = decodeJwt(VALID_JWT)
      expect.soft(result.header.alg).toBe('HS256')
      expect.soft(result.header.typ).toBe('JWT')
      expect.soft(result.payload.sub).toBe('1234567890')
      expect.soft(result.payload.name).toBe('John Doe')
      expect.soft(result.payload.iat).toBe(1516239022)
      expect.soft(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    })

    it('should throw error for JWT with less than 3 parts', () => {
      expect(() => decodeJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0')).toThrow(
        'Invalid JWT format: must have 3 parts separated by dots',
      )
    })

    it('should throw error for JWT with more than 3 parts', () => {
      expect(() => decodeJwt('part1.part2.part3.part4')).toThrow('Invalid JWT format')
    })

    it('should throw error for empty string', () => {
      expect(() => decodeJwt('')).toThrow('Invalid JWT format')
    })

    it('should throw error for invalid base64', () => {
      expect(() => decodeJwt('not.valid.jwt')).toThrow('Failed to decode JWT')
    })

    it('should handle JWT with whitespace', () => {
      const result = decodeJwt(`  ${VALID_JWT}  `)
      expect(result.header.alg).toBe('HS256')
    })
  })

  describe('formatTimestamp', () => {
    it('should return N/A for undefined timestamp', () => {
      expect(formatTimestamp(undefined)).toBe('N/A')
    })

    it('should return N/A for zero timestamp', () => {
      expect(formatTimestamp(0)).toBe('N/A')
    })

    it('should format valid timestamp', () => {
      const timestamp = 1516239022 // 2018-01-18 01:30:22 UTC
      const formatted = formatTimestamp(timestamp)
      expect.soft(formatted).toContain('2018')
      expect.soft(formatted).toContain('01')
      expect.soft(formatted).toContain('18')
    })
  })

  describe('calculateExpirationInfo', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should show "seconds ago" for recently expired token', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now - 30)
      expect(result).toContain('Expired')
      expect(result).toContain('seconds ago')
    })

    it('should show "minutes ago" for token expired less than an hour ago', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now - 600) // 10 minutes
      expect.soft(result).toContain('Expired')
      expect.soft(result).toContain('minutes ago')
    })

    it('should show "hours ago" for token expired less than a day ago', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now - 7200) // 2 hours
      expect.soft(result).toContain('Expired')
      expect.soft(result).toContain('hours ago')
    })

    it('should show "days ago" for token expired more than a day ago', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now - 172800) // 2 days
      expect.soft(result).toContain('Expired')
      expect.soft(result).toContain('days ago')
    })

    it('should show "Expires in seconds" for token expiring soon', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now + 30)
      expect.soft(result).toContain('Expires in')
      expect.soft(result).toContain('seconds')
    })

    it('should show "Expires in minutes" for token expiring in less than an hour', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now + 600) // 10 minutes
      expect.soft(result).toContain('Expires in')
      expect.soft(result).toContain('minutes')
    })

    it('should show "Expires in hours" for token expiring in less than a day', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now + 7200) // 2 hours
      expect.soft(result).toContain('Expires in')
      expect.soft(result).toContain('hours')
    })

    it('should show "Expires in days" for token expiring in more than a day', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      const result = calculateExpirationInfo(now + 172800) // 2 days
      expect.soft(result).toContain('Expires in')
      expect.soft(result).toContain('days')
    })
  })

  describe('isTokenExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return null for undefined exp', () => {
      expect(isTokenExpired(undefined)).toBeNull()
    })

    it('should return true for expired token', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      expect(isTokenExpired(now - 100)).toBe(true)
    })

    it('should return false for valid token', () => {
      const now = Date.now() / 1000
      vi.setSystemTime(Date.now())
      expect(isTokenExpired(now + 100)).toBe(false)
    })
  })

  describe('getJwtStats', () => {
    it('should return null for empty string', () => {
      expect(getJwtStats('')).toBeNull()
    })

    it('should return stats for valid JWT', () => {
      const stats = getJwtStats(VALID_JWT)
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.length).toBe(VALID_JWT.length)
      expect.soft(stats!.parts).toBe(3)
      expect.soft(stats!.valid).toBe(true)
    })

    it('should return invalid for JWT with wrong number of parts', () => {
      const stats = getJwtStats('header.payload')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.parts).toBe(2)
      expect.soft(stats!.valid).toBe(false)
    })

    it('should handle whitespace in token', () => {
      const stats = getJwtStats('  header.payload.signature  ')
      expect.soft(stats).not.toBeNull()
      expect.soft(stats!.parts).toBe(3)
      expect.soft(stats!.valid).toBe(true)
    })
  })

  describe('buildStandardClaims', () => {
    it('should build claims for empty payload', () => {
      const claims = buildStandardClaims({})
      expect(claims.length).toBe(7)
    })

    it('should include all standard claim keys', () => {
      const claims = buildStandardClaims({})
      const keys = claims.map(c => c.key)
      expect.soft(keys).toContain('iss')
      expect.soft(keys).toContain('sub')
      expect.soft(keys).toContain('aud')
      expect.soft(keys).toContain('exp')
      expect.soft(keys).toContain('nbf')
      expect.soft(keys).toContain('iat')
      expect.soft(keys).toContain('jti')
    })

    it('should format claim values correctly', () => {
      const payload = {
        iss: 'https://example.com',
        sub: 'user123',
        aud: 'https://api.example.com',
        exp: 1516242622,
        iat: 1516239022,
        jti: 'token-id-123',
      }
      const claims = buildStandardClaims(payload)

      const issClaim = claims.find(c => c.key === 'iss')
      expect.soft(issClaim?.value).toBe('https://example.com')

      const subClaim = claims.find(c => c.key === 'sub')
      expect.soft(subClaim?.value).toBe('user123')
    })

    it('should handle array audience', () => {
      const payload = {
        aud: ['https://api1.example.com', 'https://api2.example.com'],
      }
      const claims = buildStandardClaims(payload)
      const audClaim = claims.find(c => c.key === 'aud')
      expect(audClaim?.value).toBe('https://api1.example.com, https://api2.example.com')
    })

    it('should mark time claims with isTime flag', () => {
      const claims = buildStandardClaims({})
      const timeClaims = claims.filter(c => c.isTime)
      expect(timeClaims.length).toBe(3) // exp, nbf, iat
    })
  })

  describe('SAMPLE_JWT constant', () => {
    it('should be a valid JWT', () => {
      const result = decodeJwt(SAMPLE_JWT)
      expect.soft(result.header.alg).toBe('HS256')
      expect.soft(result.header.typ).toBe('JWT')
      expect.soft(result.payload.sub).toBeDefined()
    })
  })

  describe('useJwtDecoder composable', () => {
    let decoder: ReturnType<typeof useJwtDecoder>

    beforeEach(() => {
      decoder = useJwtDecoder()
    })

    it('should initialize with empty values', () => {
      expect.soft(decoder.jwtInput.value).toBe('')
      expect.soft(decoder.error.value).toBe('')
      expect.soft(decoder.decodedJwt.value).toBeNull()
      expect.soft(decoder.hasInput.value).toBe(false)
      expect.soft(decoder.hasError.value).toBe(false)
      expect.soft(decoder.isDecoded.value).toBe(false)
    })

    it('should decode JWT when input changes', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      expect.soft(decoder.decodedJwt.value).not.toBeNull()
      expect.soft(decoder.hasError.value).toBe(false)
      expect.soft(decoder.isDecoded.value).toBe(true)
    })

    it('should set error for invalid JWT', async () => {
      decoder.jwtInput.value = 'invalid-jwt'
      await Promise.resolve()

      expect.soft(decoder.decodedJwt.value).toBeNull()
      expect.soft(decoder.hasError.value).toBe(true)
      expect.soft(decoder.error.value).toContain('Invalid JWT format')
    })

    it('should compute headerJson correctly', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      const header = JSON.parse(decoder.headerJson.value)
      expect.soft(header.alg).toBe('HS256')
      expect.soft(header.typ).toBe('JWT')
    })

    it('should compute payloadJson correctly', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      const payload = JSON.parse(decoder.payloadJson.value)
      expect.soft(payload.sub).toBe('1234567890')
      expect.soft(payload.name).toBe('John Doe')
    })

    it('should compute jwtStats correctly', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      expect.soft(decoder.jwtStats.value).not.toBeNull()
      expect.soft(decoder.jwtStats.value?.parts).toBe(3)
      expect.soft(decoder.jwtStats.value?.valid).toBe(true)
    })

    it('should compute standardClaims correctly', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      expect(decoder.standardClaims.value.length).toBe(7)
    })

    it('should compute claimsCount correctly', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      expect(decoder.claimsCount.value).toBeGreaterThan(0)
    })

    it('should load sample JWT', () => {
      decoder.loadSample()
      expect(decoder.jwtInput.value).toBe(SAMPLE_JWT)
    })

    it('should clear all values', async () => {
      decoder.jwtInput.value = VALID_JWT
      await Promise.resolve()

      decoder.clear()
      expect.soft(decoder.jwtInput.value).toBe('')
      expect.soft(decoder.error.value).toBe('')
      expect.soft(decoder.decodedJwt.value).toBeNull()
    })

    it('should decode using decode method', async () => {
      decoder.decode(VALID_JWT)
      await Promise.resolve()

      expect.soft(decoder.decodedJwt.value).not.toBeNull()
      expect.soft(decoder.jwtInput.value).toBe(VALID_JWT)
    })

    it('should return empty strings for empty input', () => {
      expect.soft(decoder.headerJson.value).toBe('')
      expect.soft(decoder.payloadJson.value).toBe('')
      expect.soft(decoder.standardClaims.value).toEqual([])
    })
  })
})
