<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

interface JwtHeader {
  alg?: string
  typ?: string
  kid?: string
  [key: string]: unknown
}

interface JwtPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  [key: string]: unknown
}

interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
}

const jwtInput = ref('')
const error = ref('')
const decodedJwt = ref<DecodedJwt | null>(null)

// Base64URL decode
const base64UrlDecode = (str: string): string => {
  // Replace URL-safe characters and add padding if necessary
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64
  return decodeURIComponent(
    globalThis
      .atob(paddedBase64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
}

const decodeJwt = (token: string): DecodedJwt | null => {
  const parts = token.trim().split('.')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('Invalid JWT format: must have 3 parts separated by dots')
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload
    const signature = parts[2]

    return { header, payload, signature }
  } catch {
    throw new Error('Failed to decode JWT: invalid Base64 or JSON')
  }
}

watch(jwtInput, newValue => {
  error.value = ''
  decodedJwt.value = null

  if (!newValue.trim()) return

  try {
    decodedJwt.value = decodeJwt(newValue)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to decode JWT'
  }
})

const headerJson = computed(() =>
  decodedJwt.value ? JSON.stringify(decodedJwt.value.header, null, 2) : '',
)

const payloadJson = computed(() =>
  decodedJwt.value ? JSON.stringify(decodedJwt.value.payload, null, 2) : '',
)

// Time-related computed properties
const isExpired = computed(() => {
  if (!decodedJwt.value?.payload.exp) return null
  return Date.now() / 1000 > decodedJwt.value.payload.exp
})

const formatTimestamp = (timestamp: number | undefined): string => {
  if (!timestamp) return 'N/A'
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss (Z)')
}

const expirationInfo = computed(() => {
  if (!decodedJwt.value?.payload.exp) return null
  const exp = decodedJwt.value.payload.exp
  const now = Date.now() / 1000
  const diff = exp - now

  if (diff < 0) {
    const absDiff = Math.abs(diff)
    if (absDiff < 60) return `Expired ${Math.floor(absDiff)} seconds ago`
    if (absDiff < 3600) return `Expired ${Math.floor(absDiff / 60)} minutes ago`
    if (absDiff < 86400) return `Expired ${Math.floor(absDiff / 3600)} hours ago`
    return `Expired ${Math.floor(absDiff / 86400)} days ago`
  } else {
    if (diff < 60) return `Expires in ${Math.floor(diff)} seconds`
    if (diff < 3600) return `Expires in ${Math.floor(diff / 60)} minutes`
    if (diff < 86400) return `Expires in ${Math.floor(diff / 3600)} hours`
    return `Expires in ${Math.floor(diff / 86400)} days`
  }
})

// Copy functions
const copyHeader = () => {
  copy(headerJson.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Header copied to clipboard',
    life: 2000,
  })
}

const copyPayload = () => {
  copy(payloadJson.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Payload copied to clipboard',
    life: 2000,
  })
}

const copySignature = () => {
  if (decodedJwt.value) {
    copy(decodedJwt.value.signature)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Signature copied to clipboard',
      life: 2000,
    })
  }
}

// Clear input
const clearInput = () => {
  jwtInput.value = ''
  error.value = ''
  decodedJwt.value = null
}

// Load sample JWT
const loadSample = () => {
  // Sample JWT (expired, for demo purposes)
  jwtInput.value =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
}

// Standard claims info
const standardClaims = computed(() => {
  if (!decodedJwt.value) return []
  return [
    {
      key: 'iss',
      name: 'Issuer',
      description: 'Who issued the token',
      value: decodedJwt.value.payload.iss,
    },
    {
      key: 'sub',
      name: 'Subject',
      description: 'Who the token is about',
      value: decodedJwt.value.payload.sub,
    },
    {
      key: 'aud',
      name: 'Audience',
      description: 'Who the token is intended for',
      value: Array.isArray(decodedJwt.value.payload.aud)
        ? decodedJwt.value.payload.aud.join(', ')
        : decodedJwt.value.payload.aud,
    },
    {
      key: 'exp',
      name: 'Expiration Time',
      description: 'When the token expires',
      value: formatTimestamp(decodedJwt.value.payload.exp),
      isTime: true,
    },
    {
      key: 'nbf',
      name: 'Not Before',
      description: 'When the token becomes valid',
      value: formatTimestamp(decodedJwt.value.payload.nbf),
      isTime: true,
    },
    {
      key: 'iat',
      name: 'Issued At',
      description: 'When the token was issued',
      value: formatTimestamp(decodedJwt.value.payload.iat),
      isTime: true,
    },
    {
      key: 'jti',
      name: 'JWT ID',
      description: 'Unique identifier for the token',
      value: decodedJwt.value.payload.jti,
    },
  ]
})

// JWT stats
const jwtStats = computed(() => {
  if (!jwtInput.value) return null
  const parts = jwtInput.value.trim().split('.')
  return {
    length: jwtInput.value.length,
    parts: parts.length,
    valid: parts.length === 3,
  }
})
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-key"></i>
        <span>JWT Decoder</span>
      </div>
    </template>
    <template #subtitle> Decode and inspect JSON Web Tokens </template>
    <template #content>
      <div class="input-section">
        <div class="section-header">
          <label>
            <i class="pi pi-file-edit"></i>
            JWT Token
          </label>
          <div class="stats-tags">
            <Tag v-if="jwtStats" :value="`${jwtStats.length} chars`" severity="secondary" />
            <Tag
              v-if="jwtStats"
              :value="`${jwtStats.parts} parts`"
              :severity="jwtStats.valid ? 'success' : 'danger'"
            />
          </div>
        </div>
        <CodeEditor v-model="jwtInput" mode="plain_text" height="120px" />

        <Toolbar class="action-toolbar">
          <template #start>
            <Button
              label="Sample"
              icon="pi pi-file"
              severity="info"
              text
              size="small"
              @click="loadSample"
            />
          </template>
          <template #end>
            <Button
              label="Clear"
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              :disabled="!jwtInput"
              @click="clearInput"
            />
          </template>
        </Toolbar>
      </div>

      <Message v-if="error" severity="error" :closable="false" class="mt-3">
        <div class="error-content">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
      </Message>

      <div v-if="decodedJwt" class="decoded-sections">
        <!-- Expiration Status -->
        <div v-if="isExpired !== null" class="expiration-banner">
          <Tag
            :severity="isExpired ? 'danger' : 'success'"
            :value="isExpired ? 'EXPIRED' : 'VALID'"
            :icon="isExpired ? 'pi pi-times-circle' : 'pi pi-check-circle'"
          />
          <span class="expiration-info">{{ expirationInfo }}</span>
        </div>

        <!-- Header Panel -->
        <Panel toggleable class="jwt-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-file-edit"></i>
              <span>Header</span>
              <Tag :value="decodedJwt.header.alg ?? 'Unknown'" severity="info" />
            </div>
          </template>
          <template #icons>
            <Button
              v-tooltip.top="'Copy Header'"
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              @click="copyHeader"
            />
          </template>

          <CodeEditor
            :model-value="headerJson"
            mode="json"
            height="100px"
            :options="{ readOnly: true }"
          />

          <div class="header-info">
            <div v-if="decodedJwt.header.alg" class="info-item">
              <Tag value="Algorithm" severity="secondary" />
              <code>{{ decodedJwt.header.alg }}</code>
            </div>
            <div v-if="decodedJwt.header.typ" class="info-item">
              <Tag value="Type" severity="secondary" />
              <code>{{ decodedJwt.header.typ }}</code>
            </div>
            <div v-if="decodedJwt.header.kid" class="info-item">
              <Tag value="Key ID" severity="secondary" />
              <code>{{ decodedJwt.header.kid }}</code>
            </div>
          </div>
        </Panel>

        <!-- Payload Panel -->
        <Panel toggleable class="jwt-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-database"></i>
              <span>Payload</span>
              <Tag
                :value="`${Object.keys(decodedJwt.payload).length} claims`"
                severity="secondary"
              />
            </div>
          </template>
          <template #icons>
            <Button
              v-tooltip.top="'Copy Payload'"
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              @click="copyPayload"
            />
          </template>

          <CodeEditor
            :model-value="payloadJson"
            mode="json"
            height="180px"
            :options="{ readOnly: true }"
          />

          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-list"></i>
              Standard Claims
            </span>
          </Divider>

          <DataTable :value="standardClaims" stripedRows size="small" class="claims-table">
            <Column field="key" header="Claim" style="width: 80px">
              <template #body="slotProps">
                <code class="claim-key">{{ slotProps.data.key }}</code>
              </template>
            </Column>
            <Column field="name" header="Name" style="width: 120px" />
            <Column field="value" header="Value">
              <template #body="slotProps">
                <span v-if="slotProps.data.value" class="claim-value">
                  {{ slotProps.data.value }}
                </span>
                <Tag v-else value="Not present" severity="secondary" />
              </template>
            </Column>
            <Column field="description" header="Description" class="description-col">
              <template #body="slotProps">
                <span class="description-text">{{ slotProps.data.description }}</span>
              </template>
            </Column>
          </DataTable>
        </Panel>

        <!-- Signature Panel -->
        <Panel toggleable class="jwt-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-shield"></i>
              <span>Signature</span>
            </div>
          </template>
          <template #icons>
            <Button
              v-tooltip.top="'Copy Signature'"
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              @click="copySignature"
            />
          </template>

          <div class="signature-value">
            <code>{{ decodedJwt.signature }}</code>
          </div>

          <Message severity="warn" :closable="false" class="signature-warning">
            <div class="warning-content">
              <i class="pi pi-info-circle"></i>
              <span>
                Signature verification requires the secret key and is not performed client-side.
              </span>
            </div>
          </Message>
        </Panel>
      </div>

      <!-- Empty state -->
      <div v-else-if="!error && !jwtInput" class="empty-state">
        <i class="pi pi-key"></i>
        <span>Paste a JWT token above to decode it</span>
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

.input-section {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;

    i {
      color: var(--primary-color);
    }
  }
}

.stats-tags {
  display: flex;
  gap: 0.5rem;
}

.action-toolbar {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 6px;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.mt-3 {
  margin-top: 1rem;
}

.error-content,
.warning-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.decoded-sections {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.expiration-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.expiration-info {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.jwt-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }

  :deep(.p-panel-content) {
    padding: 1rem;
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

.header-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  code {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
  }
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

.claims-table {
  .claim-key {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.85rem;
    color: var(--primary-color);
    background: var(--surface-ground);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }

  .claim-value {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.85rem;
    word-break: break-all;
  }

  .description-text {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
  }
}

.signature-value {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  word-break: break-all;
  margin-bottom: 1rem;

  code {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.85rem;
    color: var(--primary-color);
  }
}

.signature-warning {
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-color-secondary);
  background: var(--surface-ground);
  border-radius: 8px;
  margin-top: 1rem;

  i {
    font-size: 2.5rem;
    color: var(--primary-color);
    opacity: 0.5;
  }
}
</style>
