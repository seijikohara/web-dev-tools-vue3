<script setup lang="ts">
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'

import CopyButton from '@/components/display/CopyButton.vue'

import { useIpLookup } from '@/composables/useIpLookup'

const { geoData, geoTableData } = useIpLookup()
</script>

<template>
  <div v-if="geoData" class="geo-content">
    <div v-if="geoData.latitude != null && geoData.longitude != null" class="geo-map-link">
      <a
        :href="`https://www.google.com/maps?q=${geoData.latitude},${geoData.longitude}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button label="Open in Google Maps" icon="pi pi-external-link" severity="info" outlined />
      </a>
    </div>

    <DataTable :value="geoTableData" striped-rows size="small" class="info-table">
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
  <Message v-else severity="warn" :closable="false">No GEO data available</Message>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.geo-content {
  h4 {
    margin: 0 0 1rem;
    color: var(--text-color);
    font-size: 1rem;
  }
}

.geo-map-link {
  margin-bottom: 1rem;
}

.info-table {
  margin-bottom: 1rem;
}

.property-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}
</style>
