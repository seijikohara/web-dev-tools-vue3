<script setup lang="ts">
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import FileUpload from 'primevue/fileupload'
import type { FileUploadSelectEvent } from 'primevue/fileupload'
import ProgressSpinner from 'primevue/progressspinner'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useBase64Encoder, formatFileSize } from '@/composables/useBase64Encoder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showError } = useClipboardToast()

const {
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
} = useBase64Encoder()

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
</script>

<template>
  <Panel toggleable class="upload-panel">
    <template #header>
      <PanelHeader icon="upload" label="Upload File">
        <Tag v-if="fileName" :value="fileName" severity="info" />
      </PanelHeader>
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
      <SectionDivider icon="info-circle" label="File Information" align="left" />

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
        <SectionDivider icon="image" label="Preview" align="left" />
        <img :src="dataUrl" alt="Preview" class="preview-image" />
      </div>

      <SectionDivider icon="code" label="Base64 Output" align="left" />

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
</template>

<style lang="scss" scoped>
@import '@/assets/scss/_tool-common.scss';

.upload-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.upload-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-result {
  margin-top: 1rem;
}

.file-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 8px;
  margin-bottom: 1rem;
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
</style>
