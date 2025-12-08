<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Divider from 'primevue/divider'
import Select from 'primevue/select'

import { useClipboardToast } from '@/composables/useClipboardToast'
import { useIpLookup, DNS_TYPE_OPTIONS, SAMPLE_LOOKUPS } from '@/composables/useIpLookup'

const { copy } = useClipboardToast()

const {
  // State
  input,
  isLoading,
  error,
  resolvedIps,
  isDnsResolved,

  // API data
  geoData,
  rdapData,
  dnsData,
  ptrData,

  // DNS state
  selectedDnsType,
  isDnsLoading,
  dnsError,

  // Computed
  inputType,
  geoTableData,
  rdapBasicInfo,
  dnsRecordsData,
  ptrHostname,
  hasResults,

  // Actions
  lookup,
  fetchDnsRecords,
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

// Copy value
const copyValue = (value: string) => {
  void copy(value, { detail: 'Value copied to clipboard' })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-globe"></i>
        <span>IP / Host Lookup</span>
      </div>
    </template>
    <template #subtitle>
      Look up GEO location, RDAP registration, and DNS records for IP addresses or hostnames
    </template>
    <template #content>
      <!-- Input Section -->
      <Panel class="input-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-search"></i>
            <span>Lookup</span>
            <Tag
              v-if="inputType"
              :value="inputType === 'invalid' ? 'Invalid' : inputType.toUpperCase()"
              :severity="inputType === 'invalid' ? 'danger' : 'info'"
            />
          </div>
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
          <div
            v-if="ptrHostname && (inputType === 'ipv4' || inputType === 'ipv6')"
            class="ptr-info"
          >
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

      <!-- Results -->
      <div v-else-if="hasResults" class="results-section">
        <Tabs value="0">
          <TabList>
            <Tab value="0">GEO Location</Tab>
            <Tab value="1">RDAP / Whois</Tab>
            <Tab value="2">DNS Records</Tab>
            <Tab value="3">Raw Data</Tab>
          </TabList>
          <TabPanels>
            <!-- GEO Tab -->
            <TabPanel value="0">
              <div v-if="geoData" class="geo-content">
                <div
                  v-if="geoData.latitude != null && geoData.longitude != null"
                  class="geo-map-link"
                >
                  <a
                    :href="`https://www.google.com/maps?q=${geoData.latitude},${geoData.longitude}`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      label="Open in Google Maps"
                      icon="pi pi-external-link"
                      severity="info"
                      outlined
                    />
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
                      <code class="property-value">{{ slotProps.data.value }}</code>
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
                        @click="copyValue(slotProps.data.value)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
              <Message v-else severity="warn" :closable="false"> No GEO data available </Message>
            </TabPanel>

            <!-- RDAP Tab -->
            <TabPanel value="1">
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
                      <code class="property-value">{{ slotProps.data.value }}</code>
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
                        @click="copyValue(slotProps.data.value)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
              <Message v-else severity="warn" :closable="false">
                No RDAP data available (RDAP lookup may not be supported for this IP range)
              </Message>
            </TabPanel>

            <!-- DNS Records Tab -->
            <TabPanel value="2">
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
                        <code class="property-value">{{ slotProps.data.name }}</code>
                      </template>
                    </Column>
                    <Column field="type" header="Type" :header-style="{ width: '80px' }">
                      <template #body="slotProps">
                        <Tag :value="slotProps.data.type" severity="info" />
                      </template>
                    </Column>
                    <Column field="ttl" header="TTL" :header-style="{ width: '100px' }">
                      <template #body="slotProps">
                        <code class="property-value">{{ slotProps.data.ttl }}s</code>
                      </template>
                    </Column>
                    <Column field="data" header="Data">
                      <template #body="slotProps">
                        <code class="property-value dns-data">{{ slotProps.data.data }}</code>
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
                          @click="copyValue(slotProps.data.data)"
                        />
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
            </TabPanel>

            <!-- Raw Data Tab -->
            <TabPanel value="3">
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
            </TabPanel>
          </TabPanels>
        </Tabs>
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

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  i {
    color: var(--primary-color);
  }
}

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

.results-section {
  margin-top: 1rem;
}

.geo-content,
.rdap-content,
.dns-content {
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

.property-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;

  &.dns-data {
    word-break: break-all;
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
