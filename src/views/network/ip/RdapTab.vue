<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'

import CopyButton from '@/components/display/CopyButton.vue'

import { useIpLookup } from '@/composables/useIpLookup'

const { rdapData, rdapBasicInfo } = useIpLookup()
</script>

<template>
  <div v-if="rdapData" class="rdap-content">
    <h4>Network Information</h4>
    <DataTable :value="rdapBasicInfo" striped-rows size="small" class="info-table">
      <Column field="label" header="Property" :header-style="{ width: '150px' }">
        <template #body="slotProps">
          <span class="property-label">{{ slotProps.data.label }}</span>
        </template>
      </Column>
      <Column field="value" header="Value">
        <template #body="slotProps">
          <code class="code-value">{{ slotProps.data.value }}</code>
        </template>
      </Column>
      <Column :header-style="{ width: '60px' }">
        <template #body="slotProps">
          <CopyButton :value="slotProps.data.value" />
        </template>
      </Column>
    </DataTable>
  </div>
  <Message v-else severity="warn" :closable="false">
    No RDAP data available (RDAP lookup may not be supported for this IP range)
  </Message>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.rdap-content {
  h4 {
    margin: 0 0 1rem;
    color: var(--text-color);
    font-size: 1rem;
  }
}

.info-table {
  margin-bottom: 1rem;
}

.property-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}
</style>
