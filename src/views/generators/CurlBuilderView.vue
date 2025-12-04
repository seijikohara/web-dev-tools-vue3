<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import Divider from 'primevue/divider'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

// Types
interface Header {
  key: string
  value: string
  enabled: boolean
}

interface QueryParam {
  key: string
  value: string
  enabled: boolean
}

// State
const method = ref('GET')
const url = ref('')
const headers = ref<Header[]>([{ key: '', value: '', enabled: true }])
const queryParams = ref<QueryParam[]>([{ key: '', value: '', enabled: true }])
const body = ref('')
const bodyType = ref<'none' | 'json' | 'form' | 'raw'>('none')

// Options
const options = reactive({
  followRedirects: true,
  insecure: false,
  verbose: false,
  silent: false,
  compressed: false,
  timeout: 0,
  maxTime: 0,
  output: '',
  proxy: '',
  userAgent: '',
  basicAuth: '',
})

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' },
]

const bodyTypeOptions = [
  { label: 'None', value: 'none' },
  { label: 'JSON', value: 'json' },
  { label: 'Form Data', value: 'form' },
  { label: 'Raw', value: 'raw' },
]

// Add header
const addHeader = () => {
  headers.value.push({ key: '', value: '', enabled: true })
}

// Remove header
const removeHeader = (index: number) => {
  headers.value.splice(index, 1)
  if (headers.value.length === 0) {
    addHeader()
  }
}

// Add query param
const addQueryParam = () => {
  queryParams.value.push({ key: '', value: '', enabled: true })
}

// Remove query param
const removeQueryParam = (index: number) => {
  queryParams.value.splice(index, 1)
  if (queryParams.value.length === 0) {
    addQueryParam()
  }
}

// Build URL with query params
const buildUrl = (): string => {
  if (!url.value) return ''

  const enabledParams = queryParams.value.filter(p => p.enabled && p.key)
  if (enabledParams.length === 0) return url.value

  const baseUrl = url.value.includes('?') ? url.value : url.value
  const queryString = enabledParams
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&')

  return url.value.includes('?') ? `${baseUrl}&${queryString}` : `${baseUrl}?${queryString}`
}

// Escape shell string
const escapeShell = (str: string): string => {
  if (!str) return "''"
  if (!/[^a-zA-Z0-9_\-.,/:@]/.test(str)) return str
  return `'${str.replace(/'/g, "'\\''")}'`
}

// Generate cURL command
const curlCommand = computed(() => {
  const parts: string[] = ['curl']

  // Method
  if (method.value !== 'GET') {
    parts.push(`-X ${method.value}`)
  }

  // Options
  if (options.followRedirects) {
    parts.push('-L')
  }
  if (options.insecure) {
    parts.push('-k')
  }
  if (options.verbose) {
    parts.push('-v')
  }
  if (options.silent) {
    parts.push('-s')
  }
  if (options.compressed) {
    parts.push('--compressed')
  }
  if (options.timeout > 0) {
    parts.push(`--connect-timeout ${options.timeout}`)
  }
  if (options.maxTime > 0) {
    parts.push(`-m ${options.maxTime}`)
  }
  if (options.output) {
    parts.push(`-o ${escapeShell(options.output)}`)
  }
  if (options.proxy) {
    parts.push(`-x ${escapeShell(options.proxy)}`)
  }
  if (options.userAgent) {
    parts.push(`-A ${escapeShell(options.userAgent)}`)
  }
  if (options.basicAuth) {
    parts.push(`-u ${escapeShell(options.basicAuth)}`)
  }

  // Headers
  const enabledHeaders = headers.value.filter(h => h.enabled && h.key)
  enabledHeaders.forEach(header => {
    parts.push(`-H ${escapeShell(`${header.key}: ${header.value}`)}`)
  })

  // Content-Type header for body types
  if (bodyType.value === 'json' && body.value) {
    const hasContentType = enabledHeaders.some(h => h.key.toLowerCase() === 'content-type')
    if (!hasContentType) {
      parts.push(`-H 'Content-Type: application/json'`)
    }
  } else if (bodyType.value === 'form' && body.value) {
    const hasContentType = enabledHeaders.some(h => h.key.toLowerCase() === 'content-type')
    if (!hasContentType) {
      parts.push(`-H 'Content-Type: application/x-www-form-urlencoded'`)
    }
  }

  // Body
  if (body.value && bodyType.value !== 'none') {
    parts.push(`-d ${escapeShell(body.value)}`)
  }

  // URL
  if (url.value) {
    parts.push(escapeShell(buildUrl()))
  }

  return parts.join(' \\\n  ')
})

// Copy command
const copyCommand = () => {
  if (!curlCommand.value) return
  copy(curlCommand.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'cURL command copied to clipboard',
    life: 2000,
  })
}

// Parse cURL command
const parsedInput = ref('')

const parseCurlCommand = () => {
  const input = parsedInput.value.trim()
  if (!input) return

  // Reset state
  method.value = 'GET'
  headers.value = [{ key: '', value: '', enabled: true }]
  queryParams.value = [{ key: '', value: '', enabled: true }]
  body.value = ''
  bodyType.value = 'none'

  // Simple regex-based parser
  const tokens = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []

  const processTokens = (
    tokens: string[],
    index: number,
    state: {
      headers: Header[]
      method: string
      url: string
      body: string
    },
  ): { headers: Header[]; method: string; url: string; body: string } => {
    if (index >= tokens.length) return state

    const token = tokens[index]
    const nextToken = tokens[index + 1]

    const cleanValue = (val: string): string => {
      if (!val) return ''
      if (
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      ) {
        return val.slice(1, -1)
      }
      return val
    }

    if (token === '-X' || token === '--request') {
      return processTokens(tokens, index + 2, { ...state, method: cleanValue(nextToken ?? '') })
    }

    if (token === '-H' || token === '--header') {
      const headerValue = cleanValue(nextToken ?? '')
      const colonIndex = headerValue.indexOf(':')
      if (colonIndex > 0) {
        const key = headerValue.slice(0, colonIndex).trim()
        const value = headerValue.slice(colonIndex + 1).trim()
        return processTokens(tokens, index + 2, {
          ...state,
          headers: [...state.headers, { key, value, enabled: true }],
        })
      }
      return processTokens(tokens, index + 2, state)
    }

    if (token === '-d' || token === '--data' || token === '--data-raw') {
      return processTokens(tokens, index + 2, { ...state, body: cleanValue(nextToken ?? '') })
    }

    if (token?.startsWith('http://') || token?.startsWith('https://')) {
      return processTokens(tokens, index + 1, { ...state, url: cleanValue(token) })
    }

    if (!token?.startsWith('-') && !token?.startsWith('curl') && index === tokens.length - 1) {
      return processTokens(tokens, index + 1, { ...state, url: cleanValue(token ?? '') })
    }

    return processTokens(tokens, index + 1, state)
  }

  const result = processTokens(tokens, 0, { headers: [], method: 'GET', url: '', body: '' })

  method.value = result.method
  url.value = result.url
  if (result.headers.length > 0) {
    headers.value = result.headers
  }
  if (result.body) {
    body.value = result.body
    bodyType.value = result.body.startsWith('{') ? 'json' : 'raw'
  }

  toast.add({
    severity: 'success',
    summary: 'Parsed',
    detail: 'cURL command parsed successfully',
    life: 2000,
  })
}

// Common headers
const commonHeaders = [
  { label: 'Accept', value: 'Accept' },
  { label: 'Accept-Language', value: 'Accept-Language' },
  { label: 'Authorization', value: 'Authorization' },
  { label: 'Cache-Control', value: 'Cache-Control' },
  { label: 'Content-Type', value: 'Content-Type' },
  { label: 'Cookie', value: 'Cookie' },
  { label: 'Origin', value: 'Origin' },
  { label: 'Referer', value: 'Referer' },
  { label: 'User-Agent', value: 'User-Agent' },
  { label: 'X-API-Key', value: 'X-API-Key' },
  { label: 'X-Requested-With', value: 'X-Requested-With' },
]

// Load sample
const loadSample = () => {
  method.value = 'POST'
  url.value = 'https://api.example.com/users'
  headers.value = [
    { key: 'Authorization', value: 'Bearer your-token-here', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true },
  ]
  queryParams.value = [{ key: 'version', value: '2', enabled: true }]
  body.value = JSON.stringify({ name: 'John Doe', email: 'john@example.com' }, null, 2)
  bodyType.value = 'json'
}

// Reset
const resetAll = () => {
  method.value = 'GET'
  url.value = ''
  headers.value = [{ key: '', value: '', enabled: true }]
  queryParams.value = [{ key: '', value: '', enabled: true }]
  body.value = ''
  bodyType.value = 'none'
  Object.assign(options, {
    followRedirects: true,
    insecure: false,
    verbose: false,
    silent: false,
    compressed: false,
    timeout: 0,
    maxTime: 0,
    output: '',
    proxy: '',
    userAgent: '',
    basicAuth: '',
  })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>cURL Command Builder</span>
      </div>
    </template>
    <template #subtitle> Build and parse cURL commands visually </template>
    <template #content>
      <TabView>
        <TabPanel value="0" header="Builder">
          <div class="builder-layout">
            <!-- Request Section -->
            <div class="request-section">
              <!-- URL Bar -->
              <div class="url-bar">
                <Select
                  v-model="method"
                  :options="methodOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="method-select"
                />
                <InputText
                  v-model="url"
                  placeholder="https://api.example.com/endpoint"
                  class="url-input"
                />
                <Button icon="pi pi-send" label="Copy" :disabled="!url" @click="copyCommand" />
              </div>

              <!-- Tabs for Headers, Params, Body -->
              <TabView class="request-tabs">
                <TabPanel value="0">
                  <template #header>
                    <span>Headers</span>
                    <Tag
                      v-if="headers.filter(h => h.enabled && h.key).length > 0"
                      :value="String(headers.filter(h => h.enabled && h.key).length)"
                      severity="info"
                      class="tab-badge"
                    />
                  </template>

                  <div class="key-value-list">
                    <div v-for="(header, index) in headers" :key="index" class="key-value-row">
                      <ToggleSwitch v-model="header.enabled" />
                      <Select
                        v-model="header.key"
                        :options="commonHeaders"
                        optionLabel="label"
                        optionValue="value"
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
                  <template #header>
                    <span>Query Params</span>
                    <Tag
                      v-if="queryParams.filter(p => p.enabled && p.key).length > 0"
                      :value="String(queryParams.filter(p => p.enabled && p.key).length)"
                      severity="info"
                      class="tab-badge"
                    />
                  </template>

                  <div class="key-value-list">
                    <div v-for="(param, index) in queryParams" :key="index" class="key-value-row">
                      <ToggleSwitch v-model="param.enabled" />
                      <InputText
                        v-model="param.key"
                        placeholder="Parameter name"
                        class="key-input"
                      />
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

                <TabPanel value="2" header="Body">
                  <div class="body-section">
                    <div class="body-type-select">
                      <Select
                        v-model="bodyType"
                        :options="bodyTypeOptions"
                        optionLabel="label"
                        optionValue="value"
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

                <TabPanel value="3" header="Options">
                  <div class="options-grid">
                    <div class="option-item">
                      <ToggleSwitch v-model="options.followRedirects" inputId="followRedirects" />
                      <label for="followRedirects">Follow Redirects (-L)</label>
                    </div>
                    <div class="option-item">
                      <ToggleSwitch v-model="options.insecure" inputId="insecure" />
                      <label for="insecure">Insecure / Skip SSL (-k)</label>
                    </div>
                    <div class="option-item">
                      <ToggleSwitch v-model="options.verbose" inputId="verbose" />
                      <label for="verbose">Verbose (-v)</label>
                    </div>
                    <div class="option-item">
                      <ToggleSwitch v-model="options.silent" inputId="silent" />
                      <label for="silent">Silent (-s)</label>
                    </div>
                    <div class="option-item">
                      <ToggleSwitch v-model="options.compressed" inputId="compressed" />
                      <label for="compressed">Compressed</label>
                    </div>

                    <Divider />

                    <div class="option-input-row">
                      <label>Connect Timeout (seconds)</label>
                      <InputNumber v-model="options.timeout" :min="0" showButtons />
                    </div>
                    <div class="option-input-row">
                      <label>Max Time (seconds)</label>
                      <InputNumber v-model="options.maxTime" :min="0" showButtons />
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
              </TabView>
            </div>

            <!-- Output Section -->
            <div class="output-section">
              <Panel>
                <template #header>
                  <div class="panel-header">
                    <i class="pi pi-terminal"></i>
                    <span>Generated Command</span>
                  </div>
                </template>

                <CodeEditor
                  :modelValue="curlCommand"
                  mode="plain_text"
                  height="200px"
                  :readonly="true"
                />

                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      icon="pi pi-file"
                      label="Sample"
                      severity="info"
                      text
                      @click="loadSample"
                    />
                  </template>
                  <template #end>
                    <Button
                      icon="pi pi-copy"
                      label="Copy"
                      :disabled="!curlCommand"
                      @click="copyCommand"
                    />
                    <Button icon="pi pi-refresh" severity="secondary" text @click="resetAll" />
                  </template>
                </Toolbar>
              </Panel>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="1" header="Parser">
          <div class="parser-section">
            <Panel>
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-upload"></i>
                  <span>Paste cURL Command</span>
                </div>
              </template>

              <Textarea
                v-model="parsedInput"
                rows="6"
                placeholder="Paste your cURL command here..."
                class="parse-input"
              />

              <Toolbar class="editor-toolbar">
                <template #end>
                  <Button
                    icon="pi pi-arrow-right"
                    label="Parse"
                    :disabled="!parsedInput"
                    @click="parseCurlCommand"
                  />
                </template>
              </Toolbar>
            </Panel>
          </div>
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

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  i {
    color: var(--primary-color);
  }
}

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
    min-width: 200px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  @media (max-width: 480px) {
    .method-select {
      width: 100px;
    }

    .url-input {
      min-width: 0;
      flex-basis: calc(100% - 110px);
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

.editor-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.parser-section {
  .parse-input {
    width: 100%;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
}
</style>
