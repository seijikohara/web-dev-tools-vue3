<script setup lang="ts">
import Divider from 'primevue/divider'

import { useIpLookup } from '@/composables/useIpLookup'

const { geoData, rdapData, dnsData, ptrData } = useIpLookup()
</script>

<template>
  <div class="raw-data-content">
    <h4>GEO Data (JSON)</h4>
    <pre class="raw-json">{{ JSON.stringify(geoData, null, 2) }}</pre>

    <Divider />

    <h4>RDAP Data (JSON)</h4>
    <pre class="raw-json">{{ JSON.stringify(rdapData, null, 2) }}</pre>

    <Divider />

    <h4>DNS Data (JSON)</h4>
    <pre class="raw-json">{{ JSON.stringify(dnsData, null, 2) }}</pre>

    <template v-if="ptrData">
      <Divider />
      <h4>PTR Data (JSON)</h4>
      <pre class="raw-json">{{ JSON.stringify(ptrData, null, 2) }}</pre>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.raw-data-content {
  h4 {
    margin: 0 0 0.5rem;
    color: var(--text-color);
    font-size: 1rem;
  }
}

.raw-json {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  max-height: 400px;
  margin: 0;
}
</style>
