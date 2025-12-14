<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import PanelHeader from '@/components/layout/PanelHeader.vue'

import { useIpLookup, SAMPLE_LOOKUPS } from '@/composables/useIpLookup'

const {
  // State
  input,
  isLoading,
  error,
  resolvedIps,
  isDnsResolved,

  // Computed
  inputType,
  ptrHostname,

  // Actions
  lookup,
  clearAll,
  loadSample,
} = useIpLookup()

// Auto-lookup on input change (debounced)
watchDebounced(
  input,
  newValue => {
    if (newValue.trim() && inputType.value !== 'invalid') {
      void lookup()
    }
  },
  { debounce: 500 },
)
</script>

<template>
  <!-- Input Section -->
  <Panel class="input-panel">
    <template #header>
      <PanelHeader icon="search">
        Lookup
        <Tag
          v-if="inputType"
          :value="inputType === 'invalid' ? 'Invalid' : inputType.toUpperCase()"
          :severity="inputType === 'invalid' ? 'danger' : 'info'"
        />
      </PanelHeader>
    </template>

    <div class="input-content">
      <div class="input-row">
        <InputText
          v-model="input"
          placeholder="Enter IP address or hostname (e.g., 8.8.8.8 or google.com)"
          class="lookup-input"
          :invalid="inputType === 'invalid'"
          @keydown.enter="lookup"
        />
        <Button
          icon="pi pi-search"
          label="Lookup"
          :loading="isLoading"
          :disabled="!input.trim() || inputType === 'invalid'"
          @click="lookup"
        />
      </div>

      <!-- Resolved IPs display -->
      <div v-if="isDnsResolved" class="resolved-info">
        <div v-if="resolvedIps.ipv4.length > 0" class="resolved-group">
          <Tag severity="success" icon="pi pi-check-circle">
            IPv4: {{ resolvedIps.ipv4.join(', ') }}
          </Tag>
        </div>
        <div v-if="resolvedIps.ipv6.length > 0" class="resolved-group">
          <Tag severity="info" icon="pi pi-check-circle">
            IPv6: {{ resolvedIps.ipv6.join(', ') }}
          </Tag>
        </div>
      </div>

      <!-- PTR record display for IP lookups -->
      <div v-if="ptrHostname && (inputType === 'ipv4' || inputType === 'ipv6')" class="ptr-info">
        <Tag severity="secondary" icon="pi pi-arrow-right-arrow-left">
          Reverse DNS: {{ ptrHostname }}
        </Tag>
      </div>
    </div>

    <Toolbar class="input-toolbar">
      <template #start>
        <span class="samples-label">Samples:</span>
        <Button
          v-for="sample in SAMPLE_LOOKUPS"
          :key="sample.value"
          :label="sample.label"
          severity="secondary"
          text
          @click="loadSample(sample.value)"
        />
      </template>
      <template #end>
        <Button
          v-tooltip.top="'Clear'"
          aria-label="Clear"
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :disabled="!input"
          @click="clearAll"
        />
      </template>
    </Toolbar>
  </Panel>

  <!-- Error Message -->
  <Message v-if="error" severity="error" :closable="false" class="error-message">
    <i class="pi pi-times-circle"></i>
    {{ error }}
  </Message>

  <!-- Loading -->
  <div v-if="isLoading" class="loading-container">
    <ProgressSpinner style="width: 50px; height: 50px" />
    <span>Looking up...</span>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.input-panel {
  margin-bottom: 1rem;
}

.input-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .lookup-input {
    flex: 1;
    min-width: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
}

.resolved-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resolved-group {
  display: flex;
  align-items: center;
}

.ptr-info {
  display: flex;
  align-items: center;
}

.input-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;
  margin-top: 0.5rem;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .samples-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    :deep(.p-toolbar-start) {
      flex: 1 1 100%;
      justify-content: flex-start;
    }

    :deep(.p-toolbar-end) {
      flex: 0 0 auto;
      margin-top: 0.5rem;
    }
  }
}

.error-message {
  margin: 1rem 0;

  i {
    margin-right: 0.5rem;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-color-secondary);
}
</style>
