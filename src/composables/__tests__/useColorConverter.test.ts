import { describe, it, expect, beforeEach } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  rgbToCmyk,
  formatRgbString,
  formatHslString,
  formatCmykString,
  formatRgbaString,
  formatHslaString,
  formatHex8String,
  calculateContrastColor,
  expandShorthandHex,
  parseHexInput,
  parseRgbInput,
  parseHslInput,
  useColorConverter,
  COLOR_PALETTE,
  DEFAULT_COLOR,
} from '../useColorConverter'

describe('useColorConverter', () => {
  describe('Constants', () => {
    it('should have color palette', () => {
      expect(COLOR_PALETTE.length).toBeGreaterThan(0)
    })

    it('should have valid palette colors', () => {
      for (const color of COLOR_PALETTE) {
        expect.soft(color.name).toBeTruthy()
        expect.soft(color.hex).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    })

    it('should have default color', () => {
      expect.soft(DEFAULT_COLOR.hex).toBeTruthy()
      expect.soft(DEFAULT_COLOR.rgb).toBeTruthy()
      expect.soft(DEFAULT_COLOR.hsl).toBeTruthy()
    })
  })

  describe('hexToRgb', () => {
    it('should convert hex with hash', () => {
      const result = hexToRgb('#ff0000')
      expect.soft(result?.r).toBe(255)
      expect.soft(result?.g).toBe(0)
      expect.soft(result?.b).toBe(0)
    })

    it('should convert hex without hash', () => {
      const result = hexToRgb('00ff00')
      expect.soft(result?.r).toBe(0)
      expect.soft(result?.g).toBe(255)
      expect.soft(result?.b).toBe(0)
    })

    it('should return null for invalid hex', () => {
      expect.soft(hexToRgb('invalid')).toBeNull()
      expect.soft(hexToRgb('#fff')).toBeNull() // shorthand not supported directly
      expect.soft(hexToRgb('')).toBeNull()
    })

    it('should handle uppercase', () => {
      const result = hexToRgb('#FF00FF')
      expect.soft(result?.r).toBe(255)
      expect.soft(result?.g).toBe(0)
      expect.soft(result?.b).toBe(255)
    })
  })

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
    })

    it('should pad single digit values', () => {
      expect(rgbToHex(0, 0, 15)).toBe('#00000f')
    })

    it('should handle all zeros', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
    })

    it('should handle all max values', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
    })
  })

  describe('rgbToHsl', () => {
    it('should convert red to HSL', () => {
      const result = rgbToHsl(255, 0, 0)
      expect.soft(result.h).toBe(0)
      expect.soft(result.s).toBe(100)
      expect.soft(result.l).toBe(50)
    })

    it('should convert green to HSL', () => {
      const result = rgbToHsl(0, 255, 0)
      expect.soft(result.h).toBe(120)
      expect.soft(result.s).toBe(100)
      expect.soft(result.l).toBe(50)
    })

    it('should convert blue to HSL', () => {
      const result = rgbToHsl(0, 0, 255)
      expect.soft(result.h).toBe(240)
      expect.soft(result.s).toBe(100)
      expect.soft(result.l).toBe(50)
    })

    it('should convert gray to HSL (no saturation)', () => {
      const result = rgbToHsl(128, 128, 128)
      expect.soft(result.h).toBe(0)
      expect.soft(result.s).toBe(0)
    })

    it('should convert white to HSL', () => {
      const result = rgbToHsl(255, 255, 255)
      expect.soft(result.l).toBe(100)
    })

    it('should convert black to HSL', () => {
      const result = rgbToHsl(0, 0, 0)
      expect.soft(result.l).toBe(0)
    })
  })

  describe('hslToRgb', () => {
    it('should convert red HSL to RGB', () => {
      const result = hslToRgb(0, 100, 50)
      expect.soft(result.r).toBe(255)
      expect.soft(result.g).toBe(0)
      expect.soft(result.b).toBe(0)
    })

    it('should convert green HSL to RGB', () => {
      const result = hslToRgb(120, 100, 50)
      expect.soft(result.r).toBe(0)
      expect.soft(result.g).toBe(255)
      expect.soft(result.b).toBe(0)
    })

    it('should convert gray (no saturation)', () => {
      const result = hslToRgb(0, 0, 50)
      expect.soft(result.r).toBe(128)
      expect.soft(result.g).toBe(128)
      expect.soft(result.b).toBe(128)
    })

    it('should be reversible with rgbToHsl', () => {
      const rgb = { r: 100, g: 150, b: 200 }
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      const backToRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
      expect.soft(Math.abs(backToRgb.r - rgb.r)).toBeLessThanOrEqual(1)
      expect.soft(Math.abs(backToRgb.g - rgb.g)).toBeLessThanOrEqual(1)
      expect.soft(Math.abs(backToRgb.b - rgb.b)).toBeLessThanOrEqual(1)
    })
  })

  describe('rgbToHsv', () => {
    it('should convert red to HSV', () => {
      const result = rgbToHsv(255, 0, 0)
      expect.soft(result.h).toBe(0)
      expect.soft(result.s).toBe(100)
      expect.soft(result.v).toBe(100)
    })

    it('should convert green to HSV', () => {
      const result = rgbToHsv(0, 255, 0)
      expect.soft(result.h).toBe(120)
    })

    it('should handle black', () => {
      const result = rgbToHsv(0, 0, 0)
      expect.soft(result.v).toBe(0)
      expect.soft(result.s).toBe(0)
    })
  })

  describe('rgbToCmyk', () => {
    it('should convert red to CMYK', () => {
      const result = rgbToCmyk(255, 0, 0)
      expect.soft(result.c).toBe(0)
      expect.soft(result.m).toBe(100)
      expect.soft(result.y).toBe(100)
      expect.soft(result.k).toBe(0)
    })

    it('should convert white to CMYK', () => {
      const result = rgbToCmyk(255, 255, 255)
      expect.soft(result.c).toBe(0)
      expect.soft(result.m).toBe(0)
      expect.soft(result.y).toBe(0)
      expect.soft(result.k).toBe(0)
    })

    it('should convert black to CMYK', () => {
      const result = rgbToCmyk(0, 0, 0)
      expect.soft(result.k).toBe(100)
    })
  })

  describe('format functions', () => {
    it('should format RGB string', () => {
      expect(formatRgbString({ r: 255, g: 128, b: 0 })).toBe('rgb(255, 128, 0)')
    })

    it('should format HSL string', () => {
      expect(formatHslString({ h: 180, s: 50, l: 60 })).toBe('hsl(180, 50%, 60%)')
    })

    it('should format CMYK string', () => {
      expect(formatCmykString({ c: 10, m: 20, y: 30, k: 40 })).toBe('cmyk(10%, 20%, 30%, 40%)')
    })

    it('should format RGBA string', () => {
      expect(formatRgbaString({ r: 255, g: 128, b: 0 }, 50)).toBe('rgba(255, 128, 0, 0.5)')
    })

    it('should format HSLA string', () => {
      expect(formatHslaString({ h: 180, s: 50, l: 60 }, 75)).toBe('hsla(180, 50%, 60%, 0.75)')
    })

    it('should format HEX8 string', () => {
      expect(formatHex8String('#ff0000', 50)).toBe('#ff000080')
    })
  })

  describe('calculateContrastColor', () => {
    it('should return black for light colors', () => {
      expect(calculateContrastColor({ r: 255, g: 255, b: 255 })).toBe('#000000')
    })

    it('should return white for dark colors', () => {
      expect(calculateContrastColor({ r: 0, g: 0, b: 0 })).toBe('#ffffff')
    })

    it('should return black for yellow', () => {
      expect(calculateContrastColor({ r: 255, g: 255, b: 0 })).toBe('#000000')
    })

    it('should return white for blue', () => {
      expect(calculateContrastColor({ r: 0, g: 0, b: 255 })).toBe('#ffffff')
    })
  })

  describe('expandShorthandHex', () => {
    it('should expand 3-digit hex', () => {
      expect(expandShorthandHex('#fff')).toBe('#ffffff')
    })

    it('should expand without hash', () => {
      expect(expandShorthandHex('abc')).toBe('#aabbcc')
    })

    it('should not change 6-digit hex', () => {
      expect(expandShorthandHex('#ff00ff')).toBe('#ff00ff')
    })

    it('should handle whitespace', () => {
      expect(expandShorthandHex('  #abc  ')).toBe('#aabbcc')
    })
  })

  describe('parseHexInput', () => {
    it('should parse valid hex', () => {
      const result = parseHexInput('#ff0000')
      expect.soft(result?.r).toBe(255)
      expect.soft(result?.g).toBe(0)
      expect.soft(result?.b).toBe(0)
    })

    it('should parse shorthand hex', () => {
      const result = parseHexInput('#f00')
      expect.soft(result?.r).toBe(255)
      expect.soft(result?.g).toBe(0)
      expect.soft(result?.b).toBe(0)
    })
  })

  describe('parseRgbInput', () => {
    it('should parse rgb() format', () => {
      const result = parseRgbInput('rgb(255, 128, 64)')
      expect.soft(result?.r).toBe(255)
      expect.soft(result?.g).toBe(128)
      expect.soft(result?.b).toBe(64)
    })

    it('should parse rgba() format', () => {
      const result = parseRgbInput('rgba(100, 150, 200, 0.5)')
      expect.soft(result?.r).toBe(100)
      expect.soft(result?.g).toBe(150)
      expect.soft(result?.b).toBe(200)
    })

    it('should clamp values to 0-255', () => {
      // The regex only matches positive integers (\d+), so negative values won't match
      const result = parseRgbInput('rgb(300, 50, 128)')
      expect.soft(result?.r).toBe(255) // clamped from 300
      expect.soft(result?.g).toBe(50)
      expect.soft(result?.b).toBe(128)
    })

    it('should return null for invalid input', () => {
      expect(parseRgbInput('invalid')).toBeNull()
    })
  })

  describe('parseHslInput', () => {
    it('should parse hsl() format', () => {
      const result = parseHslInput('hsl(0, 100%, 50%)')
      expect.soft(result?.r).toBe(255)
      expect.soft(result?.g).toBe(0)
      expect.soft(result?.b).toBe(0)
    })

    it('should parse hsla() format', () => {
      const result = parseHslInput('hsla(120, 100, 50, 0.5)')
      expect.soft(result?.r).toBe(0)
      expect.soft(result?.g).toBe(255)
      expect.soft(result?.b).toBe(0)
    })

    it('should return null for invalid input', () => {
      expect(parseHslInput('invalid')).toBeNull()
    })
  })

  describe('useColorConverter composable', () => {
    let converter: ReturnType<typeof useColorConverter>

    beforeEach(() => {
      converter = useColorConverter()
    })

    it('should initialize with default color', () => {
      expect.soft(converter.hex.value).toBe(DEFAULT_COLOR.hex)
      expect.soft(converter.rgb.value.r).toBe(DEFAULT_COLOR.rgb.r)
      expect.soft(converter.rgb.value.g).toBe(DEFAULT_COLOR.rgb.g)
      expect.soft(converter.rgb.value.b).toBe(DEFAULT_COLOR.rgb.b)
    })

    it('should initialize alpha to 100', () => {
      expect(converter.alpha.value).toBe(100)
    })

    it('should update all values from RGB', async () => {
      converter.updateFromRgb(255, 0, 0)
      await Promise.resolve()

      expect.soft(converter.hex.value).toBe('#ff0000')
      expect.soft(converter.rgb.value).toEqual({ r: 255, g: 0, b: 0 })
      expect.soft(converter.hsl.value.h).toBe(0)
      expect.soft(converter.hsl.value.s).toBe(100)
    })

    it('should compute RGBA string', async () => {
      converter.updateFromRgb(255, 128, 64)
      converter.alpha.value = 50
      await Promise.resolve()

      expect(converter.rgbaString.value).toBe('rgba(255, 128, 64, 0.5)')
    })

    it('should compute HSLA string', async () => {
      converter.updateFromRgb(255, 0, 0)
      converter.alpha.value = 75
      await Promise.resolve()

      expect(converter.hslaString.value).toContain('hsla')
      expect(converter.hslaString.value).toContain('0.75')
    })

    it('should compute HEX8 string', async () => {
      converter.updateFromRgb(255, 0, 0)
      converter.alpha.value = 50
      await Promise.resolve()

      expect(converter.hex8String.value).toBe('#ff000080')
    })

    it('should compute CMYK', async () => {
      converter.updateFromRgb(255, 0, 0)
      await Promise.resolve()

      expect.soft(converter.cmyk.value.c).toBe(0)
      expect.soft(converter.cmyk.value.m).toBe(100)
      expect.soft(converter.cmyk.value.y).toBe(100)
      expect.soft(converter.cmyk.value.k).toBe(0)
    })

    it('should compute contrast color', async () => {
      converter.updateFromRgb(0, 0, 0)
      await Promise.resolve()
      expect.soft(converter.contrastColor.value).toBe('#ffffff')

      converter.updateFromRgb(255, 255, 255)
      await Promise.resolve()
      expect.soft(converter.contrastColor.value).toBe('#000000')
    })

    it('should apply hex input', async () => {
      converter.hexInput.value = '#00ff00'
      converter.applyHexInput()
      await Promise.resolve()

      expect.soft(converter.rgb.value.r).toBe(0)
      expect.soft(converter.rgb.value.g).toBe(255)
      expect.soft(converter.rgb.value.b).toBe(0)
    })

    it('should apply RGB input', async () => {
      converter.rgbInput.value = 'rgb(0, 0, 255)'
      converter.applyRgbInput()
      await Promise.resolve()

      expect.soft(converter.rgb.value.r).toBe(0)
      expect.soft(converter.rgb.value.g).toBe(0)
      expect.soft(converter.rgb.value.b).toBe(255)
    })

    it('should apply HSL input', async () => {
      converter.hslInput.value = 'hsl(120, 100%, 50%)'
      converter.applyHslInput()
      await Promise.resolve()

      expect.soft(converter.rgb.value.g).toBe(255)
    })

    it('should select palette color', async () => {
      converter.selectPaletteColor('#ff0000')
      await Promise.resolve()

      expect.soft(converter.hex.value).toBe('#ff0000')
    })
  })
})
