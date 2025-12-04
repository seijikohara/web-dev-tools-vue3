<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import * as YAML from 'yaml'
import xmlFormatter from 'xml-formatter'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

import CodeEditor from '@/components/CodeEditor.vue'
import { FORMAT_OPTIONS, DEFAULT_FORMAT_OPTION } from '@/constants/formatOptions'

const toast = useToast()
const { copy } = useClipboard()

const persistedFormatOption = useLocalStorage('yaml-formatter-option', DEFAULT_FORMAT_OPTION)

const state = reactive({
  input: '',
  output: '',
  formatOptionValue: persistedFormatOption.value,
})

// Validation state
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)
const yamlStats = ref<{
  keys: number
  values: number
  depth: number
  size: string
} | null>(null)

// Convert output
const convertOutput = ref('')
const convertError = ref('')
const convertFormat = ref<'json' | 'xml'>('json')

// Query state
const yamlPathQuery = ref('')
const yamlPathResult = ref('')
const yamlPathError = ref('')

// Compare tab state
const compareYaml1 = ref('')
const compareYaml2 = ref('')

// Validate YAML
const validateYaml = () => {
  validationResult.value = null
  yamlStats.value = null

  if (!state.input.trim()) {
    validationResult.value = { valid: false, error: 'Empty input' }
    return
  }

  try {
    const parsed = YAML.parse(state.input)
    validationResult.value = { valid: true }

    // Calculate stats
    const stats = calculateYamlStats(parsed)
    yamlStats.value = stats
  } catch (e) {
    if (e instanceof YAML.YAMLParseError) {
      validationResult.value = {
        valid: false,
        error: e.message,
      }
    } else {
      validationResult.value = {
        valid: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }
}

// Calculate YAML statistics
const calculateYamlStats = (
  obj: unknown,
  depth = 0,
): { keys: number; values: number; depth: number; size: string } => {
  const stats = { keys: 0, values: 0, maxDepth: depth }

  const traverse = (item: unknown, currentDepth: number) => {
    if (currentDepth > stats.maxDepth) stats.maxDepth = currentDepth

    if (Array.isArray(item)) {
      stats.values += item.length
      item.forEach(i => traverse(i, currentDepth + 1))
    } else if (item !== null && typeof item === 'object') {
      const objKeys = Object.keys(item)
      stats.keys += objKeys.length
      objKeys.forEach(k => traverse((item as Record<string, unknown>)[k], currentDepth + 1))
    } else {
      stats.values++
    }
  }

  traverse(obj, 0)

  const bytes = new Blob([state.input]).size
  const size =
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(2)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`

  return { keys: stats.keys, values: stats.values, depth: stats.maxDepth, size }
}

// Get indent size from format option
const getIndentSize = (): number => {
  if (state.formatOptionValue === '\t') return 2
  return state.formatOptionValue.length
}

// Format YAML
const onClickFormat = () => {
  try {
    const parsed = YAML.parse(state.input)
    state.output = YAML.stringify(parsed, { indent: getIndentSize() })
    persistedFormatOption.value = state.formatOptionValue
    validateYaml()
    toast.add({
      severity: 'success',
      summary: 'Formatted',
      detail: 'YAML formatted successfully',
      life: 2000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e instanceof Error ? e.message : 'Failed to format YAML',
      life: 3000,
    })
  }
}

// Minify YAML (convert to single-line flow style where possible)
const onClickMinify = () => {
  try {
    const parsed = YAML.parse(state.input)
    state.output = YAML.stringify(parsed, { indent: 0, lineWidth: 0 })
    validateYaml()
    toast.add({
      severity: 'success',
      summary: 'Minified',
      detail: 'YAML minified successfully',
      life: 2000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e instanceof Error ? e.message : 'Failed to minify YAML',
      life: 3000,
    })
  }
}

// Load sample YAML
const loadSample = () => {
  state.input = `# Sample YAML Configuration
server:
  host: localhost
  port: 8080
  ssl:
    enabled: true
    cert: /path/to/cert.pem

database:
  driver: postgresql
  connection:
    host: db.example.com
    port: 5432
    name: myapp

users:
  - name: admin
    role: administrator
    permissions:
      - read
      - write
      - delete
  - name: guest
    role: viewer
    permissions:
      - read

features:
  darkMode: true
  notifications: enabled
  maxRetries: 3
`
  validateYaml()
}

// Clear all
const clearAll = () => {
  state.input = ''
  state.output = ''
  validationResult.value = null
  yamlStats.value = null
}

// Swap input and output
const swapValues = () => {
  const temp = state.input
  state.input = state.output
  state.output = temp
  validateYaml()
}

// Copy output
const copyOutput = () => {
  copy(state.output)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Output copied to clipboard',
    life: 2000,
  })
}

// Convert to JSON helper
const jsonToXml = (obj: unknown, rootName = 'root'): string => {
  const convert = (data: unknown, name: string): string => {
    if (data === null || data === undefined) {
      return `<${name}/>`
    }
    if (Array.isArray(data)) {
      return data.map(item => convert(item, name)).join('')
    }
    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>)
      const children = entries.map(([key, value]) => convert(value, key)).join('')
      return `<${name}>${children}</${name}>`
    }
    return `<${name}>${String(data)}</${name}>`
  }

  return convert(obj, rootName)
}

// Convert YAML to other formats
const convertTo = (targetFormat: 'json' | 'xml') => {
  convertOutput.value = ''
  convertError.value = ''
  convertFormat.value = targetFormat

  try {
    const parsed = YAML.parse(state.input)

    if (targetFormat === 'json') {
      convertOutput.value = JSON.stringify(parsed, null, 2)
    } else if (targetFormat === 'xml') {
      const rootName =
        typeof parsed === 'object' && parsed !== null ? (Object.keys(parsed)[0] ?? 'root') : 'root'
      const xmlContent =
        typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length === 1
          ? jsonToXml(parsed[rootName], rootName)
          : jsonToXml(parsed, 'root')
      convertOutput.value = xmlFormatter(xmlContent, { indentation: '  ' })
    }
  } catch (e) {
    convertError.value = e instanceof Error ? e.message : 'Conversion failed'
  }
}

const copyConvertedOutput = () => {
  copy(convertOutput.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${convertFormat.value.toUpperCase()} copied to clipboard`,
    life: 2000,
  })
}

// YAML Path query (simple implementation using dot/bracket notation)
const executeYamlPath = () => {
  yamlPathError.value = ''
  yamlPathResult.value = ''

  if (!yamlPathQuery.value.trim()) return

  try {
    const parsed = YAML.parse(state.input)
    const path = yamlPathQuery.value.trim()

    // Simple path parser (supports dot notation and array access)
    const parts = path
      .replace(/^\$\.?/, '')
      .split(/\.|\[|\]/)
      .filter(p => p !== '')

    const result = parts.reduce<unknown>((current, part) => {
      if (current === undefined || current === null) {
        throw new Error(`Path not found: ${path}`)
      }

      if (Array.isArray(current)) {
        const index = parseInt(part)
        if (isNaN(index)) {
          throw new Error(`Invalid array index: ${part}`)
        }
        return current[index]
      } else if (typeof current === 'object') {
        return (current as Record<string, unknown>)[part]
      } else {
        throw new Error(`Cannot access property of non-object: ${part}`)
      }
    }, parsed)

    yamlPathResult.value =
      typeof result === 'object' ? YAML.stringify(result, { indent: 2 }) : String(result)
  } catch (e) {
    yamlPathError.value = e instanceof Error ? e.message : 'Query failed'
  }
}

// Common YAML path queries
const commonQueries = [
  { label: '$.server', query: '$.server' },
  { label: '$.database', query: '$.database' },
  { label: '$.users[0]', query: '$.users[0]' },
]

const applyQuery = (query: string) => {
  yamlPathQuery.value = query
  executeYamlPath()
}

// Convert mode for editor
const convertOutputMode = computed(() => {
  return convertFormat.value === 'json' ? 'json' : 'xml'
})

// Compare YAMLs
interface DiffItem {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

// Compute compare error separately to avoid side effects
const yamlCompareError = computed(() => {
  if (!compareYaml1.value.trim() || !compareYaml2.value.trim()) return ''
  try {
    YAML.parse(compareYaml1.value)
    YAML.parse(compareYaml2.value)
    return ''
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid YAML'
  }
})

const compareYamlDiff = computed((): DiffItem[] => {
  if (!compareYaml1.value.trim() || !compareYaml2.value.trim() || yamlCompareError.value) return []

  try {
    const obj1 = YAML.parse(compareYaml1.value)
    const obj2 = YAML.parse(compareYaml2.value)
    return findDifferences(obj1, obj2)
  } catch {
    return []
  }
})

const findDifferences = (obj1: unknown, obj2: unknown, path = '$'): DiffItem[] => {
  const diffs: DiffItem[] = []

  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      path,
      type: 'changed',
      oldValue: YAML.stringify(obj1),
      newValue: YAML.stringify(obj2),
    })
    return diffs
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length)
    Array.from({ length: maxLen }, (_, i) => i).forEach(i => {
      if (i >= obj1.length) {
        diffs.push({
          path: `${path}[${i}]`,
          type: 'added',
          newValue: YAML.stringify(obj2[i]),
        })
      } else if (i >= obj2.length) {
        diffs.push({
          path: `${path}[${i}]`,
          type: 'removed',
          oldValue: YAML.stringify(obj1[i]),
        })
      } else {
        diffs.push(...findDifferences(obj1[i], obj2[i], `${path}[${i}]`))
      }
    })
  } else if (
    obj1 !== null &&
    obj2 !== null &&
    typeof obj1 === 'object' &&
    typeof obj2 === 'object'
  ) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = [...new Set([...keys1, ...keys2])]

    allKeys.forEach(key => {
      const newPath = `${path}.${key}`
      if (!(key in obj1)) {
        diffs.push({
          path: newPath,
          type: 'added',
          newValue: YAML.stringify((obj2 as Record<string, unknown>)[key]),
        })
      } else if (!(key in obj2)) {
        diffs.push({
          path: newPath,
          type: 'removed',
          oldValue: YAML.stringify((obj1 as Record<string, unknown>)[key]),
        })
      } else {
        diffs.push(
          ...findDifferences(
            (obj1 as Record<string, unknown>)[key],
            (obj2 as Record<string, unknown>)[key],
            newPath,
          ),
        )
      }
    })
  } else if (obj1 !== obj2) {
    diffs.push({
      path,
      type: 'changed',
      oldValue: YAML.stringify(obj1),
      newValue: YAML.stringify(obj2),
    })
  }

  return diffs
}

// Load current YAML to compare
const loadToCompare1 = () => {
  compareYaml1.value = state.input
}

const loadToCompare2 = () => {
  compareYaml2.value = state.input
}

// Auto-validate on input change
watch(() => state.input, validateYaml, { immediate: true })
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-file-edit"></i>
        <span>YAML Formatter</span>
      </div>
    </template>
    <template #subtitle> Format, validate, query, and convert YAML data </template>
    <template #content>
      <TabView>
        <TabPanel value="0" header="Format">
          <Panel toggleable class="options-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-cog"></i>
                <span>Options</span>
                <Tag
                  v-if="validationResult"
                  :value="validationResult.valid ? 'Valid YAML' : 'Invalid'"
                  :severity="validationResult.valid ? 'success' : 'danger'"
                  :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                />
              </div>
            </template>

            <div class="options-content">
              <div class="option-item">
                <label for="indent">
                  <i class="pi pi-align-left"></i>
                  Indentation
                </label>
                <Select
                  id="indent"
                  v-model="state.formatOptionValue"
                  :options="FORMAT_OPTIONS"
                  optionLabel="text"
                  optionValue="value"
                  placeholder="Indent"
                />
              </div>
            </div>

            <div v-if="yamlStats && validationResult?.valid" class="stats-display">
              <Tag :value="`${yamlStats.keys} keys`" severity="info" icon="pi pi-key" />
              <Tag :value="`${yamlStats.values} values`" severity="secondary" />
              <Tag :value="`Depth: ${yamlStats.depth}`" severity="secondary" />
              <Tag :value="yamlStats.size" severity="secondary" icon="pi pi-file" />
            </div>

            <Message
              v-if="
                validationResult &&
                !validationResult.valid &&
                validationResult.error !== 'Empty input'
              "
              severity="error"
              :closable="false"
              class="error-message"
            >
              <i class="pi pi-times-circle"></i>
              {{ validationResult.error }}
            </Message>
          </Panel>

          <div class="editor-grid">
            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-file-import"></i>
                <span>Input</span>
              </div>
              <CodeEditor v-model="state.input" mode="yaml" height="350px" />
              <Toolbar class="editor-toolbar">
                <template #start>
                  <Button
                    label="Format"
                    icon="pi pi-check"
                    :disabled="!state.input"
                    @click="onClickFormat"
                  />
                  <Button
                    label="Minify"
                    icon="pi pi-compress"
                    severity="secondary"
                    :disabled="!state.input"
                    @click="onClickMinify"
                  />
                </template>
                <template #end>
                  <Button
                    v-tooltip.top="'Load Sample'"
                    icon="pi pi-file"
                    severity="info"
                    text
                    @click="loadSample"
                  />
                  <Button
                    v-tooltip.top="'Clear'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    :disabled="!state.input && !state.output"
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
                :disabled="!state.output"
                @click="swapValues"
              />
            </div>

            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-file-export"></i>
                <span>Output</span>
              </div>
              <CodeEditor
                v-model="state.output"
                mode="yaml"
                height="350px"
                :options="{ readOnly: true }"
              />
              <Toolbar class="editor-toolbar">
                <template #start>
                  <Button
                    label="Copy"
                    icon="pi pi-copy"
                    severity="secondary"
                    :disabled="!state.output"
                    @click="copyOutput"
                  />
                </template>
              </Toolbar>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="1" header="Query">
          <Panel toggleable class="query-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-search"></i>
                <span>YAML Path Query</span>
              </div>
            </template>

            <div class="query-input">
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-search"></i>
                </InputGroupAddon>
                <InputText
                  v-model="yamlPathQuery"
                  placeholder="e.g., $.server.host or users[0].name"
                  @keyup.enter="executeYamlPath"
                />
                <Button
                  label="Query"
                  icon="pi pi-play"
                  :disabled="!yamlPathQuery || !state.input"
                  @click="executeYamlPath"
                />
              </InputGroup>
              <small class="hint-text">
                <i class="pi pi-info-circle"></i>
                Supports dot notation: $.key.subkey, array access: [0], or simple paths: key.subkey
              </small>
            </div>

            <div class="common-queries">
              <span class="query-label">Common queries:</span>
              <Button
                v-for="q in commonQueries"
                :key="q.query"
                :label="q.label"
                size="small"
                severity="secondary"
                text
                @click="applyQuery(q.query)"
              />
            </div>
          </Panel>

          <Message v-if="yamlPathError" severity="error" :closable="false" class="query-error">
            <i class="pi pi-times-circle"></i>
            {{ yamlPathError }}
          </Message>

          <div class="editor-grid">
            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-file"></i>
                <span>Source YAML</span>
              </div>
              <CodeEditor v-model="state.input" mode="yaml" height="350px" />
            </div>

            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-check-square"></i>
                <span>Query Result</span>
                <Tag
                  v-if="yamlPathResult"
                  value="Match found"
                  severity="success"
                  icon="pi pi-check"
                />
              </div>
              <CodeEditor
                v-model="yamlPathResult"
                mode="yaml"
                height="350px"
                :options="{ readOnly: true }"
              />
            </div>
          </div>
        </TabPanel>

        <TabPanel value="2" header="Compare">
          <div class="compare-grid">
            <Panel class="compare-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-file"></i>
                  <span>YAML 1</span>
                </div>
              </template>
              <CodeEditor v-model="compareYaml1" mode="yaml" height="300px" />
              <div class="panel-actions">
                <Button
                  label="Load Current"
                  icon="pi pi-download"
                  severity="secondary"
                  size="small"
                  :disabled="!state.input"
                  @click="loadToCompare1"
                />
              </div>
            </Panel>

            <Panel class="compare-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-file"></i>
                  <span>YAML 2</span>
                </div>
              </template>
              <CodeEditor v-model="compareYaml2" mode="yaml" height="300px" />
              <div class="panel-actions">
                <Button
                  label="Load Current"
                  icon="pi pi-download"
                  severity="secondary"
                  size="small"
                  :disabled="!state.input"
                  @click="loadToCompare2"
                />
              </div>
            </Panel>
          </div>

          <Message v-if="yamlCompareError" severity="error" :closable="false">
            <i class="pi pi-times-circle"></i>
            {{ yamlCompareError }}
          </Message>

          <Divider v-if="compareYaml1 && compareYaml2 && !yamlCompareError" align="left">
            <span class="divider-text">
              <i class="pi pi-list"></i>
              Comparison Result
              <Tag
                v-if="compareYamlDiff.length > 0"
                :value="`${compareYamlDiff.length} differences`"
                severity="warn"
              />
              <Tag v-else value="Identical" severity="success" icon="pi pi-check" />
            </span>
          </Divider>

          <div v-if="compareYamlDiff.length > 0" class="diff-results">
            <DataTable :value="compareYamlDiff" stripedRows size="small">
              <Column field="path" header="Path" style="width: 200px">
                <template #body="slotProps">
                  <code class="path-code">{{ slotProps.data.path }}</code>
                </template>
              </Column>
              <Column field="type" header="Type" style="width: 120px">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.type"
                    :severity="
                      slotProps.data.type === 'added'
                        ? 'success'
                        : slotProps.data.type === 'removed'
                          ? 'danger'
                          : 'warn'
                    "
                  />
                </template>
              </Column>
              <Column header="Old Value">
                <template #body="slotProps">
                  <code v-if="slotProps.data.oldValue" class="value-code removed">
                    {{ slotProps.data.oldValue }}
                  </code>
                  <span v-else class="no-value">-</span>
                </template>
              </Column>
              <Column header="New Value">
                <template #body="slotProps">
                  <code v-if="slotProps.data.newValue" class="value-code added">
                    {{ slotProps.data.newValue }}
                  </code>
                  <span v-else class="no-value">-</span>
                </template>
              </Column>
            </DataTable>
          </div>

          <Message
            v-else-if="compareYaml1 && compareYaml2 && !yamlCompareError"
            severity="success"
            :closable="false"
          >
            <i class="pi pi-check-circle"></i>
            No differences found - YAMLs are identical
          </Message>
        </TabPanel>

        <TabPanel value="3" header="Convert">
          <div class="editor-grid">
            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-file-edit"></i>
                <span>YAML Input</span>
              </div>
              <CodeEditor v-model="state.input" mode="yaml" height="350px" />
              <Toolbar class="editor-toolbar">
                <template #start>
                  <Button
                    label="To JSON"
                    icon="pi pi-arrow-right"
                    :disabled="!state.input"
                    @click="convertTo('json')"
                  />
                  <Button
                    label="To XML"
                    icon="pi pi-arrow-right"
                    severity="secondary"
                    :disabled="!state.input"
                    @click="convertTo('xml')"
                  />
                </template>
              </Toolbar>
            </div>

            <div class="editor-panel">
              <div class="panel-label">
                <i class="pi pi-file-export"></i>
                <span>{{ convertFormat.toUpperCase() }} Output</span>
                <Tag
                  v-if="convertOutput"
                  :value="convertFormat.toUpperCase()"
                  :severity="convertFormat === 'json' ? 'info' : 'warn'"
                />
              </div>
              <CodeEditor
                v-model="convertOutput"
                :mode="convertOutputMode"
                height="350px"
                :options="{ readOnly: true }"
              />
              <Toolbar class="editor-toolbar">
                <template #start>
                  <Button
                    label="Copy"
                    icon="pi pi-copy"
                    severity="secondary"
                    :disabled="!convertOutput"
                    @click="copyConvertedOutput"
                  />
                </template>
              </Toolbar>
            </div>
          </div>

          <Message v-if="convertError" severity="error" :closable="false">
            <i class="pi pi-times-circle"></i>
            {{ convertError }}
          </Message>
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
.query-panel {
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
  margin-bottom: 1rem;
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

.stats-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.error-message {
  margin-top: 1rem;

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

    .swap-button {
      justify-self: center;
      transform: rotate(90deg);
    }
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
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-top: 180px;
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

.query-input {
  margin-bottom: 1rem;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;

  i {
    color: var(--primary-color);
  }
}

.common-queries {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .query-label {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.query-error {
  margin-bottom: 1rem;

  i {
    margin-right: 0.5rem;
  }
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.compare-panel {
  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }

  :deep(.p-panel-content) {
    padding: 0.75rem;
  }
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
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

.diff-results {
  margin-top: 1rem;
}

.path-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  color: var(--primary-color);
}

.value-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  word-break: break-all;
  max-width: 200px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;

  &.added {
    background-color: rgba(34, 197, 94, 0.1);
    color: var(--green-500);
  }

  &.removed {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--red-500);
  }
}

.no-value {
  color: var(--text-color-secondary);
}
</style>
