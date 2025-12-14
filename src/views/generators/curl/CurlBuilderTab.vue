<script setup lang="ts">
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import Divider from 'primevue/divider'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import {
  useCurlBuilder,
  METHOD_OPTIONS,
  BODY_TYPE_OPTIONS,
  COMMON_HEADERS,
} from '@/composables/useCurlBuilder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess } = useClipboardToast()

// Use composable
const {
  method,
  url,
  headers,
  queryParams,
  body,
  bodyType,
  options,
  curlCommand,
  enabledHeadersCount,
  enabledParamsCount,
  addHeader,
  removeHeader,
  addQueryParam,
  removeQueryParam,
  loadSample,
  resetAll,
} = useCurlBuilder()

// UI actions with toast notifications
const onClickCopy = () => {
  showSuccess('Copied', 'cURL command copied to clipboard')
}

const onClickSample = () => {
  loadSample()
  showSuccess('Loaded', 'Sample request loaded')
}
</script>

<template>
  <div class="builder-layout">
    <!-- Request Section -->
    <div class="request-section">
      <!-- URL Bar -->
      <div class="url-bar">
        <Select
          v-model="method"
          :options="METHOD_OPTIONS"
          option-label="label"
          option-value="value"
          class="method-select"
        />
        <InputText v-model="url" placeholder="https://api.example.com/endpoint" class="url-input" />
        <Button icon="pi pi-send" label="Copy" :disabled="!url" @click="onClickCopy" />
      </div>

      <!-- Tabs for Headers, Params, Body -->
      <Tabs value="0" class="request-tabs">
        <TabList>
          <Tab value="0">
            <span>Headers</span>
            <Tag
              v-if="enabledHeadersCount > 0"
              :value="String(enabledHeadersCount)"
              severity="info"
              class="tab-badge"
            />
          </Tab>
          <Tab value="1">
            <span>Query Params</span>
            <Tag
              v-if="enabledParamsCount > 0"
              :value="String(enabledParamsCount)"
              severity="info"
              class="tab-badge"
            />
          </Tab>
          <Tab value="2">Body</Tab>
          <Tab value="3">Options</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div class="key-value-list">
              <div v-for="(header, index) in headers" :key="index" class="key-value-row">
                <ToggleSwitch v-model="header.enabled" />
                <Select
                  v-model="header.key"
                  :options="COMMON_HEADERS"
                  option-label="label"
                  option-value="value"
                  placeholder="Header name"
                  editable
                  class="key-input"
                />
                <InputText v-model="header.value" placeholder="Value" class="value-input" />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="removeHeader(index)"
                />
              </div>
              <Button
                icon="pi pi-plus"
                label="Add Header"
                severity="secondary"
                text
                size="small"
                @click="addHeader"
              />
            </div>
          </TabPanel>

          <TabPanel value="1">
            <div class="key-value-list">
              <div v-for="(param, index) in queryParams" :key="index" class="key-value-row">
                <ToggleSwitch v-model="param.enabled" />
                <InputText v-model="param.key" placeholder="Parameter name" class="key-input" />
                <InputText v-model="param.value" placeholder="Value" class="value-input" />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="removeQueryParam(index)"
                />
              </div>
              <Button
                icon="pi pi-plus"
                label="Add Parameter"
                severity="secondary"
                text
                size="small"
                @click="addQueryParam"
              />
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="body-section">
              <div class="body-type-select">
                <Select
                  v-model="bodyType"
                  :options="BODY_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Body type"
                />
              </div>
              <CodeEditor
                v-if="bodyType !== 'none'"
                v-model="body"
                :mode="bodyType === 'json' ? 'json' : 'plain_text'"
                height="200px"
              />
            </div>
          </TabPanel>

          <TabPanel value="3">
            <div class="options-grid">
              <div class="option-item">
                <ToggleSwitch v-model="options.followRedirects" input-id="followRedirects" />
                <label for="followRedirects">Follow Redirects (-L)</label>
              </div>
              <div class="option-item">
                <ToggleSwitch v-model="options.insecure" input-id="insecure" />
                <label for="insecure">Insecure / Skip SSL (-k)</label>
              </div>
              <div class="option-item">
                <ToggleSwitch v-model="options.verbose" input-id="verbose" />
                <label for="verbose">Verbose (-v)</label>
              </div>
              <div class="option-item">
                <ToggleSwitch v-model="options.silent" input-id="silent" />
                <label for="silent">Silent (-s)</label>
              </div>
              <div class="option-item">
                <ToggleSwitch v-model="options.compressed" input-id="compressed" />
                <label for="compressed">Compressed</label>
              </div>

              <Divider />

              <div class="option-input-row">
                <label>Connect Timeout (seconds)</label>
                <InputNumber v-model="options.timeout" :min="0" show-buttons />
              </div>
              <div class="option-input-row">
                <label>Max Time (seconds)</label>
                <InputNumber v-model="options.maxTime" :min="0" show-buttons />
              </div>
              <div class="option-input-row">
                <label>Output File (-o)</label>
                <InputText v-model="options.output" placeholder="output.json" />
              </div>
              <div class="option-input-row">
                <label>Proxy (-x)</label>
                <InputText v-model="options.proxy" placeholder="http://proxy:8080" />
              </div>
              <div class="option-input-row">
                <label>User Agent (-A)</label>
                <InputText v-model="options.userAgent" placeholder="Mozilla/5.0..." />
              </div>
              <div class="option-input-row">
                <label>Basic Auth (-u)</label>
                <InputText v-model="options.basicAuth" placeholder="user:password" />
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Output Section -->
    <div class="output-section">
      <Panel>
        <template #header>
          <PanelHeader icon="terminal">Generated Command</PanelHeader>
        </template>

        <CodeEditor :model-value="curlCommand" mode="plain_text" height="200px" :readonly="true" />

        <Toolbar class="editor-toolbar">
          <template #start>
            <Button icon="pi pi-file" label="Sample" severity="info" text @click="onClickSample" />
          </template>
          <template #end>
            <CopyButton
              :value="curlCommand"
              label="Copy"
              tooltip="Command copied to clipboard"
              :disabled="!curlCommand"
              @copied="onClickCopy"
            />
            <Button icon="pi pi-refresh" severity="secondary" text @click="resetAll" />
          </template>
        </Toolbar>
      </Panel>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.builder-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.url-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;

  .method-select {
    width: 120px;
    flex-shrink: 0;
  }

  .url-input {
    flex: 1;
    min-width: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  @media (max-width: 480px) {
    .method-select {
      width: 100px;
    }

    > button {
      width: 100%;
      justify-content: center;
    }
  }
}

.request-tabs {
  :deep(.p-tabview-panels) {
    padding: 1rem 0;
  }
}

.tab-badge {
  margin-left: 0.5rem;
}

.key-value-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.key-value-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .key-input {
    flex: 1;
    min-width: 150px;
  }

  .value-input {
    flex: 2;
  }
}

.body-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .body-type-select {
    width: 200px;
  }
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  label {
    cursor: pointer;
  }
}

.option-input-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 600;
    font-size: 0.85rem;
  }
}

.output-section {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}
</style>
