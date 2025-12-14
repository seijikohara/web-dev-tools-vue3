<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import PanelHeader from '@/components/layout/PanelHeader.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useUrlEncoder } from '@/composables/useUrlEncoder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showError } = useClipboardToast()

const { urlInput, urlParseError, parsedUrl, queryParams, loadSampleUrl, loadUrlToBuilder } =
  useUrlEncoder()

const copyParsedValue = (value: string, label: string) => {
  void copy(value, { detail: `${label} copied to clipboard` })
}

const handleLoadUrlToBuilder = () => {
  const success = loadUrlToBuilder()
  if (!success) {
    showError('Error', 'Invalid URL')
  }
}
</script>

<template>
  <Panel toggleable class="url-input-panel">
    <template #header>
      <PanelHeader icon="globe">
        URL to Parse
        <Tag
          v-if="urlInput && !urlParseError"
          value="Valid URL"
          severity="success"
          icon="pi pi-check-circle"
        />
        <Tag
          v-else-if="urlParseError"
          value="Invalid"
          severity="danger"
          icon="pi pi-times-circle"
        />
      </PanelHeader>
    </template>

    <InputGroup>
      <InputGroupAddon>
        <i class="pi pi-link"></i>
      </InputGroupAddon>
      <InputText v-model="urlInput" placeholder="https://example.com/path?query=value#hash" />
      <Button
        v-tooltip.top="'Load Sample'"
        icon="pi pi-file"
        severity="info"
        text
        @click="loadSampleUrl"
      />
      <Button
        label="Load to Builder"
        icon="pi pi-arrow-right"
        severity="secondary"
        :disabled="!parsedUrl"
        @click="handleLoadUrlToBuilder"
      />
    </InputGroup>
  </Panel>

  <Message v-if="urlParseError" severity="error" :closable="false" class="error-message">
    <i class="pi pi-times-circle"></i>
    {{ urlParseError }}
  </Message>

  <div v-if="parsedUrl" class="parsed-results">
    <SectionDivider icon="list"> Parsed Components </SectionDivider>

    <div class="component-grid">
      <div v-if="parsedUrl.protocol" class="component-item">
        <Tag value="Protocol" severity="secondary" />
        <code class="component-value">{{ parsedUrl.protocol }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.protocol, 'Protocol')"
        />
      </div>
      <div v-if="parsedUrl.hostname" class="component-item">
        <Tag value="Hostname" severity="secondary" />
        <code class="component-value">{{ parsedUrl.hostname }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.hostname, 'Hostname')"
        />
      </div>
      <div v-if="parsedUrl.port" class="component-item">
        <Tag value="Port" severity="secondary" />
        <code class="component-value">{{ parsedUrl.port }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.port, 'Port')"
        />
      </div>
      <div v-if="parsedUrl.pathname" class="component-item">
        <Tag value="Pathname" severity="secondary" />
        <code class="component-value">{{ parsedUrl.pathname }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.pathname, 'Pathname')"
        />
      </div>
      <div v-if="parsedUrl.search" class="component-item">
        <Tag value="Search" severity="info" />
        <code class="component-value">{{ parsedUrl.search }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.search, 'Search')"
        />
      </div>
      <div v-if="parsedUrl.hash" class="component-item">
        <Tag value="Hash" severity="warn" />
        <code class="component-value">{{ parsedUrl.hash }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.hash, 'Hash')"
        />
      </div>
      <div v-if="parsedUrl.origin" class="component-item">
        <Tag value="Origin" severity="success" />
        <code class="component-value">{{ parsedUrl.origin }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.origin, 'Origin')"
        />
      </div>
      <div v-if="parsedUrl.username" class="component-item">
        <Tag value="Username" severity="contrast" />
        <code class="component-value">{{ parsedUrl.username }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.username, 'Username')"
        />
      </div>
      <div v-if="parsedUrl.password" class="component-item">
        <Tag value="Password" severity="danger" />
        <code class="component-value">{{ parsedUrl.password }}</code>
        <Button
          v-tooltip.top="'Copy'"
          icon="pi pi-copy"
          severity="secondary"
          text
          rounded
          @click="copyParsedValue(parsedUrl.password, 'Password')"
        />
      </div>
    </div>

    <div v-if="queryParams.length > 0" class="query-params">
      <SectionDivider icon="filter">
        Query Parameters
        <Tag :value="`${queryParams.length} params`" severity="info" />
      </SectionDivider>

      <DataTable :value="queryParams" striped-rows size="small">
        <Column field="key" header="Key">
          <template #body="slotProps">
            <code class="param-key">{{ slotProps.data.key }}</code>
          </template>
        </Column>
        <Column field="value" header="Value (Decoded)">
          <template #body="slotProps">
            <code>{{ slotProps.data.value }}</code>
          </template>
        </Column>
        <Column field="encodedValue" header="Value (Encoded)">
          <template #body="slotProps">
            <code class="encoded-value">{{ slotProps.data.encodedValue }}</code>
          </template>
        </Column>
        <Column :header-style="{ width: '60px' }">
          <template #body="slotProps">
            <Button
              v-tooltip.top="'Copy'"
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              @click="copyParsedValue(slotProps.data.value, slotProps.data.key)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.url-input-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.error-message {
  margin: 1rem 0;

  i {
    margin-right: 0.5rem;
  }
}

.parsed-results {
  margin-top: 1rem;
}

.component-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 6px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .component-value {
    flex: 1;
    font-size: 0.9rem;
    word-break: break-all;
    color: var(--primary-color);
  }
}

.query-params {
  margin-top: 1rem;
}

.param-key {
  color: var(--primary-color);
  font-weight: 600;
}

.encoded-value {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}
</style>
