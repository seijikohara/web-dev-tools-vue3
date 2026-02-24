<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { toDataURL as qrToDataURL, toString as qrToString } from 'qrcode'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ColorPicker from 'primevue/colorpicker'

import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showError, showSuccess } = useClipboardToast()

// State
const inputText = ref('')
const qrCodeDataUrl = ref('')
const qrCodeSvg = ref('')

const options = reactive({
  width: 256,
  margin: 2,
  errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H',
  darkColor: '000000',
  lightColor: 'ffffff',
})

const errorCorrectionOptions = [
  { label: 'Low (7%)', value: 'L' },
  { label: 'Medium (15%)', value: 'M' },
  { label: 'Quartile (25%)', value: 'Q' },
  { label: 'High (30%)', value: 'H' },
]

const sizeOptions = [
  { label: '128px', value: 128 },
  { label: '256px', value: 256 },
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
]

// Generate QR Code
const generateQRCode = async () => {
  if (!inputText.value.trim()) {
    qrCodeDataUrl.value = ''
    qrCodeSvg.value = ''
    return
  }

  try {
    const qrOptions = {
      width: options.width,
      margin: options.margin,
      errorCorrectionLevel: options.errorCorrectionLevel,
      color: {
        dark: `#${options.darkColor}`,
        light: `#${options.lightColor}`,
      },
    }

    // Generate PNG data URL
    qrCodeDataUrl.value = await qrToDataURL(inputText.value, qrOptions)

    // Generate SVG
    qrCodeSvg.value = await qrToString(inputText.value, {
      ...qrOptions,
      type: 'svg',
    })
  } catch (error) {
    showError('Error', error instanceof Error ? error.message : 'Failed to generate QR code', 3000)
  }
}

// Auto-generate on input/options change
watch(
  [
    inputText,
    () => options.width,
    () => options.margin,
    () => options.errorCorrectionLevel,
    () => options.darkColor,
    () => options.lightColor,
  ],
  () => {
    void generateQRCode()
  },
  { immediate: true },
)

// Download PNG
const downloadPng = () => {
  if (!qrCodeDataUrl.value) return

  const link = document.createElement('a')
  link.href = qrCodeDataUrl.value
  link.download = 'qrcode.png'
  link.click()

  showSuccess('Downloaded', 'QR code PNG downloaded')
}

// Download SVG
const downloadSvg = () => {
  if (!qrCodeSvg.value) return

  const blob = new Blob([qrCodeSvg.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'qrcode.svg'
  link.click()
  URL.revokeObjectURL(url)

  showSuccess('Downloaded', 'QR code SVG downloaded')
}

// Copy data URL
const copyDataUrl = () => {
  if (!qrCodeDataUrl.value) return
  void copy(qrCodeDataUrl.value, { detail: 'Data URL copied to clipboard' })
}

// Copy SVG
const copySvg = () => {
  if (!qrCodeSvg.value) return
  void copy(qrCodeSvg.value, { detail: 'SVG code copied to clipboard' })
}

// Load samples
const loadUrlSample = () => {
  inputText.value = 'https://example.com'
}

const loadTextSample = () => {
  inputText.value = 'Hello, World! This is a sample text for QR code generation.'
}

const loadVCardSample = () => {
  inputText.value = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
ORG:Example Inc.
TEL:+1-234-567-8900
EMAIL:john.doe@example.com
URL:https://example.com
END:VCARD`
}

const loadWifiSample = () => {
  inputText.value = 'WIFI:T:WPA;S:MyNetwork;P:MyPassword;;'
}

// Clear
const clearAll = () => {
  inputText.value = ''
  qrCodeDataUrl.value = ''
  qrCodeSvg.value = ''
}

// Stats
const inputStats = computed(() => {
  if (!inputText.value) return null
  return {
    chars: inputText.value.length,
    bytes: new TextEncoder().encode(inputText.value).length,
  }
})
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-qrcode"></i>
        <span>QR Code Generator</span>
      </div>
    </template>
    <template #subtitle> Generate QR codes from text, URLs, vCard, and more </template>
    <template #content>
      <div class="qr-grid">
        <div class="input-section">
          <Panel toggleable class="options-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-cog"></i>
                <span>Options</span>
              </div>
            </template>

            <div class="options-content">
              <div class="option-row">
                <div class="option-item">
                  <label>
                    <i class="pi pi-expand"></i>
                    Size
                  </label>
                  <Select
                    v-model="options.width"
                    :options="sizeOptions"
                    option-label="label"
                    option-value="value"
                  />
                </div>

                <div class="option-item">
                  <label>
                    <i class="pi pi-shield"></i>
                    Error Correction
                  </label>
                  <Select
                    v-model="options.errorCorrectionLevel"
                    :options="errorCorrectionOptions"
                    option-label="label"
                    option-value="value"
                  />
                </div>

                <div class="option-item">
                  <label>
                    <i class="pi pi-stop"></i>
                    Margin
                  </label>
                  <InputNumber v-model="options.margin" :min="0" :max="10" show-buttons />
                </div>
              </div>

              <Divider />

              <div class="option-row">
                <div class="option-item">
                  <label>
                    <i class="pi pi-palette"></i>
                    Foreground
                  </label>
                  <div class="color-picker-group">
                    <ColorPicker v-model="options.darkColor" />
                    <InputText v-model="options.darkColor" class="color-input" />
                  </div>
                </div>

                <div class="option-item">
                  <label>
                    <i class="pi pi-palette"></i>
                    Background
                  </label>
                  <div class="color-picker-group">
                    <ColorPicker v-model="options.lightColor" />
                    <InputText v-model="options.lightColor" class="color-input" />
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <div class="input-panel">
            <div class="panel-label">
              <i class="pi pi-file-edit"></i>
              <span>Content</span>
              <Tag
                v-if="inputStats"
                :value="`${inputStats.chars} chars / ${inputStats.bytes} bytes`"
                severity="secondary"
              />
            </div>
            <Textarea
              v-model="inputText"
              rows="8"
              placeholder="Enter text, URL, vCard, WiFi config, or any data..."
              class="input-textarea"
            />
            <Toolbar class="editor-toolbar">
              <template #start>
                <Button
                  v-tooltip.top="'URL'"
                  icon="pi pi-link"
                  label="URL"
                  severity="secondary"
                  text
                  @click="loadUrlSample"
                />
                <Button
                  v-tooltip.top="'Text'"
                  icon="pi pi-align-left"
                  label="Text"
                  severity="secondary"
                  text
                  @click="loadTextSample"
                />
                <Button
                  v-tooltip.top="'vCard'"
                  icon="pi pi-id-card"
                  label="vCard"
                  severity="secondary"
                  text
                  @click="loadVCardSample"
                />
                <Button
                  v-tooltip.top="'WiFi'"
                  icon="pi pi-wifi"
                  label="WiFi"
                  severity="secondary"
                  text
                  @click="loadWifiSample"
                />
              </template>
              <template #end>
                <Button
                  v-tooltip.top="'Clear'"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :disabled="!inputText"
                  @click="clearAll"
                />
              </template>
            </Toolbar>
          </div>
        </div>

        <div class="output-section">
          <div class="panel-label">
            <i class="pi pi-qrcode"></i>
            <span>QR Code</span>
            <Tag
              v-if="qrCodeDataUrl"
              :value="`${options.width}x${options.width}px`"
              severity="info"
            />
          </div>

          <div class="qr-preview">
            <Transition name="scale-fade" mode="out-in">
              <div v-if="qrCodeDataUrl" key="qr" class="qr-image-container">
                <img :src="qrCodeDataUrl" alt="QR Code" class="qr-image" />
              </div>
              <div v-else key="placeholder" class="qr-placeholder">
                <i class="pi pi-qrcode"></i>
                <span>Enter content to generate QR code</span>
              </div>
            </Transition>
          </div>

          <Transition name="fade-slide">
            <Toolbar v-if="qrCodeDataUrl" class="editor-toolbar">
              <template #start>
                <Button label="Download PNG" icon="pi pi-image" @click="downloadPng" />
                <Button
                  label="Download SVG"
                  icon="pi pi-file"
                  severity="secondary"
                  @click="downloadSvg"
                />
              </template>
              <template #end>
                <Button
                  v-tooltip.top="'Copy Data URL'"
                  icon="pi pi-copy"
                  severity="secondary"
                  text
                  @click="copyDataUrl"
                />
                <Button
                  v-tooltip.top="'Copy SVG'"
                  icon="pi pi-code"
                  severity="secondary"
                  text
                  @click="copySvg"
                />
              </template>
            </Toolbar>
          </Transition>
        </div>
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

.qr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.options-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
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

.options-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: $breakpoint) {
    flex-direction: column;
  }
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.85rem;

    i {
      color: var(--primary-color);
    }
  }
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .color-input {
    width: 80px;
    font-family: monospace;
  }
}

.input-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 0;

  i {
    color: var(--primary-color);
  }
}

.input-textarea {
  width: 100%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.editor-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.output-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qr-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background-color: var(--surface-ground);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.qr-image-container {
  padding: 1rem;
}

.qr-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-color-secondary);

  i {
    font-size: 4rem;
    opacity: 0.3;
  }
}
</style>
