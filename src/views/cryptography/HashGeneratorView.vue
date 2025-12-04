<script setup lang="ts">
import { computed, ref } from 'vue'
import type CryptoJS from 'crypto-js'
import * as CryptoJSLib from 'crypto-js'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import TabView from 'primevue/tabview'
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

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

const HASH_FUNCTIONS = {
  md5: CryptoJSLib.MD5,
  sha1: CryptoJSLib.SHA1,
  sha224: CryptoJSLib.SHA224,
  sha256: CryptoJSLib.SHA256,
  sha384: CryptoJSLib.SHA384,
  sha512: CryptoJSLib.SHA512,
} as const satisfies Record<
  string,
  (message: string | CryptoJS.lib.WordArray) => CryptoJS.lib.WordArray
>

type HashMethod = keyof typeof HASH_FUNCTIONS

const HASH_INFO: Record<HashMethod, { bits: number; color: string }> = {
  md5: { bits: 128, color: 'secondary' },
  sha1: { bits: 160, color: 'warn' },
  sha224: { bits: 224, color: 'info' },
  sha256: { bits: 256, color: 'success' },
  sha384: { bits: 384, color: 'info' },
  sha512: { bits: 512, color: 'contrast' },
}

const computeHash = (method: HashMethod, value: string): string =>
  HASH_FUNCTIONS[method](value).toString()

const computeHashFromWordArray = (method: HashMethod, wordArray: CryptoJS.lib.WordArray): string =>
  HASH_FUNCTIONS[method](wordArray).toString()

// Text Hash Tab
const text = ref('')
const hashedValues = computed(() =>
  (Object.keys(HASH_FUNCTIONS) as HashMethod[]).map(method => ({
    method: method.toUpperCase(),
    value: computeHash(method, text.value),
    bits: HASH_INFO[method].bits,
    severity: HASH_INFO[method].color,
  })),
)

// File Hash Tab
const fileHashedValues = ref<{ method: string; value: string; bits: number; severity: string }[]>(
  [],
)
const fileName = ref('')
const fileSize = ref(0)
const isProcessingFile = ref(false)

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] ?? 'GB')
}

const onFileSelect = async (event: FileUploadSelectEvent) => {
  const file = event.files[0]
  if (!file) return

  fileName.value = file.name
  fileSize.value = file.size
  isProcessingFile.value = true
  fileHashedValues.value = []

  try {
    const arrayBuffer = await file.arrayBuffer()
    const wordArray = CryptoJSLib.lib.WordArray.create(arrayBuffer as unknown as number[])

    fileHashedValues.value = (Object.keys(HASH_FUNCTIONS) as HashMethod[]).map(method => ({
      method: method.toUpperCase(),
      value: computeHashFromWordArray(method, wordArray),
      bits: HASH_INFO[method].bits,
      severity: HASH_INFO[method].color,
    }))
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to process file',
      life: 3000,
    })
  } finally {
    isProcessingFile.value = false
  }
}

const clearFile = () => {
  fileName.value = ''
  fileSize.value = 0
  fileHashedValues.value = []
}

// Compare Tab
const compareHash = ref('')
const compareInput = ref('')
const compareResult = computed(() => {
  if (!compareHash.value || !compareInput.value) return null
  const normalizedCompare = compareHash.value.toLowerCase().trim()
  const normalizedInput = compareInput.value.toLowerCase().trim()
  return normalizedCompare === normalizedInput
})

// Copy function
const copyHash = (value: string, method: string) => {
  copy(value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${method} hash copied to clipboard`,
    life: 2000,
  })
}

// Text stats
const textStats = computed(() => ({
  chars: text.value.length,
  bytes: new Blob([text.value]).size,
}))
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
      <TabView>
        <TabPanel value="0" header="Text Hash">
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

          <DataTable :value="hashedValues" stripedRows size="small" class="hash-table">
            <Column header="Algorithm" :headerStyle="{ width: '130px' }">
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
            <Column :headerStyle="{ width: '80px' }">
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

        <TabPanel value="1" header="File Hash">
          <div class="upload-section">
            <FileUpload
              mode="basic"
              :auto="true"
              :maxFileSize="104857600"
              chooseLabel="Select File"
              chooseIcon="pi pi-upload"
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

          <div v-if="isProcessingFile" class="processing-section">
            <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
            <span>Calculating hashes...</span>
          </div>

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

          <div v-if="fileHashedValues.length > 0" class="file-hashes">
            <Divider align="left">
              <span class="divider-text">
                <i class="pi pi-lock"></i>
                Hash Results
              </span>
            </Divider>

            <DataTable :value="fileHashedValues" stripedRows size="small" class="hash-table">
              <Column header="Algorithm" :headerStyle="{ width: '130px' }">
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
              <Column :headerStyle="{ width: '80px' }">
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
        </TabPanel>

        <TabPanel value="2" header="Compare">
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
