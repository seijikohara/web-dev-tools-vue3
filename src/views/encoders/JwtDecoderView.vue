<script setup lang="ts">
import { useClipboardToast } from '@/composables/useClipboardToast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import { useJwtDecoder } from '@/composables/useJwtDecoder'

const { copy } = useClipboardToast()

// Use composable
const {
  jwtInput,
  error,
  decodedJwt,
  headerJson,
  payloadJson,
  isExpired,
  expirationInfo,
  standardClaims,
  jwtStats,
  hasInput,
  claimsCount,
  loadSample,
  clear: clearInput,
} = useJwtDecoder()

// UI actions with toast notifications
const copyHeader = () => {
  void copy(headerJson.value, { detail: 'Header copied to clipboard' })
}

const copyPayload = () => {
  void copy(payloadJson.value, { detail: 'Payload copied to clipboard' })
}

const copySignature = () => {
  if (decodedJwt.value) {
    void copy(decodedJwt.value.signature, { detail: 'Signature copied to clipboard' })
  }
}
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
              v-tooltip.top="'Load Sample'"
              label="Sample"
              icon="pi pi-file"
              severity="info"
              text
              @click="loadSample"
            />
          </template>
          <template #end>
            <Button
              v-tooltip.top="'Clear'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="!hasInput"
              @click="clearInput"
            />
          </template>
        </Toolbar>
      </div>

      <Transition name="fade-slide">
        <Message v-if="error" severity="error" :closable="false" class="mt-3">
          <div class="error-content">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
        </Message>
      </Transition>

      <Transition name="fade-slide">
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
                <Tag :value="`${claimsCount} claims`" severity="secondary" />
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

            <DataTable :value="standardClaims" striped-rows size="small" class="claims-table">
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
      </Transition>

      <!-- Empty state -->
      <Transition name="fade">
        <div v-if="!decodedJwt && !error && !jwtInput" class="empty-state">
          <i class="pi pi-key"></i>
          <span>Paste a JWT token above to decode it</span>
        </div>
      </Transition>
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
