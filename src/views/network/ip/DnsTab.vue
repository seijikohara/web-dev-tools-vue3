<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

import CopyButton from '@/components/display/CopyButton.vue'

import { useIpLookup, DNS_TYPE_OPTIONS } from '@/composables/useIpLookup'

const { input, selectedDnsType, isDnsLoading, dnsError, dnsData, dnsRecordsData, fetchDnsRecords } =
  useIpLookup()
</script>

<template>
  <div class="dns-content">
    <div class="dns-controls">
      <div class="dns-type-select">
        <label>Record Type:</label>
        <Select
          v-model="selectedDnsType"
          :options="DNS_TYPE_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="Select type"
          class="dns-select"
        >
          <template #option="slotProps">
            <div class="dns-option">
              <strong>{{ slotProps.option.label }}</strong>
              <span class="dns-option-desc">{{ slotProps.option.description }}</span>
            </div>
          </template>
        </Select>
        <Button
          icon="pi pi-refresh"
          label="Lookup"
          :loading="isDnsLoading"
          :disabled="!input.trim()"
          @click="fetchDnsRecords"
        />
      </div>
    </div>

    <Message v-if="dnsError" severity="error" :closable="false" class="dns-error">
      {{ dnsError }}
    </Message>

    <div v-if="isDnsLoading" class="dns-loading">
      <ProgressSpinner style="width: 30px; height: 30px" />
      <span>Loading DNS records...</span>
    </div>

    <div v-else-if="dnsRecordsData.length > 0" class="dns-results">
      <DataTable :value="dnsRecordsData" striped-rows size="small" class="info-table">
        <Column field="name" header="Name">
          <template #body="slotProps">
            <code class="code-value">{{ slotProps.data.name }}</code>
          </template>
        </Column>
        <Column field="type" header="Type" :header-style="{ width: '80px' }">
          <template #body="slotProps">
            <Tag :value="slotProps.data.type" severity="info" />
          </template>
        </Column>
        <Column field="ttl" header="TTL" :header-style="{ width: '100px' }">
          <template #body="slotProps">
            <code class="code-value">{{ slotProps.data.ttl }}s</code>
          </template>
        </Column>
        <Column field="data" header="Data">
          <template #body="slotProps">
            <code class="code-value dns-data">{{ slotProps.data.data }}</code>
          </template>
        </Column>
        <Column :header-style="{ width: '60px' }">
          <template #body="slotProps">
            <CopyButton :value="slotProps.data.data" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Message v-else-if="dnsData" severity="info" :closable="false">
      No {{ selectedDnsType }} records found
    </Message>

    <Message v-else severity="secondary" :closable="false">
      Enter a hostname and select a record type to lookup DNS records
    </Message>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.dns-content {
  h4 {
    margin: 0 0 1rem;
    color: var(--text-color);
    font-size: 1rem;
  }
}

.dns-controls {
  margin-bottom: 1rem;
}

.dns-type-select {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;

  label {
    font-weight: 600;
    color: var(--text-color-secondary);
  }

  .dns-select {
    min-width: 0;
    flex: 1;
  }
}

.dns-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .dns-option-desc {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
  }
}

.dns-error {
  margin-bottom: 1rem;
}

.dns-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--text-color-secondary);
}

.dns-results {
  margin-top: 1rem;
}

.info-table {
  margin-bottom: 1rem;
}

.dns-data {
  word-break: break-all;
}
</style>
