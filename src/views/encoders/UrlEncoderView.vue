<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import TabView from 'primevue/tabview'
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

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

// Encode/Decode tab - Two editor layout
const inputText = ref('')
const outputText = ref('')
const encodeError = ref('')

type EncodingMode = 'encodeURIComponent' | 'encodeURI'
const encodingMode = ref<EncodingMode>('encodeURIComponent')
const encodingModeOptions = [
  { label: 'Component', value: 'encodeURIComponent', tooltip: 'encodeURIComponent' },
  { label: 'URI', value: 'encodeURI', tooltip: 'encodeURI' },
]

// Auto-encode when input changes
watch([inputText, encodingMode], () => {
  encodeError.value = ''
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    if (encodingMode.value === 'encodeURIComponent') {
      outputText.value = encodeURIComponent(inputText.value)
    } else {
      outputText.value = encodeURI(inputText.value)
    }
  } catch (error) {
    encodeError.value = error instanceof Error ? error.message : 'Encode failed'
    outputText.value = ''
  }
})

const swapValues = () => {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
}

const decodeOutput = () => {
  encodeError.value = ''
  if (!outputText.value) return

  try {
    if (encodingMode.value === 'encodeURIComponent') {
      inputText.value = decodeURIComponent(outputText.value)
    } else {
      inputText.value = decodeURI(outputText.value)
    }
    toast.add({
      severity: 'success',
      summary: 'Decoded',
      detail: 'Text decoded successfully',
      life: 2000,
    })
  } catch (error) {
    encodeError.value =
      error instanceof Error ? error.message : 'Decode failed - Invalid URL encoding'
  }
}

const copyInput = () => {
  copy(inputText.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Input copied to clipboard',
    life: 2000,
  })
}

const copyOutput = () => {
  copy(outputText.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Encoded text copied to clipboard',
    life: 2000,
  })
}

const loadSample = () => {
  inputText.value = 'Hello World! こんにちは 你好 🌍 #test?query=value&foo=bar'
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  encodeError.value = ''
}

// Stats
const inputStats = computed(() => {
  if (!inputText.value) return null
  return {
    chars: inputText.value.length,
    bytes: new TextEncoder().encode(inputText.value).length,
  }
})

const outputStats = computed(() => {
  if (!outputText.value) return null
  return {
    chars: outputText.value.length,
    ratio: inputText.value
      ? ((outputText.value.length / inputText.value.length) * 100).toFixed(0)
      : '0',
  }
})

// URL Parser tab
const urlInput = ref('')

interface ParsedUrl {
  protocol: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  username: string
  password: string
}

// Compute URL parse error separately to avoid side effects
const urlParseError = computed(() => {
  if (!urlInput.value.trim()) return ''
  try {
    new URL(urlInput.value)
    return ''
  } catch {
    return 'Invalid URL format'
  }
})

const parsedUrl = computed((): ParsedUrl | null => {
  if (!urlInput.value.trim() || urlParseError.value) return null

  try {
    const url = new URL(urlInput.value)
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      username: url.username,
      password: url.password,
    }
  } catch {
    return null
  }
})

interface QueryParam {
  key: string
  value: string
  encodedKey: string
  encodedValue: string
}

const queryParams = computed((): QueryParam[] => {
  if (!urlInput.value.trim()) return []

  try {
    const url = new URL(urlInput.value)
    const params: QueryParam[] = []
    url.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        encodedKey: encodeURIComponent(key),
        encodedValue: encodeURIComponent(value),
      })
    })
    return params
  } catch {
    return []
  }
})

const copyParsedValue = (value: string, label: string) => {
  copy(value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${label} copied to clipboard`,
    life: 2000,
  })
}

const loadSampleUrl = () => {
  urlInput.value =
    'https://user:pass@example.com:8080/path/to/page?name=John%20Doe&age=30&city=Tokyo#section1'
}

// Query Builder tab
interface BuilderParam {
  id: number
  key: string
  value: string
}

const builderBaseUrl = ref('https://example.com/path')
const builderParams = ref<BuilderParam[]>([{ id: 1, key: '', value: '' }])
const nextParamId = ref(2)

const addParam = () => {
  builderParams.value.push({ id: nextParamId.value++, key: '', value: '' })
}

const removeParam = (id: number) => {
  builderParams.value = builderParams.value.filter(p => p.id !== id)
  if (builderParams.value.length === 0) {
    addParam()
  }
}

const builtUrl = computed(() => {
  try {
    const url = new URL(builderBaseUrl.value)
    builderParams.value.forEach(param => {
      if (param.key.trim()) {
        url.searchParams.append(param.key, param.value)
      }
    })
    return url.toString()
  } catch {
    return ''
  }
})

const copyBuiltUrl = () => {
  copy(builtUrl.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Built URL copied to clipboard',
    life: 2000,
  })
}

const loadUrlToBuilder = () => {
  if (!urlInput.value.trim()) return

  try {
    const url = new URL(urlInput.value)
    builderBaseUrl.value = url.origin + url.pathname
    const params: BuilderParam[] = []
    url.searchParams.forEach((value, key) => {
      params.push({ id: nextParamId.value++, key, value })
    })
    if (params.length === 0) {
      params.push({ id: nextParamId.value++, key: '', value: '' })
    }
    builderParams.value = params
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Invalid URL',
      life: 3000,
    })
  }
}

const clearBuilder = () => {
  builderBaseUrl.value = 'https://example.com/path'
  builderParams.value = [{ id: 1, key: '', value: '' }]
  nextParamId.value = 2
}

// Common encoding examples
const encodingExamples = [
  { char: ' ', encoded: '%20 or +', description: 'Space' },
  { char: '!', encoded: '%21', description: 'Exclamation' },
  { char: '#', encoded: '%23', description: 'Hash' },
  { char: '$', encoded: '%24', description: 'Dollar' },
  { char: '&', encoded: '%26', description: 'Ampersand' },
  { char: "'", encoded: '%27', description: 'Single quote' },
  { char: '(', encoded: '%28', description: 'Open paren' },
  { char: ')', encoded: '%29', description: 'Close paren' },
  { char: '*', encoded: '%2A', description: 'Asterisk' },
  { char: '+', encoded: '%2B', description: 'Plus' },
  { char: ',', encoded: '%2C', description: 'Comma' },
  { char: '/', encoded: '%2F', description: 'Slash' },
  { char: ':', encoded: '%3A', description: 'Colon' },
  { char: ';', encoded: '%3B', description: 'Semicolon' },
  { char: '=', encoded: '%3D', description: 'Equals' },
  { char: '?', encoded: '%3F', description: 'Question' },
  { char: '@', encoded: '%40', description: 'At sign' },
  { char: '[', encoded: '%5B', description: 'Open bracket' },
  { char: ']', encoded: '%5D', description: 'Close bracket' },
]
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
      <TabView>
        <TabPanel value="0" header="Encode/Decode">
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
                  :options="encodingModeOptions"
                  optionLabel="label"
                  optionValue="value"
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
                    :disabled="!inputText"
                    @click="copyInput"
                  />
                  <Button
                    v-tooltip.top="'Clear'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
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
                @click="decodeOutput"
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

        <TabPanel value="1" header="URL Parser">
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
                @click="loadUrlToBuilder"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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
                  size="small"
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

              <DataTable :value="queryParams" stripedRows size="small">
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
                <Column style="width: 60px">
                  <template #body="slotProps">
                    <Button
                      v-tooltip.top="'Copy'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      rounded
                      size="small"
                      @click="copyParsedValue(slotProps.data.value, slotProps.data.key)"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="2" header="Query Builder">
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
                size="small"
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
                  @click="clearBuilder"
                />
              </template>
            </Toolbar>
          </div>
        </TabPanel>

        <TabPanel value="3" header="Reference">
          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-book"></i>
                <span>Common URL Encoding Characters</span>
                <Tag :value="`${encodingExamples.length} chars`" severity="secondary" />
              </div>
            </template>

            <DataTable :value="encodingExamples" stripedRows size="small">
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
      </TabView>
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
