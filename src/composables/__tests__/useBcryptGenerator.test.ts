import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getRoundInfo,
  calculatePasswordStrength,
  formatElapsedTime,
  isHighCostOperation,
  useBcryptOverlay,
  ROUND_TIME_ESTIMATES,
  DEFAULT_ROUND_INFO,
  MIN_ROUNDS,
  MAX_ROUNDS,
  DEFAULT_ROUNDS,
  HIGH_COST_THRESHOLD,
} from '../useBcryptGenerator'

describe('useBcryptGenerator', () => {
  describe('Constants', () => {
    it('should have correct MIN_ROUNDS', () => {
      expect(MIN_ROUNDS).toBe(4)
    })

    it('should have correct MAX_ROUNDS', () => {
      expect(MAX_ROUNDS).toBe(20)
    })

    it('should have correct DEFAULT_ROUNDS', () => {
      expect(DEFAULT_ROUNDS).toBe(10)
    })

    it('should have correct HIGH_COST_THRESHOLD', () => {
      expect(HIGH_COST_THRESHOLD).toBe(12)
    })

    it('should have ROUND_TIME_ESTIMATES for all round values', () => {
      for (let i = 4; i <= 20; i++) {
        expect.soft(ROUND_TIME_ESTIMATES[i]).toBeDefined()
        expect.soft(ROUND_TIME_ESTIMATES[i].time).toBeDefined()
        expect.soft(ROUND_TIME_ESTIMATES[i].security).toBeDefined()
        expect.soft(ROUND_TIME_ESTIMATES[i].severity).toBeDefined()
      }
    })

    it('should have valid DEFAULT_ROUND_INFO', () => {
      expect.soft(DEFAULT_ROUND_INFO.time).toBe('unknown')
      expect.soft(DEFAULT_ROUND_INFO.security).toBe('Unknown')
      expect.soft(DEFAULT_ROUND_INFO.severity).toBe('secondary')
    })
  })

  describe('getRoundInfo', () => {
    it('should return correct info for round 4', () => {
      const info = getRoundInfo(4)
      expect.soft(info.time).toBe('~2ms')
      expect.soft(info.security).toBe('Very Weak')
      expect.soft(info.severity).toBe('danger')
    })

    it('should return correct info for round 10', () => {
      const info = getRoundInfo(10)
      expect.soft(info.time).toBe('~120ms')
      expect.soft(info.security).toBe('Good')
      expect.soft(info.severity).toBe('success')
    })

    it('should return correct info for round 12', () => {
      const info = getRoundInfo(12)
      expect.soft(info.time).toBe('~500ms')
      expect.soft(info.security).toBe('Strong')
      expect.soft(info.severity).toBe('success')
    })

    it('should return correct info for round 16', () => {
      const info = getRoundInfo(16)
      expect.soft(info.time).toBe('~8s')
      expect.soft(info.security).toBe('Extreme')
      expect.soft(info.severity).toBe('contrast')
    })

    it('should return correct info for round 20', () => {
      const info = getRoundInfo(20)
      expect.soft(info.time).toBe('~2min')
      expect.soft(info.security).toBe('Maximum')
      expect.soft(info.severity).toBe('contrast')
    })

    it('should return default info for invalid round', () => {
      const info = getRoundInfo(100)
      expect(info).toEqual(DEFAULT_ROUND_INFO)
    })

    it('should return default info for negative round', () => {
      const info = getRoundInfo(-1)
      expect(info).toEqual(DEFAULT_ROUND_INFO)
    })
  })

  describe('calculatePasswordStrength', () => {
    it('should return null for empty password', () => {
      expect(calculatePasswordStrength('')).toBeNull()
    })

    it('should return Weak for very short password', () => {
      const result = calculatePasswordStrength('abc')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.label).toBe('Weak')
      expect.soft(result!.severity).toBe('danger')
    })

    it('should return Weak for short lowercase only password', () => {
      const result = calculatePasswordStrength('password')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.label).toBe('Weak')
      expect.soft(result!.severity).toBe('danger')
    })

    it('should return Fair for password with mixed case', () => {
      const result = calculatePasswordStrength('Password')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.label).toBe('Fair')
      expect.soft(result!.severity).toBe('warn')
    })

    it('should return Good for password with mixed case and numbers', () => {
      const result = calculatePasswordStrength('Password123')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.label).toBe('Good')
      expect.soft(result!.severity).toBe('info')
    })

    it('should return Strong for complex password', () => {
      const result = calculatePasswordStrength('Password123!')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.label).toBe('Strong')
      expect.soft(result!.severity).toBe('success')
    })

    it('should return Strong for long complex password', () => {
      const result = calculatePasswordStrength('MySecure@Pass123')
      expect.soft(result).not.toBeNull()
      expect.soft(result!.label).toBe('Strong')
      expect.soft(result!.severity).toBe('success')
    })
  })

  describe('formatElapsedTime', () => {
    it('should format milliseconds under 1000', () => {
      expect.soft(formatElapsedTime(0)).toBe('0ms')
      expect.soft(formatElapsedTime(100)).toBe('100ms')
      expect.soft(formatElapsedTime(500)).toBe('500ms')
      expect.soft(formatElapsedTime(999)).toBe('999ms')
    })

    it('should format as seconds for 1000ms and above', () => {
      expect.soft(formatElapsedTime(1000)).toBe('1.0s')
      expect.soft(formatElapsedTime(1500)).toBe('1.5s')
      expect.soft(formatElapsedTime(2000)).toBe('2.0s')
      expect.soft(formatElapsedTime(10000)).toBe('10.0s')
    })

    it('should handle decimal precision correctly', () => {
      expect.soft(formatElapsedTime(1234)).toBe('1.2s')
      expect.soft(formatElapsedTime(1567)).toBe('1.6s')
    })
  })

  describe('isHighCostOperation', () => {
    it('should return false for rounds below threshold', () => {
      expect.soft(isHighCostOperation(4)).toBe(false)
      expect.soft(isHighCostOperation(10)).toBe(false)
      expect.soft(isHighCostOperation(11)).toBe(false)
    })

    it('should return true for rounds at or above threshold', () => {
      expect.soft(isHighCostOperation(12)).toBe(true)
      expect.soft(isHighCostOperation(15)).toBe(true)
      expect.soft(isHighCostOperation(20)).toBe(true)
    })
  })

  // Note: BcryptWorkerManager and useBcryptGenerator tests are skipped
  // because they depend on Web Workers which are not available in the test environment.
  // These are integration-level tests and should be tested with E2E tests.

  describe('useBcryptOverlay composable', () => {
    let overlay: ReturnType<typeof useBcryptOverlay>

    beforeEach(() => {
      vi.useFakeTimers()
      overlay = useBcryptOverlay()
    })

    afterEach(() => {
      overlay.hide()
      vi.useRealTimers()
    })

    it('should initialize with default values', () => {
      expect.soft(overlay.showOverlay.value).toBe(false)
      expect.soft(overlay.elapsedTime.value).toBe(0)
      expect.soft(overlay.formattedElapsedTime.value).toBe('0ms')
    })

    it('should show overlay and start timer', () => {
      overlay.show()
      expect(overlay.showOverlay.value).toBe(true)
    })

    it('should hide overlay and stop timer', () => {
      overlay.show()
      overlay.hide()
      expect(overlay.showOverlay.value).toBe(false)
    })

    it('should increment elapsed time', () => {
      overlay.show()
      expect.soft(overlay.elapsedTime.value).toBe(0)

      vi.advanceTimersByTime(100)
      expect.soft(overlay.elapsedTime.value).toBe(100)

      vi.advanceTimersByTime(100)
      expect.soft(overlay.elapsedTime.value).toBe(200)
    })

    it('should format elapsed time correctly', () => {
      overlay.show()

      vi.advanceTimersByTime(500)
      expect.soft(overlay.formattedElapsedTime.value).toBe('500ms')

      vi.advanceTimersByTime(600)
      expect.soft(overlay.formattedElapsedTime.value).toBe('1.1s')
    })

    it('should reset elapsed time on show', () => {
      overlay.show()
      vi.advanceTimersByTime(500)
      expect.soft(overlay.elapsedTime.value).toBe(500)

      overlay.hide()
      overlay.show()
      expect.soft(overlay.elapsedTime.value).toBe(0)
    })

    it('should stop incrementing after hide', () => {
      overlay.show()
      vi.advanceTimersByTime(300)
      expect.soft(overlay.elapsedTime.value).toBe(300)

      overlay.hide()
      vi.advanceTimersByTime(300)
      expect.soft(overlay.elapsedTime.value).toBe(300) // Should not change
    })
  })
})
