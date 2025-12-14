<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import CopyButton from '@/components/display/CopyButton.vue'

import { useTimestampConverter } from '@/composables/useTimestampConverter'

const { currentTimeFormats } = useTimestampConverter()
</script>

<template>
  <div class="current-time-section">
    <div class="live-indicator">
      <Tag value="LIVE" severity="success" icon="pi pi-circle-fill" />
      <span class="live-text">Real-time clock</span>
    </div>

    <DataTable :value="currentTimeFormats" striped-rows size="small" class="formats-table">
      <Column field="label" header="Format" style="width: 200px">
        <template #body="slotProps">
          <div class="format-label">
            <i :class="slotProps.data.icon"></i>
            <span>{{ slotProps.data.label }}</span>
          </div>
        </template>
      </Column>
      <Column field="value" header="Value">
        <template #body="slotProps">
          <code class="value-text">{{ slotProps.data.value }}</code>
        </template>
      </Column>
      <Column style="width: 80px">
        <template #body="slotProps">
          <CopyButton
            :value="slotProps.data.value"
            :tooltip="`${slotProps.data.label} copied to clipboard`"
            icon-only
            rounded
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.current-time-section {
  .live-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    background: var(--surface-ground);
    border-radius: 6px;
  }

  .live-text {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
  }
}

.formats-table {
  .format-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: var(--primary-color);
    }
  }

  .value-text {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
  }
}
</style>
