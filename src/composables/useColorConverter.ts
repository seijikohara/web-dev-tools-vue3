import { ref, computed, watch } from 'vue'

// Types
export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

export interface CMYK {
  c: number
  m: number
  y: number
  k: number
}

export interface PaletteColor {
  name: string
  hex: string
}

// Constants
export const COLOR_PALETTE: PaletteColor[] = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Slate', hex: '#64748b' },
]

export const DEFAULT_COLOR = {
  hex: '#3b82f6',
  rgb: { r: 59, g: 130, b: 246 },
  hsl: { h: 217, s: 91, l: 60 },
  hsv: { h: 217, s: 76, v: 96 },
}

// Pure conversion functions
export const hexToRgb = (hexValue: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexValue)
  if (!result?.[1] || !result[2] || !result[3]) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  const computeHue = (): number => {
    switch (max) {
      case rNorm:
        return ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6
      case gNorm:
        return ((bNorm - rNorm) / d + 2) / 6
      case bNorm:
        return ((rNorm - gNorm) / d + 4) / 6
      default:
        return 0
    }
  }

  return {
    h: Math.round(computeHue() * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export const hslToRgb = (h: number, s: number, l: number): RGB => {
  const hNorm = h / 360
  const sNorm = s / 100
  const lNorm = l / 100

  if (sNorm === 0) {
    const gray = Math.round(lNorm * 255)
    return { r: gray, g: gray, b: gray }
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    const tNorm = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm
    if (tNorm < 1 / 2) return q
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6
    return p
  }

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm
  const p = 2 * lNorm - q

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  }
}

export const rgbToHsv = (r: number, g: number, b: number): HSV => {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max

  if (max === min) {
    return { h: 0, s: Math.round(s * 100), v: Math.round(v * 100) }
  }

  const computeHue = (): number => {
    switch (max) {
      case rNorm:
        return ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6
      case gNorm:
        return ((bNorm - rNorm) / d + 2) / 6
      case bNorm:
        return ((rNorm - gNorm) / d + 4) / 6
      default:
        return 0
    }
  }

  return {
    h: Math.round(computeHue() * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

export const rgbToCmyk = (r: number, g: number, b: number): CMYK => {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const k = 1 - Math.max(rNorm, gNorm, bNorm)
  const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k)
  const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k)
  const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

// Format string builders
export const formatRgbString = (rgb: RGB): string => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`

export const formatHslString = (hsl: HSL): string => `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`

export const formatCmykString = (cmyk: CMYK): string =>
  `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`

export const formatRgbaString = (rgb: RGB, alpha: number): string => {
  const a = alpha / 100
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
}

export const formatHslaString = (hsl: HSL, alpha: number): string => {
  const a = alpha / 100
  return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`
}

export const formatHex8String = (hex: string, alpha: number): string => {
  const alphaHex = Math.round((alpha / 100) * 255)
    .toString(16)
    .padStart(2, '0')
  return hex + alphaHex
}

// Contrast calculation
export const calculateContrastColor = (rgb: RGB): string => {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

// Expand shorthand HEX
export const expandShorthandHex = (hex: string): string => {
  const trimmed = hex.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`

  if (/^#[a-fA-F0-9]{3}$/.test(withHash)) {
    return `#${[1, 2, 3].map(i => (withHash[i] ?? '').repeat(2)).join('')}`
  }
  return withHash
}

// Parse input strings
export const parseHexInput = (input: string): RGB | null => {
  const expanded = expandShorthandHex(input)
  return hexToRgb(expanded)
}

export const parseRgbInput = (input: string): RGB | null => {
  const match = /rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(input)
  if (match?.[1] && match[2] && match[3]) {
    return {
      r: Math.min(255, Math.max(0, parseInt(match[1]))),
      g: Math.min(255, Math.max(0, parseInt(match[2]))),
      b: Math.min(255, Math.max(0, parseInt(match[3]))),
    }
  }
  return null
}

export const parseHslInput = (input: string): RGB | null => {
  const match = /hsla?\(?\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/.exec(input)
  if (match?.[1] && match[2] && match[3]) {
    const h = Math.min(360, Math.max(0, parseInt(match[1])))
    const s = Math.min(100, Math.max(0, parseInt(match[2])))
    const l = Math.min(100, Math.max(0, parseInt(match[3])))
    return hslToRgb(h, s, l)
  }
  return null
}

// Composable
export const useColorConverter = () => {
  // Color state
  const hex = ref(DEFAULT_COLOR.hex)
  const rgb = ref<RGB>({ ...DEFAULT_COLOR.rgb })
  const hsl = ref<HSL>({ ...DEFAULT_COLOR.hsl })
  const hsv = ref<HSV>({ ...DEFAULT_COLOR.hsv })

  // Input states for manual editing
  const hexInput = ref(DEFAULT_COLOR.hex)
  const rgbInput = ref(formatRgbString(DEFAULT_COLOR.rgb))
  const hslInput = ref(formatHslString(DEFAULT_COLOR.hsl))
  const cmykInput = ref(
    formatCmykString(rgbToCmyk(DEFAULT_COLOR.rgb.r, DEFAULT_COLOR.rgb.g, DEFAULT_COLOR.rgb.b)),
  )

  // Alpha channel
  const alpha = ref(100)

  // Color picker value (without #)
  const colorPickerValue = ref(DEFAULT_COLOR.hex.slice(1))

  // Update input string representations
  const updateInputStrings = () => {
    hexInput.value = hex.value.toUpperCase()
    rgbInput.value = formatRgbString(rgb.value)
    hslInput.value = formatHslString(hsl.value)
    const cmyk = rgbToCmyk(rgb.value.r, rgb.value.g, rgb.value.b)
    cmykInput.value = formatCmykString(cmyk)
  }

  // Update all values from RGB
  const updateFromRgb = (r: number, g: number, b: number) => {
    rgb.value = { r, g, b }
    hex.value = rgbToHex(r, g, b)
    hsl.value = rgbToHsl(r, g, b)
    hsv.value = rgbToHsv(r, g, b)
    colorPickerValue.value = hex.value.slice(1)
    updateInputStrings()
  }

  // Parse and apply input handlers
  const applyHexInput = () => {
    const rgbVal = parseHexInput(hexInput.value)
    if (rgbVal) {
      updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
    }
  }

  const applyRgbInput = () => {
    const rgbVal = parseRgbInput(rgbInput.value)
    if (rgbVal) {
      updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
    }
  }

  const applyHslInput = () => {
    const rgbVal = parseHslInput(hslInput.value)
    if (rgbVal) {
      updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
    }
  }

  const selectPaletteColor = (hexValue: string) => {
    const rgbVal = hexToRgb(hexValue)
    if (rgbVal) {
      updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
    }
  }

  // Watch color picker changes
  watch(colorPickerValue, newValue => {
    const rgbVal = hexToRgb(newValue)
    if (rgbVal) {
      updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
    }
  })

  // Watch individual RGB values
  watch(
    () => [rgb.value.r, rgb.value.g, rgb.value.b],
    () => {
      hex.value = rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b)
      hsl.value = rgbToHsl(rgb.value.r, rgb.value.g, rgb.value.b)
      hsv.value = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b)
      colorPickerValue.value = hex.value.slice(1)
      updateInputStrings()
    },
  )

  // Computed values with alpha
  const rgbaString = computed(() => formatRgbaString(rgb.value, alpha.value))

  const hslaString = computed(() => formatHslaString(hsl.value, alpha.value))

  const hex8String = computed(() => formatHex8String(hex.value, alpha.value))

  // CMYK computed
  const cmyk = computed(() => rgbToCmyk(rgb.value.r, rgb.value.g, rgb.value.b))

  // Contrast color for text
  const contrastColor = computed(() => calculateContrastColor(rgb.value))

  return {
    // Color state
    hex,
    rgb,
    hsl,
    hsv,

    // Input states
    hexInput,
    rgbInput,
    hslInput,
    cmykInput,

    // Alpha
    alpha,

    // Color picker
    colorPickerValue,

    // Computed
    rgbaString,
    hslaString,
    hex8String,
    cmyk,
    contrastColor,

    // Actions
    updateFromRgb,
    applyHexInput,
    applyRgbInput,
    applyHslInput,
    selectPaletteColor,
  }
}
