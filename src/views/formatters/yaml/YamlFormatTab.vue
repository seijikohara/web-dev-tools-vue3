<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import * as YAML from 'yaml'

import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess, showError, showInfo } = useClipboardToast()

// YAML format options interface
interface YamlFormatOptions {
  indentSize: number
  sortKeys: boolean
  removeNulls: boolean
  removeEmptyStrings: boolean
  lineWidth: number
  minContentWidth: number
  defaultKeyType: 'PLAIN' | 'QUOTE_SINGLE' | 'QUOTE_DOUBLE'
  defaultStringType: 'PLAIN' | 'QUOTE_SINGLE' | 'QUOTE_DOUBLE' | 'BLOCK_LITERAL' | 'BLOCK_FOLDED'
  trueStr: string
  falseStr: string
  nullStr: string
  singleQuote: boolean
  flowLevel: number
  forceQuotes: boolean
  keepSourceTokens: boolean
  sortMapEntries: boolean
  anchorPrefix: string
  mergeAnchors: boolean
}

const defaultYamlOptions: YamlFormatOptions = {
  indentSize: 2,
  sortKeys: false,
  removeNulls: false,
  removeEmptyStrings: false,
  lineWidth: 80,
  minContentWidth: 20,
  defaultKeyType: 'PLAIN',
  defaultStringType: 'PLAIN',
  trueStr: 'true',
  falseStr: 'false',
  nullStr: 'null',
  singleQuote: false,
  flowLevel: -1,
  forceQuotes: false,
  keepSourceTokens: false,
  sortMapEntries: false,
  anchorPrefix: 'a',
  mergeAnchors: false,
}

const persistedYamlOptions = useLocalStorage<YamlFormatOptions>(
  'yaml-formatter-advanced-options',
  defaultYamlOptions,
)

const state = reactive({
  input: '---\n',
  output: '',
  ...persistedYamlOptions.value,
})

// Key type options
const keyTypeOptions = [
  { label: 'Plain', value: 'PLAIN' },
  { label: 'Single Quoted', value: 'QUOTE_SINGLE' },
  { label: 'Double Quoted', value: 'QUOTE_DOUBLE' },
]

// String type options
const stringTypeOptions = [
  { label: 'Plain', value: 'PLAIN' },
  { label: 'Single Quoted', value: 'QUOTE_SINGLE' },
  { label: 'Double Quoted', value: 'QUOTE_DOUBLE' },
  { label: 'Block Literal (|)', value: 'BLOCK_LITERAL' },
  { label: 'Block Folded (>)', value: 'BLOCK_FOLDED' },
]

// Boolean representation options
const boolTrueOptions = [
  { label: 'true', value: 'true' },
  { label: 'yes', value: 'yes' },
  { label: 'on', value: 'on' },
  { label: 'True', value: 'True' },
  { label: 'TRUE', value: 'TRUE' },
]

const boolFalseOptions = [
  { label: 'false', value: 'false' },
  { label: 'no', value: 'no' },
  { label: 'off', value: 'off' },
  { label: 'False', value: 'False' },
  { label: 'FALSE', value: 'FALSE' },
]

const nullOptions = [
  { label: 'null', value: 'null' },
  { label: '~', value: '~' },
  { label: 'Null', value: 'Null' },
  { label: 'NULL', value: 'NULL' },
  { label: '(empty)', value: '' },
]

// Validation state
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)
const yamlStats = ref<{
  keys: number
  values: number
  depth: number
  size: string
} | null>(null)

// Validate YAML
const validateYaml = () => {
  validationResult.value = null
  yamlStats.value = null

  if (!state.input.trim()) {
    validationResult.value = { valid: false, error: 'Empty input' }
    return
  }

  try {
    const parsed: unknown = YAML.parse(state.input)
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

// Process YAML data with options
const processYamlWithOptions = (obj: unknown): unknown => {
  if (obj === null) {
    return state.removeNulls ? undefined : null
  }

  if (Array.isArray(obj)) {
    return obj.map(item => processYamlWithOptions(item)).filter(item => item !== undefined)
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj)

    // Sort keys if enabled
    const sortedEntries = state.sortKeys
      ? entries.sort((a, b) => a[0].localeCompare(b[0]))
      : entries

    return sortedEntries.reduce<Record<string, unknown>>((acc, [key, value]) => {
      const processedValue = processYamlWithOptions(value)
      if (processedValue !== undefined) {
        acc[key] = processedValue
      }
      return acc
    }, {})
  }

  if (typeof obj === 'string') {
    if (state.removeEmptyStrings && obj === '') {
      return undefined
    }
    return obj
  }

  return obj
}

// Save YAML options to localStorage
const saveYamlOptions = () => {
  persistedYamlOptions.value = {
    indentSize: state.indentSize,
    sortKeys: state.sortKeys,
    removeNulls: state.removeNulls,
    removeEmptyStrings: state.removeEmptyStrings,
    lineWidth: state.lineWidth,
    minContentWidth: state.minContentWidth,
    defaultKeyType: state.defaultKeyType,
    defaultStringType: state.defaultStringType,
    trueStr: state.trueStr,
    falseStr: state.falseStr,
    nullStr: state.nullStr,
    singleQuote: state.singleQuote,
    flowLevel: state.flowLevel,
    forceQuotes: state.forceQuotes,
    keepSourceTokens: state.keepSourceTokens,
    sortMapEntries: state.sortMapEntries,
    anchorPrefix: state.anchorPrefix,
    mergeAnchors: state.mergeAnchors,
  }
}

// Reset options to defaults
const resetOptions = () => {
  Object.assign(state, defaultYamlOptions)
  persistedYamlOptions.value = defaultYamlOptions
  showInfo('Reset', 'Options reset to defaults')
}

// Format YAML
const onClickFormat = () => {
  try {
    const parsed: unknown = YAML.parse(state.input)
    const processed = processYamlWithOptions(parsed)

    const stringifyOptions: YAML.DocumentOptions & YAML.SchemaOptions & YAML.ToStringOptions = {
      indent: state.indentSize,
      lineWidth: state.lineWidth > 0 ? state.lineWidth : 0,
      minContentWidth: state.minContentWidth,
      singleQuote: state.singleQuote,
      trueStr: state.trueStr,
      falseStr: state.falseStr,
      nullStr: state.nullStr,
    }

    state.output = YAML.stringify(processed, stringifyOptions)
    saveYamlOptions()
    validateYaml()
    showSuccess('Formatted', 'YAML formatted successfully')
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'Failed to format YAML')
  }
}

// Minify YAML (convert to single-line flow style where possible)
const onClickMinify = () => {
  try {
    const parsed: unknown = YAML.parse(state.input)
    state.output = YAML.stringify(parsed, { indent: 0, lineWidth: 0 })
    validateYaml()
    showSuccess('Minified', 'YAML minified successfully')
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'Failed to minify YAML')
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

// Auto-validate on input change
watchDebounced(() => state.input, validateYaml, { immediate: true, debounce: 300 })

// Export state and methods for other tabs
defineExpose({
  state,
  loadSample,
})
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="cog">Options</PanelHeader>
    </template>

    <div class="options-grid">
      <!-- Indentation -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-arrows-h"></i>
          Indentation
        </div>
        <div class="option-item">
          <label for="indentSize">Indent Size (spaces)</label>
          <InputNumber
            id="indentSize"
            v-model="state.indentSize"
            :min="0"
            :max="8"
            show-buttons
            button-layout="horizontal"
          />
        </div>
      </div>

      <!-- Line Width -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-sliders-h"></i>
          Line Width
        </div>
        <div class="option-item">
          <label for="lineWidth">Line Width (0 = unlimited)</label>
          <InputNumber
            id="lineWidth"
            v-model="state.lineWidth"
            :min="0"
            :max="500"
            show-buttons
            button-layout="horizontal"
          />
        </div>
        <div class="option-item">
          <label for="minContentWidth">Min Content Width</label>
          <InputNumber
            id="minContentWidth"
            v-model="state.minContentWidth"
            :min="0"
            :max="200"
            show-buttons
            button-layout="horizontal"
          />
        </div>
      </div>

      <!-- Key & Value Processing -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-filter"></i>
          Key & Value Processing
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.sortKeys" input-id="sortKeys" />
          <label for="sortKeys">Sort keys alphabetically</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeNulls" input-id="removeNulls" />
          <label for="removeNulls">Remove null values</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeEmptyStrings" input-id="removeEmptyStrings" />
          <label for="removeEmptyStrings">Remove empty strings</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.sortMapEntries" input-id="sortMapEntries" />
          <label for="sortMapEntries">Sort map entries</label>
        </div>
      </div>

      <!-- String Style -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-pencil"></i>
          String Style
        </div>
        <div class="option-item">
          <label for="defaultKeyType">Default Key Type</label>
          <Select
            id="defaultKeyType"
            v-model="state.defaultKeyType"
            :options="keyTypeOptions"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="option-item">
          <label for="defaultStringType">Default String Type</label>
          <Select
            id="defaultStringType"
            v-model="state.defaultStringType"
            :options="stringTypeOptions"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.singleQuote" input-id="singleQuote" />
          <label for="singleQuote">Prefer single quotes</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.forceQuotes" input-id="forceQuotes" />
          <label for="forceQuotes">Force quote all strings</label>
        </div>
      </div>

      <!-- Boolean & Null Representation -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-hashtag"></i>
          Value Representation
        </div>
        <div class="option-item">
          <label for="trueStr">True value</label>
          <Select
            id="trueStr"
            v-model="state.trueStr"
            :options="boolTrueOptions"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="option-item">
          <label for="falseStr">False value</label>
          <Select
            id="falseStr"
            v-model="state.falseStr"
            :options="boolFalseOptions"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="option-item">
          <label for="nullStr">Null value</label>
          <Select
            id="nullStr"
            v-model="state.nullStr"
            :options="nullOptions"
            option-label="label"
            option-value="value"
          />
        </div>
      </div>

      <!-- Advanced Options -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-cog"></i>
          Advanced
        </div>
        <div class="option-item">
          <label for="flowLevel">Flow Level (-1 = block style)</label>
          <InputNumber
            id="flowLevel"
            v-model="state.flowLevel"
            :min="-1"
            :max="10"
            show-buttons
            button-layout="horizontal"
          />
        </div>
        <div class="option-item">
          <label for="anchorPrefix">Anchor Prefix</label>
          <InputText id="anchorPrefix" v-model="state.anchorPrefix" placeholder="a" />
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.mergeAnchors" input-id="mergeAnchors" />
          <label for="mergeAnchors">Merge anchors</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.keepSourceTokens" input-id="keepSourceTokens" />
          <label for="keepSourceTokens">Keep source tokens</label>
        </div>
      </div>
    </div>

    <div class="options-actions">
      <Button
        label="Reset to Defaults"
        icon="pi pi-refresh"
        severity="secondary"
        text
        size="small"
        @click="resetOptions"
      />
    </div>
  </Panel>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-import"></i>
        <span>Input</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
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

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-export"></i>
        <span>Output</span>
      </div>
      <CodeEditor
        v-model="state.output"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
        :options="{ readOnly: true }"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <CopyButton
            :value="state.output"
            label="Copy"
            tooltip="Output copied to clipboard"
            :disabled="!state.output"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <!-- Validation Result & Stats -->
  <div v-if="validationResult" class="validation-section">
    <SectionDivider icon="check-square">Validation Result</SectionDivider>

    <div class="validation-content">
      <Tag
        :value="validationResult.valid ? 'Valid YAML' : 'Invalid YAML'"
        :severity="validationResult.valid ? 'success' : 'danger'"
        :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        class="validation-tag"
      />

      <div v-if="yamlStats && validationResult.valid" class="stats-display">
        <Tag :value="`${yamlStats.keys} keys`" severity="info" icon="pi pi-key" />
        <Tag :value="`${yamlStats.values} values`" severity="secondary" />
        <Tag :value="`Depth: ${yamlStats.depth}`" severity="secondary" />
        <Tag :value="yamlStats.size" severity="secondary" icon="pi pi-file" />
      </div>
    </div>

    <Message
      v-if="!validationResult.valid && validationResult.error !== 'Empty input'"
      severity="error"
      :closable="false"
      class="error-message"
    >
      <i class="pi pi-times-circle"></i>
      {{ validationResult.error }}
    </Message>
  </div>
</template>

<style lang="scss" scoped>
.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.options-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.validation-section {
  margin-top: 1.5rem;
}

.validation-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.validation-tag {
  font-size: 0.95rem;
}

.error-message {
  margin-top: 1rem;

  i {
    margin-right: 0.5rem;
  }
}
</style>
