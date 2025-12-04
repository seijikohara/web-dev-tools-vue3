<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Slider from 'primevue/slider'
import ColorPicker from 'primevue/colorpicker'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Panel from 'primevue/panel'

const toast = useToast()
const { copy } = useClipboard()

// Color state
const hex = ref('#3b82f6')
const rgb = ref({ r: 59, g: 130, b: 246 })
const hsl = ref({ h: 217, s: 91, l: 60 })
const hsv = ref({ h: 217, s: 76, v: 96 })

// Input states for manual editing
const hexInput = ref('#3b82f6')
const rgbInput = ref('rgb(59, 130, 246)')
const hslInput = ref('hsl(217, 91%, 60%)')
const cmykInput = ref('cmyk(76%, 47%, 0%, 4%)')

// Alpha channel
const alpha = ref(100)

// Color picker value (without #)
const colorPickerValue = ref('3b82f6')

// Conversion functions
const hexToRgb = (hexValue: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexValue)
  if (!result?.[1] || !result[2] || !result[3]) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
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

const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
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

const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
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

const rgbToCmyk = (
  r: number,
  g: number,
  b: number,
): { c: number; m: number; y: number; k: number } => {
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

// Update all values from RGB
const updateFromRgb = (r: number, g: number, b: number) => {
  rgb.value = { r, g, b }
  hex.value = rgbToHex(r, g, b)
  hsl.value = rgbToHsl(r, g, b)
  hsv.value = rgbToHsv(r, g, b)
  colorPickerValue.value = hex.value.slice(1)
  updateInputStrings()
}

// Update input string representations
const updateInputStrings = () => {
  hexInput.value = hex.value.toUpperCase()
  rgbInput.value = `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`
  hslInput.value = `hsl(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%)`
  const cmyk = rgbToCmyk(rgb.value.r, rgb.value.g, rgb.value.b)
  cmykInput.value = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
}

// Parse and apply hex input
const applyHexInput = () => {
  const trimmed = hexInput.value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : '#' + trimmed

  // Expand shorthand (#RGB to #RRGGBB)
  const expanded = /^#[a-fA-F0-9]{3}$/.test(withHash)
    ? `#${withHash[1] ?? ''}${withHash[1] ?? ''}${withHash[2] ?? ''}${withHash[2] ?? ''}${withHash[3] ?? ''}${withHash[3] ?? ''}`
    : withHash

  const rgbVal = hexToRgb(expanded)
  if (rgbVal) {
    updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
  }
}

// Parse and apply RGB input
const applyRgbInput = () => {
  const match = rgbInput.value.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (match?.[1] && match[2] && match[3]) {
    const r = Math.min(255, Math.max(0, parseInt(match[1])))
    const g = Math.min(255, Math.max(0, parseInt(match[2])))
    const b = Math.min(255, Math.max(0, parseInt(match[3])))
    updateFromRgb(r, g, b)
  }
}

// Parse and apply HSL input
const applyHslInput = () => {
  const match = hslInput.value.match(/hsla?\(?\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)
  if (match?.[1] && match[2] && match[3]) {
    const h = Math.min(360, Math.max(0, parseInt(match[1])))
    const s = Math.min(100, Math.max(0, parseInt(match[2])))
    const l = Math.min(100, Math.max(0, parseInt(match[3])))
    const rgbVal = hslToRgb(h, s, l)
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

// Watch individual RGB sliders
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
const rgbaString = computed(() => {
  const a = alpha.value / 100
  return `rgba(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b}, ${a})`
})

const hslaString = computed(() => {
  const a = alpha.value / 100
  return `hsla(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%, ${a})`
})

const hex8String = computed(() => {
  const alphaHex = Math.round((alpha.value / 100) * 255)
    .toString(16)
    .padStart(2, '0')
  return hex.value + alphaHex
})

// Copy functions
const copyValue = (value: string, label: string) => {
  copy(value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${label} copied to clipboard`,
    life: 2000,
  })
}

// Initialize
updateInputStrings()

// Common color palette
const colorPalette = [
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

const selectPaletteColor = (hexValue: string) => {
  const rgbVal = hexToRgb(hexValue)
  if (rgbVal) {
    updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
  }
}

// Contrast color for text
const contrastColor = computed(() => {
  const luminance = (0.299 * rgb.value.r + 0.587 * rgb.value.g + 0.114 * rgb.value.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
})

// CMYK computed
const cmyk = computed(() => rgbToCmyk(rgb.value.r, rgb.value.g, rgb.value.b))
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-palette"></i>
        <span>Color Converter</span>
      </div>
    </template>
    <template #subtitle> Convert colors between HEX, RGB, HSL, HSV and CMYK formats </template>
    <template #content>
      <div class="color-container">
        <!-- Preview Section -->
        <div class="preview-section">
          <div class="color-preview" :style="{ backgroundColor: hex, color: contrastColor }">
            <span class="preview-hex">{{ hex.toUpperCase() }}</span>
            <div class="preview-rgb">{{ rgbInput }}</div>
          </div>
          <div class="picker-wrapper">
            <ColorPicker v-model="colorPickerValue" inline />
          </div>
        </div>

        <!-- Formats Section -->
        <div class="formats-section">
          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-hashtag"></i>
                <span>Color Formats</span>
              </div>
            </template>

            <div class="format-grid">
              <div class="format-group">
                <label>
                  <Tag value="HEX" severity="info" />
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <div class="color-swatch" :style="{ backgroundColor: hex }"></div>
                  </InputGroupAddon>
                  <InputText
                    v-model="hexInput"
                    class="format-input"
                    @blur="applyHexInput"
                    @keyup.enter="applyHexInput"
                  />
                  <InputGroupAddon>
                    <Button
                      v-tooltip.top="'Copy'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      @click="copyValue(hexInput, 'HEX')"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div class="format-group">
                <label>
                  <Tag value="RGB" severity="success" />
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-circle-fill" style="color: var(--primary-color)"></i>
                  </InputGroupAddon>
                  <InputText
                    v-model="rgbInput"
                    class="format-input"
                    @blur="applyRgbInput"
                    @keyup.enter="applyRgbInput"
                  />
                  <InputGroupAddon>
                    <Button
                      v-tooltip.top="'Copy'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      @click="copyValue(rgbInput, 'RGB')"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div class="format-group">
                <label>
                  <Tag value="HSL" severity="warn" />
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-sun" style="color: var(--primary-color)"></i>
                  </InputGroupAddon>
                  <InputText
                    v-model="hslInput"
                    class="format-input"
                    @blur="applyHslInput"
                    @keyup.enter="applyHslInput"
                  />
                  <InputGroupAddon>
                    <Button
                      v-tooltip.top="'Copy'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      @click="copyValue(hslInput, 'HSL')"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div class="format-group">
                <label>
                  <Tag value="CMYK" severity="secondary" />
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-print" style="color: var(--primary-color)"></i>
                  </InputGroupAddon>
                  <InputText v-model="cmykInput" class="format-input" readonly />
                  <InputGroupAddon>
                    <Button
                      v-tooltip.top="'Copy'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      @click="copyValue(cmykInput, 'CMYK')"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </Panel>

          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-eye"></i>
                <span>Alpha Channel</span>
                <Tag :value="`${alpha}%`" severity="info" />
              </div>
            </template>

            <div class="alpha-section">
              <Slider v-model="alpha" :min="0" :max="100" class="alpha-slider" />

              <div class="alpha-formats">
                <div class="alpha-format-item">
                  <Tag value="RGBA" severity="success" />
                  <InputGroup>
                    <InputText :value="rgbaString" class="format-input" readonly />
                    <InputGroupAddon>
                      <Button
                        v-tooltip.top="'Copy'"
                        icon="pi pi-copy"
                        severity="secondary"
                        text
                        @click="copyValue(rgbaString, 'RGBA')"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div class="alpha-format-item">
                  <Tag value="HSLA" severity="warn" />
                  <InputGroup>
                    <InputText :value="hslaString" class="format-input" readonly />
                    <InputGroupAddon>
                      <Button
                        v-tooltip.top="'Copy'"
                        icon="pi pi-copy"
                        severity="secondary"
                        text
                        @click="copyValue(hslaString, 'HSLA')"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div class="alpha-format-item">
                  <Tag value="HEX8" severity="info" />
                  <InputGroup>
                    <InputText :value="hex8String.toUpperCase()" class="format-input" readonly />
                    <InputGroupAddon>
                      <Button
                        v-tooltip.top="'Copy'"
                        icon="pi pi-copy"
                        severity="secondary"
                        text
                        @click="copyValue(hex8String.toUpperCase(), 'HEX8')"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <!-- Sliders Section -->
        <div class="sliders-section">
          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-sliders-h"></i>
                <span>RGB Sliders</span>
              </div>
            </template>

            <div class="slider-group">
              <div class="slider-header">
                <Tag value="R" class="slider-tag slider-tag-red" />
                <span class="slider-value">{{ rgb.r }}</span>
              </div>
              <Slider v-model="rgb.r" :min="0" :max="255" class="slider-red" />
            </div>
            <div class="slider-group">
              <div class="slider-header">
                <Tag value="G" class="slider-tag slider-tag-green" />
                <span class="slider-value">{{ rgb.g }}</span>
              </div>
              <Slider v-model="rgb.g" :min="0" :max="255" class="slider-green" />
            </div>
            <div class="slider-group">
              <div class="slider-header">
                <Tag value="B" class="slider-tag slider-tag-blue" />
                <span class="slider-value">{{ rgb.b }}</span>
              </div>
              <Slider v-model="rgb.b" :min="0" :max="255" class="slider-blue" />
            </div>
          </Panel>

          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-chart-pie"></i>
                <span>Color Values</span>
              </div>
            </template>

            <Divider align="left">
              <span class="divider-text">HSL</span>
            </Divider>
            <div class="values-grid">
              <div class="value-item">
                <Tag value="H" severity="secondary" />
                <code>{{ hsl.h }}°</code>
              </div>
              <div class="value-item">
                <Tag value="S" severity="secondary" />
                <code>{{ hsl.s }}%</code>
              </div>
              <div class="value-item">
                <Tag value="L" severity="secondary" />
                <code>{{ hsl.l }}%</code>
              </div>
            </div>

            <Divider align="left">
              <span class="divider-text">HSV</span>
            </Divider>
            <div class="values-grid">
              <div class="value-item">
                <Tag value="H" severity="secondary" />
                <code>{{ hsv.h }}°</code>
              </div>
              <div class="value-item">
                <Tag value="S" severity="secondary" />
                <code>{{ hsv.s }}%</code>
              </div>
              <div class="value-item">
                <Tag value="V" severity="secondary" />
                <code>{{ hsv.v }}%</code>
              </div>
            </div>

            <Divider align="left">
              <span class="divider-text">CMYK</span>
            </Divider>
            <div class="values-grid">
              <div class="value-item">
                <Tag value="C" severity="info" />
                <code>{{ cmyk.c }}%</code>
              </div>
              <div class="value-item">
                <Tag value="M" severity="danger" />
                <code>{{ cmyk.m }}%</code>
              </div>
              <div class="value-item">
                <Tag value="Y" severity="warn" />
                <code>{{ cmyk.y }}%</code>
              </div>
              <div class="value-item">
                <Tag value="K" severity="contrast" />
                <code>{{ cmyk.k }}%</code>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <!-- Color Palette -->
      <Divider align="left">
        <span class="divider-text">
          <i class="pi pi-th-large"></i>
          Quick Palette
        </span>
      </Divider>
      <div class="palette-grid">
        <div
          v-for="color in colorPalette"
          :key="color.name"
          v-tooltip.top="color.name"
          class="palette-item"
          :style="{ backgroundColor: color.hex }"
          @click="selectPaletteColor(color.hex)"
        ></div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.color-container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-preview {
  width: 200px;
  height: 120px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s ease;

  .preview-hex {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .preview-rgb {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.8rem;
    opacity: 0.8;
  }
}

.picker-wrapper {
  :deep(.p-colorpicker-preview) {
    display: none;
  }
}

.formats-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  i {
    color: var(--primary-color);
  }
}

.format-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.format-group {
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--surface-border);
}

.format-input {
  flex: 1;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
}

.alpha-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alpha-slider {
  margin-bottom: 0.5rem;
}

.alpha-formats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alpha-format-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sliders-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 220px;
}

.slider-group {
  margin-bottom: 1rem;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.slider-tag-red {
  background: #ef4444 !important;
}

.slider-tag-green {
  background: #22c55e !important;
}

.slider-tag-blue {
  background: #3b82f6 !important;
}

.slider-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.slider-red :deep(.p-slider-range),
.slider-red :deep(.p-slider-handle) {
  background: #ef4444 !important;
}

.slider-green :deep(.p-slider-range),
.slider-green :deep(.p-slider-handle) {
  background: #22c55e !important;
}

.slider-blue :deep(.p-slider-range),
.slider-blue :deep(.p-slider-handle) {
  background: #3b82f6 !important;
}

.divider-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.values-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  code {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
  }
}

.palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.palette-item {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
  }
}
</style>
