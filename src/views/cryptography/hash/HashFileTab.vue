<script setup lang="ts">
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import FileUpload from 'primevue/fileupload'
import type { FileUploadSelectEvent } from 'primevue/fileupload'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useHashGenerator, formatFileSize } from '@/composables/useHashGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showError } = useClipboardToast()

const {
  fileHashedValues,
  fileName,
  fileSize,
  isProcessingFile,
  processFile,
  setFileInfo,
  clearFile,
} = useHashGenerator()

const onFileSelect = async (event: FileUploadSelectEvent) => {
  const files = event.files as File[]
  const file = files[0]
  if (!file) return

  isProcessingFile.value = true
  fileHashedValues.value = []

  try {
    const hashes = await processFile(file)
    setFileInfo(file, hashes)
  } catch {
    showError('Error', 'Failed to process file')
  } finally {
    isProcessingFile.value = false
  }
}
</script>

<template>
  <div class="upload-section">
    <FileUpload
      mode="basic"
      :auto="true"
      :max-file-size="104857600"
      choose-label="Select File"
      choose-icon="pi pi-upload"
      @select="onFileSelect"
    />
    <Button
      v-if="fileName"
      label="Clear"
      icon="pi pi-times"
      severity="secondary"
      text
      @click="clearFile"
    />
  </div>

  <Transition name="fade">
    <div v-if="isProcessingFile" class="processing-section">
      <ProgressSpinner style="width: 40px; height: 40px" stroke-width="4" />
      <span>Calculating hashes...</span>
    </div>
  </Transition>

  <Transition name="fade-slide">
    <div v-if="fileName && !isProcessingFile" class="file-info">
      <SectionDivider icon="file">File Information</SectionDivider>

      <div class="file-details">
        <div class="detail-item">
          <i class="pi pi-file"></i>
          <span class="detail-label">Name:</span>
          <span class="detail-value">{{ fileName }}</span>
        </div>
        <div class="detail-item">
          <i class="pi pi-database"></i>
          <span class="detail-label">Size:</span>
          <Tag :value="formatFileSize(fileSize)" severity="info" />
        </div>
      </div>
    </div>
  </Transition>

  <Transition name="fade-slide">
    <div v-if="fileHashedValues.length > 0" class="file-hashes">
      <SectionDivider icon="lock">Hash Results</SectionDivider>

      <DataTable :value="fileHashedValues" striped-rows size="small" class="hash-table">
        <Column header="Algorithm" :header-style="{ width: '130px' }">
          <template #body="slotProps">
            <div class="algorithm-cell">
              <Tag :value="slotProps.data.method" :severity="slotProps.data.severity" />
              <span class="bits-label">{{ slotProps.data.bits }} bits</span>
            </div>
          </template>
        </Column>
        <Column field="value" header="Hash Value">
          <template #body="slotProps">
            <code class="hash-value">{{ slotProps.data.value }}</code>
          </template>
        </Column>
        <Column :header-style="{ width: '80px' }">
          <template #body="slotProps">
            <CopyButton
              :value="slotProps.data.value"
              :tooltip="`Copy ${slotProps.data.method} hash`"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.upload-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.file-info {
  margin-top: 1rem;
}

.file-details {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }

  .detail-label {
    color: var(--text-color-secondary);
  }

  .detail-value {
    font-weight: 500;
    font-family: 'Monaco', 'Menlo', monospace;
  }
}

.file-hashes {
  margin-top: 1rem;
}

.hash-table {
  margin-bottom: 1rem;
}

.algorithm-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bits-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.hash-value {
  word-break: break-all;
  font-size: 0.85rem;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--primary-color);
}
</style>
