<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import FileUpload from 'primevue/fileupload'
import type { FileUploadSelectEvent } from 'primevue/fileupload'
import Message from 'primevue/message'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'

import CodeEditor from '@/components/editors/CodeEditor.vue'

import { useHashGenerator, formatFileSize } from '@/composables/useHashGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showError } = useClipboardToast()

// Use composable
const {
  // Text Hash
  text,
  hashedValues,
  textStats,

  // File Hash
  fileHashedValues,
  fileName,
  fileSize,
  isProcessingFile,
  processFile,
  setFileInfo,
  clearFile,

  // Compare
  compareHash,
  compareInput,
  compareResult,
} = useHashGenerator()

// UI actions with toast notifications
const copyHash = (value: string, method: string) => {
  void copy(value, { detail: `${method} hash copied to clipboard` })
}

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
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-hashtag"></i>
        <span>Hash Generator</span>
      </div>
    </template>
    <template #subtitle> Calculate cryptographic hashes with file support and comparison </template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Text Hash</Tab>
          <Tab value="1">File Hash</Tab>
          <Tab value="2">Compare</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div class="panel-section">
              <div class="section-header">
                <label>Input Text</label>
                <div class="stats-tags">
                  <Tag severity="secondary" :value="`${textStats.chars} chars`" />
                  <Tag severity="info" :value="`${textStats.bytes} bytes`" />
                </div>
              </div>
              <CodeEditor v-model="text" mode="plain_text" height="180px" />
            </div>

            <Divider align="left">
              <span class="divider-text">
                <i class="pi pi-lock"></i>
                Hash Results
              </span>
            </Divider>

            <DataTable :value="hashedValues" striped-rows size="small" class="hash-table">
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
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyHash(slotProps.data.value, slotProps.data.method)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="1">
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
                <Divider align="left">
                  <span class="divider-text">
                    <i class="pi pi-file"></i>
                    File Information
                  </span>
                </Divider>

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
                <Divider align="left">
                  <span class="divider-text">
                    <i class="pi pi-lock"></i>
                    Hash Results
                  </span>
                </Divider>

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
                      <Button
                        v-tooltip.top="'Copy'"
                        icon="pi pi-copy"
                        severity="secondary"
                        text
                        rounded
                        @click="copyHash(slotProps.data.value, slotProps.data.method)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </Transition>
          </TabPanel>

          <TabPanel value="2">
            <div class="compare-section">
              <div class="field">
                <label for="compareHash">Expected Hash</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-check-circle"></i>
                  </InputGroupAddon>
                  <InputText
                    id="compareHash"
                    v-model="compareHash"
                    placeholder="Enter expected hash value"
                  />
                </InputGroup>
              </div>

              <div class="field">
                <label for="compareInput">Calculated Hash</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-calculator"></i>
                  </InputGroupAddon>
                  <InputText
                    id="compareInput"
                    v-model="compareInput"
                    placeholder="Enter hash to compare"
                  />
                </InputGroup>
              </div>

              <Transition name="fade-slide">
                <div v-if="compareResult !== null" class="compare-result">
                  <Message v-if="compareResult" severity="success" :closable="false">
                    <div class="result-content">
                      <i class="pi pi-check-circle"></i>
                      <span>Hashes match!</span>
                    </div>
                  </Message>
                  <Message v-else severity="error" :closable="false">
                    <div class="result-content">
                      <i class="pi pi-times-circle"></i>
                      <span>Hashes do not match</span>
                    </div>
                  </Message>
                </div>
              </Transition>

              <Divider />

              <div class="compare-hint">
                <i class="pi pi-info-circle"></i>
                <span>
                  Paste two hash values to compare them. Comparison is case-insensitive and ignores
                  leading/trailing whitespace.
                </span>
              </div>
            </div>
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

.panel-section {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }
}

.stats-tags {
  display: flex;
  gap: 0.5rem;
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

.upload-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.processing-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  justify-content: center;
  color: var(--text-color-secondary);
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

.compare-section {
  max-width: 600px;
}

.field {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
}

.compare-result {
  margin-bottom: 1rem;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.compare-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-color);
    margin-top: 0.1rem;
  }
}
</style>
