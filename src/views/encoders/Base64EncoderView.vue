<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import FileUpload from 'primevue/fileupload'
import type { FileUploadSelectEvent } from 'primevue/fileupload'
import CodeEditor from '@/components/CodeEditor.vue'
import Message from 'primevue/message'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Panel from 'primevue/panel'
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const { copy } = useClipboard()

// Encode/Decode tab - Two editor layout
const inputText = ref('')
const outputText = ref('')
const encodeError = ref('')

type EncodingMode = 'encode' | 'decode'
const encodingMode = ref<EncodingMode>('encode')
const encodingModeOptions = [
  { label: 'Encode', value: 'encode', icon: 'pi pi-lock' },
  { label: 'Decode', value: 'decode', icon: 'pi pi-unlock' },
]

// Auto-encode/decode when input changes
watch([inputText, encodingMode], () => {
  encodeError.value = ''
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    if (encodingMode.value === 'encode') {
      outputText.value = globalThis.btoa(unescape(encodeURIComponent(inputText.value)))
    } else {
      outputText.value = decodeURIComponent(escape(globalThis.atob(inputText.value)))
    }
  } catch {
    encodeError.value =
      encodingMode.value === 'encode' ? 'Failed to encode text' : 'Invalid Base64 string'
    outputText.value = ''
  }
})

const swapValues = () => {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
  // Toggle mode when swapping
  encodingMode.value = encodingMode.value === 'encode' ? 'decode' : 'encode'
}

const copyInput = () => {
  copy(inputText.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Input copied to clipboard',
    life: 2000,
  })
}

const copyOutput = () => {
  copy(outputText.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Output copied to clipboard',
    life: 2000,
  })
}

const loadSample = () => {
  inputText.value = 'Hello World! こんにちは 你好 🌍'
  encodingMode.value = 'encode'
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  encodeError.value = ''
}

// Stats
const inputStats = computed(() => {
  if (!inputText.value) return null
  return {
    chars: inputText.value.length,
    bytes: new TextEncoder().encode(inputText.value).length,
  }
})

const outputStats = computed(() => {
  if (!outputText.value) return null
  const inputBytes = inputText.value ? new TextEncoder().encode(inputText.value).length : 0
  const outputBytes = outputText.value.length
  return {
    chars: outputText.value.length,
    ratio: inputBytes > 0 ? ((outputBytes / inputBytes) * 100).toFixed(0) : '0',
  }
})

// File Tab State
const fileBase64 = ref('')
const fileName = ref('')
const fileMimeType = ref('')
const fileSize = ref(0)
const isProcessingFile = ref(false)

const onFileSelect = async (event: FileUploadSelectEvent) => {
  const file = event.files[0]
  if (!file) return

  fileName.value = file.name
  fileMimeType.value = file.type
  fileSize.value = file.size
  isProcessingFile.value = true

  try {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      fileBase64.value = result.split(',')[1] ?? result
      isProcessingFile.value = false
    }
    reader.onerror = () => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read file',
        life: 3000,
      })
      isProcessingFile.value = false
    }
    reader.readAsDataURL(file)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to process file',
      life: 3000,
    })
    isProcessingFile.value = false
  }
}

const dataUrl = computed(() => {
  if (!fileBase64.value || !fileMimeType.value) return ''
  return `data:${fileMimeType.value};base64,${fileBase64.value}`
})

const isImage = computed(() => fileMimeType.value.startsWith('image/'))

const copyFileBase64 = () => {
  copy(fileBase64.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Base64 copied to clipboard',
    life: 2000,
  })
}

const copyDataUrl = () => {
  copy(dataUrl.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Data URL copied to clipboard',
    life: 2000,
  })
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] ?? 'GB')
}

const clearFile = () => {
  fileBase64.value = ''
  fileName.value = ''
  fileMimeType.value = ''
  fileSize.value = 0
}

// Decode Tab State
const base64Input = ref('')
const decodedFileName = ref('decoded-file')
const decodeError = ref('')

const downloadDecodedFile = () => {
  decodeError.value = ''
  try {
    const byteCharacters = globalThis.atob(base64Input.value.trim())
    const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0))
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = decodedFileName.value
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'Downloaded',
      detail: 'File downloaded successfully',
      life: 2000,
    })
  } catch {
    decodeError.value = 'Invalid Base64 string'
  }
}

const clearBase64Input = () => {
  base64Input.value = ''
  decodeError.value = ''
}

// Base64 input stats
const base64InputStats = computed(() => {
  if (!base64Input.value) return null
  return {
    chars: base64Input.value.length,
    valid: /^[A-Za-z0-9+/]*={0,2}$/.test(base64Input.value.trim()),
  }
})
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>Base64 Encoder</span>
      </div>
    </template>
    <template #subtitle> Encode and decode Base64 for text and files </template>
    <template #content>
      <TabView>
        <TabPanel value="0" header="Encode/Decode">
          <Panel toggleable class="options-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-cog"></i>
                <span>Encoding Options</span>
              </div>
            </template>
            <div class="options-content">
              <div class="option-item">
                <label>
                  <i class="pi pi-code"></i>
                  Mode
                </label>
                <SelectButton
                  v-model="encodingMode"
                  :options="encodingModeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allow-empty="false"
                />
              </div>

              <Divider layout="vertical" />

              <div class="method-info">
                <Tag
                  v-if="encodingMode === 'encode'"
                  value="Text → Base64"
                  severity="info"
                  icon="pi pi-lock"
                />
                <Tag v-else value="Base64 → Text" severity="success" icon="pi pi-unlock" />
                <span class="info-text">
                  {{
                    encodingMode === 'encode'
                      ? 'Convert plain text to Base64 encoding (UTF-8 safe)'
                      : 'Decode Base64 back to plain text'
                  }}
                </span>
              </div>
            </div>
          </Panel>

          <Message v-if="encodeError" severity="error" :closable="false" class="error-message">
            <i class="pi pi-times-circle"></i>
            {{ encodeError }}
          </Message>

          <div class="editor-grid">
            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-file-edit"></i>
                <span>{{
                  encodingMode === 'encode' ? 'Input (Plain Text)' : 'Input (Base64)'
                }}</span>
                <Tag
                  v-if="inputStats"
                  :value="`${inputStats.chars} chars / ${inputStats.bytes} bytes`"
                  severity="secondary"
                />
              </div>
              <CodeEditor v-model="inputText" mode="plain_text" height="300px" />
              <Toolbar class="editor-toolbar">
                <template #start>
                  <Button
                    v-tooltip.top="'Load Sample'"
                    icon="pi pi-file"
                    label="Sample"
                    severity="info"
                    text
                    @click="loadSample"
                  />
                </template>
                <template #end>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    :disabled="!inputText"
                    @click="copyInput"
                  />
                  <Button
                    v-tooltip.top="'Clear'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    :disabled="!inputText"
                    @click="clearAll"
                  />
                </template>
              </Toolbar>
            </div>

            <div class="swap-button">
              <Button
                v-tooltip.top="'Swap & Toggle Mode'"
                icon="pi pi-arrow-right-arrow-left"
                severity="secondary"
                rounded
                :disabled="!outputText"
                @click="swapValues"
              />
            </div>

            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-lock"></i>
                <span>{{
                  encodingMode === 'encode' ? 'Output (Base64)' : 'Output (Plain Text)'
                }}</span>
                <Tag
                  v-if="outputStats"
                  :value="`${outputStats.chars} chars (${outputStats.ratio}%)`"
                  severity="info"
                />
              </div>
              <CodeEditor
                v-model="outputText"
                mode="plain_text"
                height="300px"
                :options="{ readOnly: true }"
              />
              <Toolbar class="editor-toolbar">
                <template #start>
                  <Button
                    icon="pi pi-copy"
                    label="Copy"
                    severity="secondary"
                    :disabled="!outputText"
                    @click="copyOutput"
                  />
                </template>
              </Toolbar>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="1" header="File to Base64">
          <Panel toggleable class="upload-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-upload"></i>
                <span>Upload File</span>
                <Tag v-if="fileName" :value="fileName" severity="info" />
              </div>
            </template>

            <div class="upload-content">
              <FileUpload
                mode="basic"
                :auto="true"
                chooseLabel="Select File"
                chooseIcon="pi pi-upload"
                @select="onFileSelect"
              />
              <Button
                v-if="fileBase64"
                label="Clear"
                icon="pi pi-times"
                severity="secondary"
                text
                @click="clearFile"
              />
            </div>
          </Panel>

          <div v-if="isProcessingFile" class="processing-section">
            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
            <span>Processing file...</span>
          </div>

          <div v-if="fileBase64 && !isProcessingFile" class="file-result">
            <Divider align="left">
              <span class="divider-text">
                <i class="pi pi-info-circle"></i>
                File Information
              </span>
            </Divider>

            <div class="file-info-grid">
              <div class="info-item">
                <i class="pi pi-file"></i>
                <div class="info-content">
                  <span class="info-label">File Name</span>
                  <span class="info-value">{{ fileName }}</span>
                </div>
              </div>
              <div class="info-item">
                <i class="pi pi-tag"></i>
                <div class="info-content">
                  <span class="info-label">MIME Type</span>
                  <Tag :value="fileMimeType" severity="info" />
                </div>
              </div>
              <div class="info-item">
                <i class="pi pi-database"></i>
                <div class="info-content">
                  <span class="info-label">Original Size</span>
                  <span class="info-value">{{ formatFileSize(fileSize) }}</span>
                </div>
              </div>
              <div class="info-item">
                <i class="pi pi-code"></i>
                <div class="info-content">
                  <span class="info-label">Base64 Length</span>
                  <span class="info-value">{{ fileBase64.length.toLocaleString() }} chars</span>
                </div>
              </div>
            </div>

            <div v-if="isImage" class="image-preview">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-image"></i>
                  Preview
                </span>
              </Divider>
              <img :src="dataUrl" alt="Preview" class="preview-image" />
            </div>

            <Divider align="left">
              <span class="divider-text">
                <i class="pi pi-code"></i>
                Base64 Output
              </span>
            </Divider>

            <CodeEditor
              :model-value="fileBase64"
              mode="plain_text"
              height="200px"
              :options="{ readOnly: true }"
            />

            <Toolbar class="editor-toolbar">
              <template #start>
                <Button label="Copy Base64" icon="pi pi-copy" @click="copyFileBase64" />
                <Button
                  label="Copy Data URL"
                  icon="pi pi-link"
                  severity="secondary"
                  @click="copyDataUrl"
                />
              </template>
            </Toolbar>
          </div>
        </TabPanel>

        <TabPanel value="2" header="Base64 to File">
          <Panel toggleable class="decode-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-download"></i>
                <span>Decode Base64 to File</span>
                <Tag
                  v-if="base64InputStats"
                  :value="base64InputStats.valid ? 'Valid Base64' : 'Invalid'"
                  :severity="base64InputStats.valid ? 'success' : 'danger'"
                  :icon="base64InputStats.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                />
              </div>
            </template>

            <div class="decode-content">
              <div class="panel-label">
                <i class="pi pi-file-edit"></i>
                <span>Base64 Input</span>
                <Tag
                  v-if="base64InputStats"
                  :value="`${base64InputStats.chars} chars`"
                  severity="secondary"
                />
              </div>
              <CodeEditor v-model="base64Input" mode="plain_text" height="250px" />
              <Toolbar class="editor-toolbar">
                <template #end>
                  <Button
                    v-tooltip.top="'Clear'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    :disabled="!base64Input"
                    @click="clearBase64Input"
                  />
                </template>
              </Toolbar>
            </div>
          </Panel>

          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-download"></i>
              Download Options
            </span>
          </Divider>

          <div class="download-section">
            <div class="field">
              <label for="decodedFileName">
                <i class="pi pi-file"></i>
                Output Filename
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-file"></i>
                </InputGroupAddon>
                <InputText
                  id="decodedFileName"
                  v-model="decodedFileName"
                  placeholder="decoded-file"
                />
                <Button
                  icon="pi pi-download"
                  label="Download"
                  :disabled="!base64Input.trim()"
                  @click="downloadDecodedFile"
                />
              </InputGroup>
            </div>
          </div>

          <Message v-if="decodeError" severity="error" :closable="false" class="error-message">
            <i class="pi pi-times-circle"></i>
            {{ decodeError }}
          </Message>
        </TabPanel>
      </TabView>
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

.options-panel,
.upload-panel,
.decode-panel {
  margin-bottom: 1rem;

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
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.method-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  .info-text {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.error-message {
  margin: 1rem 0;

  i {
    margin-right: 0.5rem;
  }
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.editor-panel {
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

.swap-button {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding-top: 150px;

  @media (max-width: 1024px) {
    flex-direction: row;
    padding-top: 0;
    padding: 1rem 0;
  }
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

.upload-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.processing-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  justify-content: center;
  color: var(--text-color-secondary);
}

.file-result {
  margin-top: 1rem;
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-color);
  }
}

.file-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  > i {
    color: var(--primary-color);
    font-size: 1.25rem;
    margin-top: 0.25rem;
  }
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', monospace;
}

.image-preview {
  margin: 1rem 0;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.decode-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.download-section {
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 8px;

  .field {
    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;

      i {
        color: var(--primary-color);
      }
    }
  }
}
</style>
