<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import * as YAML from 'yaml'
import xmlFormatter from 'xml-formatter'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
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
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import CodeGeneratorPanel from '@/components/code-generator/CodeGeneratorPanel.vue'
import { useCodeGenerator } from '@/composables/useCodeGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

const { copy, showSuccess, showError, showInfo, showWarning } = useClipboardToast()

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

    // Handle flow level
    if (state.flowLevel >= 0) {
      // For positive flow levels, use collectionStyle
      // Flow level determines how deeply nested objects are formatted
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

// Copy output
const copyOutput = () => {
  void copy(state.output, { detail: 'Output copied to clipboard' })
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
    // Primitive types: string, number, boolean, bigint, symbol
    const primitiveValue = typeof data === 'string' ? data : JSON.stringify(data)
    return `<${name}>${primitiveValue}</${name}>`
  }

  return convert(obj, rootName)
}

// Convert YAML to other formats
const convertTo = (targetFormat: 'json' | 'xml') => {
  convertOutput.value = ''
  convertError.value = ''
  convertFormat.value = targetFormat

  try {
    const parsed: unknown = YAML.parse(state.input)

    if (targetFormat === 'json') {
      convertOutput.value = JSON.stringify(parsed, null, 2)
    } else {
      // targetFormat === 'xml'
      const parsedObj =
        typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null
      const rootName = parsedObj ? (Object.keys(parsedObj)[0] ?? 'root') : 'root'
      const xmlContent =
        parsedObj && Object.keys(parsedObj).length === 1
          ? jsonToXml(parsedObj[rootName], rootName)
          : jsonToXml(parsed, 'root')
      convertOutput.value = xmlFormatter(xmlContent, { indentation: '  ' })
    }
  } catch (e) {
    convertError.value = e instanceof Error ? e.message : 'Conversion failed'
  }
}

const copyConvertedOutput = () => {
  void copy(convertOutput.value, {
    detail: `${convertFormat.value.toUpperCase()} copied to clipboard`,
  })
}

// YAML Path query (simple implementation using dot/bracket notation)
const executeYamlPath = () => {
  yamlPathError.value = ''
  yamlPathResult.value = ''

  if (!yamlPathQuery.value.trim()) return

  try {
    const parsed: unknown = YAML.parse(state.input)
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

    if (typeof result === 'object' && result !== null) {
      yamlPathResult.value = YAML.stringify(result, { indent: 2 })
    } else if (result === null || result === undefined) {
      yamlPathResult.value = ''
    } else if (typeof result === 'string') {
      yamlPathResult.value = result
    } else {
      // number, boolean, bigint, symbol
      yamlPathResult.value = YAML.stringify(result)
    }
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
    const obj1: unknown = YAML.parse(compareYaml1.value)
    const obj2: unknown = YAML.parse(compareYaml2.value)
    return findDifferences(obj1, obj2)
  } catch {
    return []
  }
})

const findDifferences = (obj1: unknown, obj2: unknown, path = '$'): DiffItem[] => {
  // Type mismatch - early return
  if (typeof obj1 !== typeof obj2) {
    return [{
      path,
      type: 'changed',
      oldValue: YAML.stringify(obj1),
      newValue: YAML.stringify(obj2),
    }]
  }

  // Array comparison
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length)
    return Array.from({ length: maxLen }, (_, i) => i).flatMap(i => {
      if (i >= obj1.length) {
        return [{
          path: `${path}[${i}]`,
          type: 'added' as const,
          newValue: YAML.stringify(obj2[i]),
        }]
      }
      if (i >= obj2.length) {
        return [{
          path: `${path}[${i}]`,
          type: 'removed' as const,
          oldValue: YAML.stringify(obj1[i]),
        }]
      }
      return findDifferences(obj1[i], obj2[i], `${path}[${i}]`)
    })
  }

  // Object comparison
  if (
    obj1 !== null &&
    obj2 !== null &&
    typeof obj1 === 'object' &&
    typeof obj2 === 'object'
  ) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = [...new Set([...keys1, ...keys2])]

    return allKeys.flatMap(key => {
      const newPath = `${path}.${key}`
      if (!(key in obj1)) {
        return [{
          path: newPath,
          type: 'added' as const,
          newValue: YAML.stringify((obj2 as Record<string, unknown>)[key]),
        }]
      }
      if (!(key in obj2)) {
        return [{
          path: newPath,
          type: 'removed' as const,
          oldValue: YAML.stringify((obj1 as Record<string, unknown>)[key]),
        }]
      }
      return findDifferences(
        (obj1 as Record<string, unknown>)[key],
        (obj2 as Record<string, unknown>)[key],
        newPath,
      )
    })
  }

  // Primitive comparison
  if (obj1 !== obj2) {
    return [{
      path,
      type: 'changed',
      oldValue: YAML.stringify(obj1),
      newValue: YAML.stringify(obj2),
    }]
  }

  return []
}

// Load current YAML to compare
const loadToCompare1 = () => {
  compareYaml1.value = state.input
}

const loadToCompare2 = () => {
  compareYaml2.value = state.input
}

// Schema Validator state
interface SchemaValidationError {
  path: string
  message: string
  keyword: string
  params: Record<string, unknown>
}

const schemaInput = ref('')
const schemaErrors = ref<SchemaValidationError[]>([])
const schemaValidationResult = ref<{ valid: boolean; error?: string } | null>(null)
const schemaParseError = ref('')

// Validate YAML against JSON Schema
const validateSchema = () => {
  schemaErrors.value = []
  schemaValidationResult.value = null
  schemaParseError.value = ''

  if (!state.input.trim()) {
    schemaValidationResult.value = { valid: false, error: 'YAML input is empty' }
    return
  }

  if (!schemaInput.value.trim()) {
    schemaValidationResult.value = { valid: false, error: 'Schema is empty' }
    return
  }

  const parseYamlResult = (() => {
    try {
      return { success: true as const, data: YAML.parse(state.input) as unknown }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Parse error' }
    }
  })()

  if (!parseYamlResult.success) {
    schemaValidationResult.value = {
      valid: false,
      error: `Invalid YAML: ${parseYamlResult.error}`,
    }
    return
  }

  const parseSchemaResult = (() => {
    try {
      const parsed: unknown = JSON.parse(schemaInput.value)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { success: false as const, error: 'Schema must be a JSON object' }
      }
      return { success: true as const, data: parsed as Record<string, unknown> }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Parse error' }
    }
  })()

  if (!parseSchemaResult.success) {
    schemaParseError.value = parseSchemaResult.error
    schemaValidationResult.value = { valid: false, error: 'Invalid schema structure' }
    return
  }

  const yamlData = parseYamlResult.data
  const schema = parseSchemaResult.data

  try {
    const validate = ajv.compile(schema)
    const valid = validate(yamlData)

    if (valid) {
      schemaValidationResult.value = { valid: true }
    } else {
      schemaValidationResult.value = { valid: false }
      schemaErrors.value =
        validate.errors?.map(err => ({
          path: err.instancePath || '/',
          message: err.message ?? 'Unknown error',
          keyword: err.keyword,
          params: err.params as Record<string, unknown>,
        })) ?? []
    }
  } catch (e) {
    schemaParseError.value = `Schema compilation error: ${e instanceof Error ? e.message : 'Unknown error'}`
    schemaValidationResult.value = { valid: false, error: 'Invalid schema structure' }
  }
}

// Load sample schema (also loads sample YAML data)
const loadSampleSchema = () => {
  // Load sample YAML data
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

  // Load sample schema
  schemaInput.value = JSON.stringify(
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            port: { type: 'integer', minimum: 1, maximum: 65535 },
            ssl: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                cert: { type: 'string' },
              },
            },
          },
          required: ['host', 'port'],
        },
        database: {
          type: 'object',
          properties: {
            driver: { type: 'string', enum: ['postgresql', 'mysql', 'sqlite'] },
            connection: {
              type: 'object',
              properties: {
                host: { type: 'string' },
                port: { type: 'integer' },
                name: { type: 'string' },
              },
              required: ['host', 'name'],
            },
          },
        },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              permissions: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['name', 'role'],
          },
        },
        features: {
          type: 'object',
        },
      },
      required: ['server'],
    },
    null,
    2,
  )
}

// Copy schema
const copySchema = () => {
  void copy(schemaInput.value, { detail: 'Schema copied to clipboard' })
}

// Generate schema from YAML data
const generateSchemaFromData = () => {
  if (!state.input.trim()) {
    showWarning('No Data', 'Please enter YAML data first')
    return
  }

  try {
    const data: unknown = YAML.parse(state.input)
    const schema = inferSchema(data)
    schemaInput.value = JSON.stringify(schema, null, 2)
    showSuccess('Generated', 'Schema generated from YAML data')
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'Failed to parse YAML')
  }
}

// Infer JSON Schema from data
const inferSchema = (data: unknown): Record<string, unknown> => {
  if (data === null) {
    return { type: 'null' }
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { type: 'array', items: {} }
    }
    return { type: 'array', items: inferSchema(data[0]) }
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)
    const properties = Object.fromEntries(entries.map(([key, value]) => [key, inferSchema(value)]))
    const required = entries.map(([key]) => key)

    return { type: 'object', properties, required }
  }

  if (typeof data === 'string') {
    // Detect common string formats
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      return { type: 'string', format: 'email' }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return { type: 'string', format: 'date' }
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      return { type: 'string', format: 'date-time' }
    }
    if (/^https?:\/\//.test(data)) {
      return { type: 'string', format: 'uri' }
    }
    return { type: 'string' }
  }

  if (typeof data === 'number') {
    return Number.isInteger(data) ? { type: 'integer' } : { type: 'number' }
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' }
  }

  return {}
}

// Code Generator - convert YAML to JSON for code generation
const yamlAsJson = computed(() => {
  try {
    const parsed = YAML.parse(state.input) as unknown
    return JSON.stringify(parsed, null, 2)
  } catch {
    return ''
  }
})

const {
  language: codeGenLanguage,
  options: codeGenOptions,
  generatedCode,
  selectedLanguageInfo,
  editorMode: codeGenEditorMode,
  error: codeGenError,
  resetOptions: resetCodeGenOptions,
} = useCodeGenerator(yamlAsJson)

// Auto-validate on input change
watchDebounced(() => state.input, validateYaml, { immediate: true, debounce: 300 })
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
      <Tabs value="0">
        <TabList>
          <Tab value="0">Format</Tab>
          <Tab value="1">Query</Tab>
          <Tab value="2">Compare</Tab>
          <Tab value="3">Convert</Tab>
          <Tab value="4">Schema</Tab>
          <Tab value="5">Generate</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <Panel toggleable class="options-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-cog"></i>
                  <span>Options</span>
                </div>
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
                    <ToggleSwitch
                      v-model="state.removeEmptyStrings"
                      input-id="removeEmptyStrings"
                    />
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

            <!-- Validation Result & Stats -->
            <div v-if="validationResult" class="validation-section">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-check-square"></i>
                  Validation Result
                </span>
              </Divider>

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
          </TabPanel>

          <TabPanel value="1">
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
                  Supports dot notation: $.key.subkey, array access: [0], or simple paths:
                  key.subkey
                </small>
              </div>

              <div class="common-queries">
                <span class="query-label">Common queries:</span>
                <Button
                  v-for="q in commonQueries"
                  :key="q.query"
                  :label="q.label"
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

            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file"></i>
                  <span>Source YAML</span>
                </div>
                <CodeEditor
                  v-model="state.input"
                  mode="yaml"
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                />
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
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                  :options="{ readOnly: true }"
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file"></i>
                  <span>YAML 1</span>
                </div>
                <CodeEditor
                  v-model="compareYaml1"
                  mode="yaml"
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="Load Current"
                      icon="pi pi-download"
                      severity="secondary"
                      :disabled="!state.input"
                      @click="loadToCompare1"
                    />
                  </template>
                </Toolbar>
              </div>

              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file"></i>
                  <span>YAML 2</span>
                </div>
                <CodeEditor
                  v-model="compareYaml2"
                  mode="yaml"
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="Load Current"
                      icon="pi pi-download"
                      severity="secondary"
                      :disabled="!state.input"
                      @click="loadToCompare2"
                    />
                  </template>
                </Toolbar>
              </div>
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
              <DataTable :value="compareYamlDiff" striped-rows size="small">
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

          <TabPanel value="3">
            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-edit"></i>
                  <span>YAML Input</span>
                </div>
                <CodeEditor
                  v-model="state.input"
                  mode="yaml"
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                />
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
                  height="clamp(300px, calc(100vh - 520px), 600px)"
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

          <TabPanel value="4">
            <Panel toggleable class="schema-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-verified"></i>
                  <span>YAML Schema Validator</span>
                  <Tag
                    v-if="schemaValidationResult"
                    :value="schemaValidationResult.valid ? 'Valid' : 'Invalid'"
                    :severity="schemaValidationResult.valid ? 'success' : 'danger'"
                    :icon="
                      schemaValidationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'
                    "
                  />
                </div>
              </template>

              <small class="hint-text">
                <i class="pi pi-info-circle"></i>
                Validate YAML data against a JSON Schema (Draft-07). YAML is parsed and validated
                using the same rules as JSON Schema.
              </small>
            </Panel>

            <Message
              v-if="schemaParseError"
              severity="error"
              :closable="false"
              class="schema-error"
            >
              <i class="pi pi-times-circle"></i>
              {{ schemaParseError }}
            </Message>

            <Message
              v-if="schemaValidationResult?.error"
              severity="warn"
              :closable="false"
              class="schema-error"
            >
              <i class="pi pi-exclamation-triangle"></i>
              {{ schemaValidationResult.error }}
            </Message>

            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-edit"></i>
                  <span>YAML Data</span>
                </div>
                <CodeEditor
                  v-model="state.input"
                  mode="yaml"
                  height="clamp(250px, calc(100vh - 580px), 500px)"
                />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="Load Sample"
                      icon="pi pi-file"
                      severity="secondary"
                      text
                      @click="loadSample"
                    />
                  </template>
                </Toolbar>
              </div>

              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-cog"></i>
                  <span>JSON Schema</span>
                </div>
                <CodeEditor
                  v-model="schemaInput"
                  mode="json"
                  height="clamp(250px, calc(100vh - 580px), 500px)"
                />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="Validate"
                      icon="pi pi-check"
                      :disabled="!state.input || !schemaInput"
                      @click="validateSchema"
                    />
                  </template>
                  <template #end>
                    <Button
                      v-tooltip.top="'Generate Schema from Data'"
                      icon="pi pi-bolt"
                      severity="success"
                      text
                      :disabled="!state.input"
                      @click="generateSchemaFromData"
                    />
                    <Button
                      v-tooltip.top="'Load Sample Schema'"
                      icon="pi pi-file"
                      severity="info"
                      text
                      @click="loadSampleSchema"
                    />
                    <Button
                      v-tooltip.top="'Copy Schema'"
                      icon="pi pi-copy"
                      severity="secondary"
                      text
                      :disabled="!schemaInput"
                      @click="copySchema"
                    />
                  </template>
                </Toolbar>
              </div>
            </div>

            <Divider v-if="schemaValidationResult" align="left">
              <span class="divider-text">
                <i class="pi pi-list"></i>
                Validation Result
              </span>
            </Divider>

            <Message
              v-if="schemaValidationResult?.valid"
              severity="success"
              :closable="false"
              class="validation-success"
            >
              <i class="pi pi-check-circle"></i>
              YAML is valid against the schema
            </Message>

            <div v-if="schemaErrors.length > 0" class="schema-errors">
              <DataTable :value="schemaErrors" striped-rows size="small">
                <Column field="path" header="Path" style="width: 150px">
                  <template #body="slotProps">
                    <code class="path-code">{{ slotProps.data.path }}</code>
                  </template>
                </Column>
                <Column field="keyword" header="Rule" style="width: 120px">
                  <template #body="slotProps">
                    <Tag :value="slotProps.data.keyword" severity="warn" />
                  </template>
                </Column>
                <Column field="message" header="Message">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.message }}</span>
                  </template>
                </Column>
                <Column header="Details" style="width: 200px">
                  <template #body="slotProps">
                    <code class="params-code">{{ JSON.stringify(slotProps.data.params) }}</code>
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>

          <TabPanel value="5">
            <CodeGeneratorPanel
              :json-input="yamlAsJson"
              :language="codeGenLanguage"
              :options="codeGenOptions"
              :generated-code="generatedCode"
              :editor-mode="codeGenEditorMode"
              :selected-language-info="selectedLanguageInfo"
              :error="codeGenError"
              input-mode="yaml"
              input-label="YAML Input"
              @update:language="codeGenLanguage = $event"
              @update:options="Object.assign(codeGenOptions, $event)"
              @reset-options="resetCodeGenOptions"
              @load-sample="loadSample"
            />
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

.options-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--surface-0, #ffffff);
  border-radius: 8px;
  border: 1px solid var(--surface-200, #e5e7eb);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  :deep(.p-inputnumber),
  :deep(.p-select) {
    width: 100%;
  }

  :deep(.p-inputnumber-input) {
    width: 100%;
    min-width: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--primary-color);
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 0.125rem;

  i {
    font-size: 0.8rem;
  }
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  label {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

.stats-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.error-message {
  margin-top: 1rem;

  i {
    margin-right: 0.5rem;
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

.editor-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.schema-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.schema-error {
  margin-bottom: 1rem;

  i {
    margin-right: 0.5rem;
  }
}

.validation-success {
  i {
    margin-right: 0.5rem;
  }
}

.schema-errors {
  margin-top: 1rem;
}

.params-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  word-break: break-all;
  max-width: 180px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
