<script setup lang="ts">
import { useClipboardToast } from '@/composables/useClipboardToast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ColorPicker from 'primevue/colorpicker'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Panel from 'primevue/panel'

import { useColorConverter, COLOR_PALETTE } from '@/composables/useColorConverter'

const { copy } = useClipboardToast()

// Use composable
const {
  hex,
  rgb,
  hsl,
  hsv,
  hexInput,
  rgbInput,
  hslInput,
  cmykInput,
  alpha,
  colorPickerValue,
  rgbaString,
  hslaString,
  hex8String,
  cmyk,
  contrastColor,
  applyHexInput,
  applyRgbInput,
  applyHslInput,
  selectPaletteColor,
} = useColorConverter()

// UI action with toast notification
const copyValue = (value: string, label: string) => {
  void copy(value, { detail: `${label} copied to clipboard` })
}
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
                      rounded
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
                      rounded
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
                      rounded
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
                      rounded
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
              <InputNumber v-model="alpha" :min="0" :max="100" show-buttons suffix="%" />

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
                        rounded
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
                        rounded
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
                        rounded
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
                <span>RGB Values</span>
              </div>
            </template>

            <div class="rgb-inputs">
              <div class="rgb-input-group">
                <Tag value="R" class="slider-tag slider-tag-red" />
                <InputNumber v-model="rgb.r" :min="0" :max="255" show-buttons />
              </div>
              <div class="rgb-input-group">
                <Tag value="G" class="slider-tag slider-tag-green" />
                <InputNumber v-model="rgb.g" :min="0" :max="255" show-buttons />
              </div>
              <div class="rgb-input-group">
                <Tag value="B" class="slider-tag slider-tag-blue" />
                <InputNumber v-model="rgb.b" :min="0" :max="255" show-buttons />
              </div>
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
          v-for="color in COLOR_PALETTE"
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

.rgb-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rgb-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
