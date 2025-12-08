<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import SelectButton from 'primevue/selectbutton'

import CodeEditor from '@/components/editors/CodeEditor.vue'

import {
  useUrlEncoder,
  ENCODING_MODE_OPTIONS,
  ENCODING_EXAMPLES,
} from '@/composables/useUrlEncoder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showSuccess, showError } = useClipboardToast()

// Use composable
const {
  // Encode/Decode
  inputText,
  outputText,
  encodeError,
  encodingMode,
  inputStats,
  outputStats,
  swapValues,
  decodeOutput,
  loadSample,
  clearAll,

  // URL Parser
  urlInput,
  urlParseError,
  parsedUrl,
  queryParams,
  loadSampleUrl,

  // Query Builder
  builderBaseUrl,
  builderParams,
  builtUrl,
  addParam,
  removeParam,
  loadUrlToBuilder,
  clearBuilder,
} = useUrlEncoder()

// UI actions with toast notifications
const copyInput = () => {
  void copy(inputText.value, { detail: 'Input copied to clipboard' })
}

const copyOutput = () => {
  void copy(outputText.value, { detail: 'Encoded text copied to clipboard' })
}

const handleDecode = () => {
  const success = decodeOutput()
  if (success) {
    showSuccess('Decoded', 'Text decoded successfully')
  }
}

const copyParsedValue = (value: string, label: string) => {
  void copy(value, { detail: `${label} copied to clipboard` })
}

const copyBuiltUrl = () => {
  void copy(builtUrl.value, { detail: 'Built URL copied to clipboard' })
}

const handleLoadUrlToBuilder = () => {
  const success = loadUrlToBuilder()
  if (!success) {
    showError('Error', 'Invalid URL')
  }
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-link"></i>
        <span>URL Encoder</span>
      </div>
    </template>
    <template #subtitle> Encode/decode URLs, parse URLs, and build query strings </template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Encode/Decode</Tab>
          <Tab value="1">URL Parser</Tab>
          <Tab value="2">Query Builder</Tab>
          <Tab value="3">Reference</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <Panel toggleable class="options-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-cog"></i>
                  <span>Encoding Options</span>
                </div>
              </template>
              <div class="options-content">
                <div class="option-item">
                  <label>
                    <i class="pi pi-code"></i>
                    Method
                  </label>
                  <SelectButton
                    v-model="encodingMode"
                    :options="ENCODING_MODE_OPTIONS"
                    option-label="label"
                    option-value="value"
                    :allow-empty="false"
                  />
                </div>

                <Divider layout="vertical" />

                <div class="method-info">
                  <Tag
                    v-if="encodingMode === 'encodeURIComponent'"
                    value="encodeURIComponent"
                    severity="info"
                  />
                  <Tag v-else value="encodeURI" severity="secondary" />
                  <span v-if="encodingMode === 'encodeURIComponent'" class="info-text">
                    Encodes all except <code>A-Z a-z 0-9 - _ . ! ~ * ' ( )</code>
                  </span>
                  <span v-else class="info-text">
                    Encodes all except
                    <code>A-Z a-z 0-9 ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) #</code>
                  </span>
                </div>
              </div>
            </Panel>

            <Message v-if="encodeError" severity="error" :closable="false" class="error-message">
              <i class="pi pi-times-circle"></i>
              {{ encodeError }}
            </Message>

            <div class="editor-grid">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-edit"></i>
                  <span>Input (Plain Text)</span>
                  <Tag
                    v-if="inputStats"
                    :value="`${inputStats.chars} chars / ${inputStats.bytes} bytes`"
                    severity="secondary"
                  />
                </div>
                <CodeEditor v-model="inputText" mode="plain_text" height="300px" />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      v-tooltip.top="'Load Sample'"
                      icon="pi pi-file"
                      label="Sample"
                      severity="info"
                      text
                      @click="loadSample"
                    />
                  </template>
                  <template #end>
                    <Button
                      v-tooltip.top="'Copy'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      rounded
                      :disabled="!inputText"
                      @click="copyInput"
                    />
                    <Button
                      v-tooltip.top="'Clear'"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      :disabled="!inputText"
                      @click="clearAll"
                    />
                  </template>
                </Toolbar>
              </div>

              <div class="swap-button">
                <Button
                  v-tooltip.top="'Swap'"
                  icon="pi pi-arrow-right-arrow-left"
                  severity="secondary"
                  rounded
                  :disabled="!outputText"
                  @click="swapValues"
                />
                <Button
                  v-tooltip.top="'Decode Output'"
                  icon="pi pi-unlock"
                  severity="info"
                  rounded
                  text
                  :disabled="!outputText"
                  @click="handleDecode"
                />
              </div>

              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-lock"></i>
                  <span>Output (Encoded)</span>
                  <Tag
                    v-if="outputStats"
                    :value="`${outputStats.chars} chars (${outputStats.ratio}%)`"
                    severity="info"
                  />
                </div>
                <CodeEditor
                  v-model="outputText"
                  mode="plain_text"
                  height="300px"
                  :options="{ readOnly: true }"
                />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      icon="pi pi-copy"
                      label="Copy"
                      severity="secondary"
                      :disabled="!outputText"
                      @click="copyOutput"
                    />
                  </template>
                </Toolbar>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="1">
            <Panel toggleable class="url-input-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-globe"></i>
                  <span>URL to Parse</span>
                  <Tag
                    v-if="urlInput && !urlParseError"
                    value="Valid URL"
                    severity="success"
                    icon="pi pi-check-circle"
                  />
                  <Tag
                    v-else-if="urlParseError"
                    value="Invalid"
                    severity="danger"
                    icon="pi pi-times-circle"
                  />
                </div>
              </template>

              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-link"></i>
                </InputGroupAddon>
                <InputText
                  v-model="urlInput"
                  placeholder="https://example.com/path?query=value#hash"
                />
                <Button
                  v-tooltip.top="'Load Sample'"
                  icon="pi pi-file"
                  severity="info"
                  text
                  @click="loadSampleUrl"
                />
                <Button
                  label="Load to Builder"
                  icon="pi pi-arrow-right"
                  severity="secondary"
                  :disabled="!parsedUrl"
                  @click="handleLoadUrlToBuilder"
                />
              </InputGroup>
            </Panel>

            <Message v-if="urlParseError" severity="error" :closable="false" class="error-message">
              <i class="pi pi-times-circle"></i>
              {{ urlParseError }}
            </Message>

            <div v-if="parsedUrl" class="parsed-results">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-list"></i>
                  Parsed Components
                </span>
              </Divider>

              <div class="component-grid">
                <div v-if="parsedUrl.protocol" class="component-item">
                  <Tag value="Protocol" severity="secondary" />
                  <code class="component-value">{{ parsedUrl.protocol }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.protocol, 'Protocol')"
                  />
                </div>
                <div v-if="parsedUrl.hostname" class="component-item">
                  <Tag value="Hostname" severity="secondary" />
                  <code class="component-value">{{ parsedUrl.hostname }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.hostname, 'Hostname')"
                  />
                </div>
                <div v-if="parsedUrl.port" class="component-item">
                  <Tag value="Port" severity="secondary" />
                  <code class="component-value">{{ parsedUrl.port }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.port, 'Port')"
                  />
                </div>
                <div v-if="parsedUrl.pathname" class="component-item">
                  <Tag value="Pathname" severity="secondary" />
                  <code class="component-value">{{ parsedUrl.pathname }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.pathname, 'Pathname')"
                  />
                </div>
                <div v-if="parsedUrl.search" class="component-item">
                  <Tag value="Search" severity="info" />
                  <code class="component-value">{{ parsedUrl.search }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.search, 'Search')"
                  />
                </div>
                <div v-if="parsedUrl.hash" class="component-item">
                  <Tag value="Hash" severity="warn" />
                  <code class="component-value">{{ parsedUrl.hash }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.hash, 'Hash')"
                  />
                </div>
                <div v-if="parsedUrl.origin" class="component-item">
                  <Tag value="Origin" severity="success" />
                  <code class="component-value">{{ parsedUrl.origin }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.origin, 'Origin')"
                  />
                </div>
                <div v-if="parsedUrl.username" class="component-item">
                  <Tag value="Username" severity="contrast" />
                  <code class="component-value">{{ parsedUrl.username }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.username, 'Username')"
                  />
                </div>
                <div v-if="parsedUrl.password" class="component-item">
                  <Tag value="Password" severity="danger" />
                  <code class="component-value">{{ parsedUrl.password }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyParsedValue(parsedUrl.password, 'Password')"
                  />
                </div>
              </div>

              <div v-if="queryParams.length > 0" class="query-params">
                <Divider align="left">
                  <span class="divider-text">
                    <i class="pi pi-filter"></i>
                    Query Parameters
                    <Tag :value="`${queryParams.length} params`" severity="info" />
                  </span>
                </Divider>

                <DataTable :value="queryParams" striped-rows size="small">
                  <Column field="key" header="Key">
                    <template #body="slotProps">
                      <code class="param-key">{{ slotProps.data.key }}</code>
                    </template>
                  </Column>
                  <Column field="value" header="Value (Decoded)">
                    <template #body="slotProps">
                      <code>{{ slotProps.data.value }}</code>
                    </template>
                  </Column>
                  <Column field="encodedValue" header="Value (Encoded)">
                    <template #body="slotProps">
                      <code class="encoded-value">{{ slotProps.data.encodedValue }}</code>
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
                        @click="copyParsedValue(slotProps.data.value, slotProps.data.key)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <Panel toggleable class="builder-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-cog"></i>
                  <span>URL Builder</span>
                </div>
              </template>

              <div class="builder-content">
                <div class="field">
                  <label for="baseUrl">
                    <i class="pi pi-globe"></i>
                    Base URL
                  </label>
                  <InputGroup>
                    <InputGroupAddon>
                      <i class="pi pi-link"></i>
                    </InputGroupAddon>
                    <InputText
                      id="baseUrl"
                      v-model="builderBaseUrl"
                      placeholder="https://example.com/api/endpoint"
                    />
                  </InputGroup>
                </div>

                <Divider align="left">
                  <span class="divider-text">
                    <i class="pi pi-filter"></i>
                    Query Parameters
                    <Tag
                      :value="`${builderParams.filter(p => p.key).length} params`"
                      severity="secondary"
                    />
                  </span>
                </Divider>

                <div class="params-list">
                  <div v-for="param in builderParams" :key="param.id" class="param-row">
                    <InputGroup>
                      <InputText v-model="param.key" placeholder="Key" class="param-key-input" />
                      <InputGroupAddon>=</InputGroupAddon>
                      <InputText
                        v-model="param.value"
                        placeholder="Value"
                        class="param-value-input"
                      />
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        @click="removeParam(param.id)"
                      />
                    </InputGroup>
                  </div>
                </div>

                <Button
                  label="Add Parameter"
                  icon="pi pi-plus"
                  severity="secondary"
                  text
                  @click="addParam"
                />
              </div>
            </Panel>

            <div v-if="builtUrl" class="built-url-section">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-check-circle"></i>
                  Generated URL
                </span>
              </Divider>

              <CodeEditor
                :model-value="builtUrl"
                mode="plain_text"
                height="100px"
                :options="{ readOnly: true }"
              />

              <Toolbar class="action-toolbar">
                <template #start>
                  <Button label="Copy URL" icon="pi pi-copy" @click="copyBuiltUrl" />
                </template>
                <template #end>
                  <Button
                    v-tooltip.top="'Clear Builder'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    @click="clearBuilder"
                  />
                </template>
              </Toolbar>
            </div>
          </TabPanel>

          <TabPanel value="3">
            <Panel toggleable>
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-book"></i>
                  <span>Common URL Encoding Characters</span>
                  <Tag :value="`${ENCODING_EXAMPLES.length} chars`" severity="secondary" />
                </div>
              </template>

              <DataTable :value="ENCODING_EXAMPLES" striped-rows size="small">
                <Column field="char" header="Character" style="width: 100px">
                  <template #body="slotProps">
                    <code class="char-display">{{ slotProps.data.char }}</code>
                  </template>
                </Column>
                <Column field="encoded" header="Encoded" style="width: 120px">
                  <template #body="slotProps">
                    <Tag :value="slotProps.data.encoded" severity="info" />
                  </template>
                </Column>
                <Column field="description" header="Description">
                  <template #body="slotProps">
                    <span class="description-text">{{ slotProps.data.description }}</span>
                  </template>
                </Column>
              </DataTable>
            </Panel>
          </TabPanel>
        </TabPanels>
      </Tabs>
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

.options-panel,
.url-input-panel,
.builder-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
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

.options-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.method-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  .info-text {
    font-size: 0.85rem;
    color: var(--text-color-secondary);

    code {
      background-color: var(--surface-ground);
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }
  }
}

.error-message {
  margin: 1rem 0;

  i {
    margin-right: 0.5rem;
  }
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 0;

  i {
    color: var(--primary-color);
  }
}

.swap-button {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding-top: 150px;

  @media (max-width: 1024px) {
    flex-direction: row;
    padding-top: 0;
    padding: 1rem 0;
  }
}

.editor-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.action-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.parsed-results {
  margin-top: 1rem;
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

.component-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 6px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .component-value {
    flex: 1;
    font-size: 0.9rem;
    word-break: break-all;
    color: var(--primary-color);
  }
}

.query-params {
  margin-top: 1rem;
}

.param-key {
  color: var(--primary-color);
  font-weight: 600;
}

.encoded-value {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.builder-content {
  .field {
    margin-bottom: 1rem;

    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;

      i {
        color: var(--primary-color);
      }
    }
  }
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.param-row {
  .param-key-input {
    max-width: 200px;
  }

  .param-value-input {
    flex: 1;
  }
}

.built-url-section {
  margin-top: 1rem;
}

.char-display {
  display: inline-block;
  width: 30px;
  text-align: center;
  background-color: var(--surface-ground);
  padding: 0.25rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.description-text {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}
</style>
