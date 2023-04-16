<template>
  <Card class="bottom-pad">
    <template v-slot:title> Browser </template>
    <template v-slot:subtitle> Browser information </template>
    <template v-slot:content>
      <div class="grid">
        <div class="col-12">
          <Panel header="User agent">
            {{ userAgent }}
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="Browser">
            <DataTable :value="browserInformation.browser">
              <Column field="name" header="Name" />
              <Column field="version" header="Version" />
            </DataTable>
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="Engine">
            <DataTable :value="browserInformation.engine">
              <Column field="name" header="Name" />
              <Column field="version" header="Version" />
            </DataTable>
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="OS">
            <DataTable :value="browserInformation.os">
              <Column field="name" header="Name" />
              <Column field="version" header="Version" />
            </DataTable>
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="Device">
            <DataTable :value="browserInformation.device">
              <Column field="model" header="Model" />
              <Column field="type" header="Type" />
              <Column field="vendor" header="Vendor" />
            </DataTable>
          </Panel>
        </div>
        <div class="col-12">
          <Panel header="HTTP headers">
            <DataTable
              :value="httpHeaders.headers"
              :paginator="true"
              :rows="10"
              :rowsPerPageOptions="[10, 20, 50]"
              class="datatable-sm"
            >
              <Column
                field="name"
                header="Name"
                :headerStyle="{ width: '200px' }"
                :sortable="true"
              />
              <Column field="value" header="Value" :sortable="true" />
            </DataTable>
          </Panel>
        </div>
      </div>
    </template>
  </Card>
  <Card class="bottom-pad">
    <template v-slot:title> Network </template>
    <template v-slot:subtitle> Client network information </template>
    <template v-slot:content>
      <div class="grid">
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="IP address">
            {{ ipInfo.ipAddress }}
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="Host name">
            {{ ipInfo.hostName }}
          </Panel>
        </div>
        <div class="col-12 md:col-12 lg:col-6">
          <Panel header="Geo location">
            <JsonTreeView :data="JSON.stringify(geo)" :maxDepth="100" />
          </Panel>
        </div>
        <div class="col-12 md:col-12 lg:col-6">
          <Panel header="RDAP infromation">
            <JsonTreeView :data="JSON.stringify(rdap)" :maxDepth="100" />
          </Panel>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import UAParser from 'ua-parser-js'
import { JsonTreeView } from 'json-tree-view-vue3'

import Card from 'primevue/card'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import ApiService from '@/services/ApiService'

const userAgent = window.navigator.userAgent
const uaParser = new UAParser()
const bowserResult = uaParser.getResult()

const [ipInfo, httpHeaders] = await Promise.all([
  ApiService.getIpAddress(),
  ApiService.getHttpHeader(),
])

const ipAddress = ipInfo.ipAddress

const [geo, rdap] = await Promise.all([
  ApiService.getGeo(ipAddress),
  ApiService.getRdap(ipAddress),
])

const browserInformation = {
  browser: [bowserResult.browser],
  engine: [bowserResult.engine],
  os: [bowserResult.os],
  device: [bowserResult.device],
}
</script>

<style lang="scss" scoped>
.bottom-pad {
  margin-bottom: 1rem;
}
</style>
