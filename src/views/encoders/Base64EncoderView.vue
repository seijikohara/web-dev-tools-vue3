<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import FileUpload from 'primevue/fileupload'
import type { FileUploadSelectEvent } from 'primevue/fileupload'
import CodeEditor from '@/components/editors/CodeEditor.vue'
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

import { useClipboardToast } from '@/composables/useClipboardToast'
import {
  useBase64Encoder,
  ENCODING_MODE_OPTIONS,
  formatFileSize,
} from '@/composables/useBase64Encoder'

const { copy, showSuccess, showError } = useClipboardToast()

// Use composable
const {
  // Text encode/decode
  inputText,
  outputText,
  encodeError,
  encodingMode,
  inputStats,
  outputStats,
  loadSample,
  clearAll,

  // File
  fileBase64,
  fileName,
  fileMimeType,
  fileSize,
  isProcessingFile,
  dataUrl,
  isImage,
  processFile,
  setFileInfo,
  clearFile,

  // Decode to file
  base64Input,
  decodedFileName,
  decodeError,
  base64InputStats,
  downloadDecodedFile,
  clearBase64Input,
} = useBase64Encoder()

// UI actions with toast notifications
const copyInput = () => {
  void copy(inputText.value, { detail: 'Input copied to clipboard' })
}

const copyOutput = () => {
  void copy(outputText.value, { detail: 'Output copied to clipboard' })
}

const copyFileBase64 = () => {
  void copy(fileBase64.value, { detail: 'Base64 copied to clipboard' })
}

const copyDataUrl = () => {
  void copy(dataUrl.value, { detail: 'Data URL copied to clipboard' })
}

const onFileSelect = async (event: FileUploadSelectEvent) => {
  const files = event.files as File[]
  const file = files[0]
  if (!file) return

  isProcessingFile.value = true
  try {
    const base64 = await processFile(file)
    setFileInfo(file, base64)
  } catch {
    showError('Error', 'Failed to process file')
  } finally {
    isProcessingFile.value = false
  }
}

const handleDownload = () => {
  const success = downloadDecodedFile()
  if (success) {
    showSuccess('Downloaded', 'File downloaded successfully')
  }
}
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
      <Tabs value="0">
        <TabList>
          <Tab value="0">Encode/Decode</Tab>
          <Tab value="1">File to Base64</Tab>
          <Tab value="2">Base64 to File</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
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
                    :options="ENCODING_MODE_OPTIONS"
                    option-label="label"
                    option-value="value"
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

            <Transition name="fade-slide">
              <Message v-if="encodeError" severity="error" :closable="false" class="error-message">
                <i class="pi pi-times-circle"></i>
                {{ encodeError }}
              </Message>
            </Transition>

            <div class="editor-grid-2col">
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
                <CodeEditor v-model="inputText" mode="plain_text" height="clamp(250px, calc(100vh - 550px), 500px)" />
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
                      rounded
                      :disabled="!inputText"
                      @click="copyInput"
                    />
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
                  height="clamp(250px, calc(100vh - 550px), 500px)"
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

          <TabPanel value="1">
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
                  choose-label="Select File"
                  choose-icon="pi pi-upload"
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

            <Transition name="fade">
              <div v-if="isProcessingFile" class="processing-section">
                <ProgressSpinner style="width: 40px; height: 40px" stroke-width="4" />
                <span>Processing file...</span>
              </div>
            </Transition>

            <Transition name="fade-slide">
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
                  height="clamp(180px, calc(100vh - 650px), 300px)"
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
            </Transition>
          </TabPanel>

          <TabPanel value="2">
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
                <CodeEditor v-model="base64Input" mode="plain_text" height="clamp(220px, calc(100vh - 580px), 450px)" />
                <Toolbar class="editor-toolbar">
                  <template #end>
                    <Button
                      v-tooltip.top="'Clear'"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
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
                    @click="handleDownload"
                  />
                </InputGroup>
              </div>
            </div>

            <Transition name="fade-slide">
              <Message v-if="decodeError" severity="error" :closable="false" class="error-message">
                <i class="pi pi-times-circle"></i>
                {{ decodeError }}
              </Message>
            </Transition>
          </TabPanel>
        </TabPanels>
      </Tabs>
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

.editor-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

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
