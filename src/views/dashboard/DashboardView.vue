<script setup lang="ts">
import { UAParser } from 'ua-parser-js'
import { JsonTreeView } from 'json-tree-view-vue3'
import 'json-tree-view-vue3/style.css'

import Card from 'primevue/card'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

import { getIpAddress, getHttpHeaders, getGeoInfo, getRdapInfo } from '@/api'

const userAgent = navigator.userAgent
const uaParser = new UAParser()
const uaParserResult = uaParser.getResult()

const [ipInfo, httpHeaders] = await Promise.all([getIpAddress(), getHttpHeaders()])

const ipAddress = ipInfo.ipAddress

const [geo, rdap] = await Promise.all([
  getGeoInfo(ipAddress).catch(() => ({
    result: 'No Geo location information found',
  })),
  getRdapInfo(ipAddress).catch(() => ({
    result: 'No RDAP information found',
  })),
])

const browserInformation = {
  browser: [uaParserResult.browser],
  engine: [uaParserResult.engine],
  os: [uaParserResult.os],
  device: [uaParserResult.device],
}
</script>

<template>
  <Card class="dashboard-card">
    <template #title>
      <div class="card-title">
        <i class="pi pi-desktop"></i>
        <span>Browser</span>
      </div>
    </template>
    <template #subtitle> Browser and client environment information </template>
    <template #content>
      <Panel toggleable class="user-agent-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-id-card"></i>
            <span>User Agent</span>
          </div>
        </template>
        <code class="user-agent-text">{{ userAgent }}</code>
      </Panel>

      <Divider align="left">
        <span class="divider-text">
          <i class="pi pi-info-circle"></i>
          Browser Details
        </span>
      </Divider>

      <div class="info-grid">
        <Panel toggleable class="info-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-globe"></i>
              <span>Browser</span>
              <Tag
                v-if="browserInformation.browser[0]?.name"
                :value="browserInformation.browser[0].name"
                severity="info"
              />
            </div>
          </template>
          <DataTable :value="browserInformation.browser" class="compact-table">
            <Column field="name" header="Name">
              <template #body="{ data }">
                <Tag :value="data.name || 'Unknown'" severity="secondary" />
              </template>
            </Column>
            <Column field="version" header="Version">
              <template #body="{ data }">
                <span class="version-text">{{ data.version || 'N/A' }}</span>
              </template>
            </Column>
          </DataTable>
        </Panel>

        <Panel toggleable class="info-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-cog"></i>
              <span>Engine</span>
              <Tag
                v-if="browserInformation.engine[0]?.name"
                :value="browserInformation.engine[0].name"
                severity="secondary"
              />
            </div>
          </template>
          <DataTable :value="browserInformation.engine" class="compact-table">
            <Column field="name" header="Name">
              <template #body="{ data }">
                <Tag :value="data.name || 'Unknown'" severity="secondary" />
              </template>
            </Column>
            <Column field="version" header="Version">
              <template #body="{ data }">
                <span class="version-text">{{ data.version || 'N/A' }}</span>
              </template>
            </Column>
          </DataTable>
        </Panel>

        <Panel toggleable class="info-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-server"></i>
              <span>Operating System</span>
              <Tag
                v-if="browserInformation.os[0]?.name"
                :value="browserInformation.os[0].name"
                severity="success"
              />
            </div>
          </template>
          <DataTable :value="browserInformation.os" class="compact-table">
            <Column field="name" header="Name">
              <template #body="{ data }">
                <Tag :value="data.name || 'Unknown'" severity="secondary" />
              </template>
            </Column>
            <Column field="version" header="Version">
              <template #body="{ data }">
                <span class="version-text">{{ data.version || 'N/A' }}</span>
              </template>
            </Column>
          </DataTable>
        </Panel>

        <Panel toggleable class="info-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-tablet"></i>
              <span>Device</span>
              <Tag
                v-if="browserInformation.device[0]?.type"
                :value="browserInformation.device[0].type"
                severity="warn"
              />
            </div>
          </template>
          <DataTable :value="browserInformation.device" class="compact-table">
            <Column field="model" header="Model">
              <template #body="{ data }">
                <Tag :value="data.model || 'N/A'" severity="secondary" />
              </template>
            </Column>
            <Column field="type" header="Type">
              <template #body="{ data }">
                <span>{{ data.type || 'Desktop' }}</span>
              </template>
            </Column>
            <Column field="vendor" header="Vendor">
              <template #body="{ data }">
                <span>{{ data.vendor || 'N/A' }}</span>
              </template>
            </Column>
          </DataTable>
        </Panel>
      </div>

      <Divider align="left">
        <span class="divider-text">
          <i class="pi pi-list"></i>
          HTTP Headers
          <Tag :value="`${httpHeaders.headers?.length || 0} headers`" severity="info" />
        </span>
      </Divider>

      <Panel toggleable class="headers-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-file"></i>
            <span>Request Headers</span>
          </div>
        </template>
        <DataTable
          :value="httpHeaders.headers"
          :paginator="true"
          :rows="10"
          :rows-per-page-options="[10, 20, 50]"
          striped-rows
          class="headers-table"
        >
          <Column field="name" header="Name" :sortable="true" style="width: 250px">
            <template #body="{ data }">
              <code class="header-name">{{ data.name }}</code>
            </template>
          </Column>
          <Column field="value" header="Value" :sortable="true">
            <template #body="{ data }">
              <span class="header-value">{{ data.value }}</span>
            </template>
          </Column>
        </DataTable>
      </Panel>
    </template>
  </Card>

  <Card class="dashboard-card">
    <template #title>
      <div class="card-title">
        <i class="pi pi-wifi"></i>
        <span>Network</span>
      </div>
    </template>
    <template #subtitle> Client network and geolocation information </template>
    <template #content>
      <div class="network-info-grid">
        <Panel toggleable class="network-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-at"></i>
              <span>IP Address</span>
              <Tag :value="ipInfo.ipAddress" severity="info" icon="pi pi-check-circle" />
            </div>
          </template>
          <div class="ip-display">
            <code class="ip-value">{{ ipInfo.ipAddress }}</code>
          </div>
        </Panel>

        <Panel toggleable class="network-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-home"></i>
              <span>Host Name</span>
            </div>
          </template>
          <div class="ip-display">
            <code class="ip-value">{{ ipInfo.hostName || 'N/A' }}</code>
          </div>
        </Panel>
      </div>

      <Divider align="left">
        <span class="divider-text">
          <i class="pi pi-map-marker"></i>
          Location & Registry
        </span>
      </Divider>

      <div class="network-details-grid">
        <Panel toggleable class="json-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-map"></i>
              <span>Geo Location</span>
              <Tag value="GeoIP" severity="success" />
            </div>
          </template>
          <div class="json-tree-container">
            <JsonTreeView :json="JSON.stringify(geo)" :max-depth="100" />
          </div>
        </Panel>

        <Panel toggleable class="json-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-database"></i>
              <span>RDAP Information</span>
              <Tag value="Registry" severity="secondary" />
            </div>
          </template>
          <div class="json-tree-container">
            <JsonTreeView :json="JSON.stringify(rdap)" :max-depth="100" />
          </div>
        </Panel>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.dashboard-card {
  margin-bottom: 1.5rem;
}

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

.user-agent-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.user-agent-text {
  display: block;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 6px;
  word-break: break-all;
  line-height: 1.5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.info-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }

  :deep(.p-panel-content) {
    padding: 0;
  }
}

.compact-table {
  :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

.version-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: var(--primary-color);
}

.headers-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.headers-table {
  :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 1rem;
  }

  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 1rem;
  }
}

.header-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  color: var(--primary-color);
  background-color: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.header-value {
  font-size: 0.85rem;
  word-break: break-all;
}

.network-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.network-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.ip-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.ip-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.25rem;
  color: var(--primary-color);
  background-color: var(--surface-ground);
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.network-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.json-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.json-tree-container {
  max-height: 400px;
  overflow: auto;
  padding: 0.5rem;
  background-color: var(--surface-ground);
  border-radius: 6px;
}
</style>
