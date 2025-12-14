<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import * as YAML from 'yaml'
import xmlFormatter from 'xml-formatter'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import CodeGeneratorPanel from '@/components/code-generator/CodeGeneratorPanel.vue'
import { useClipboardToast } from '@/composables/useClipboardToast'
import { useFormatters } from '@/composables/useFormatters'
import { useCodeGenerator } from '@/composables/useCodeGenerator'

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

const { copy, showSuccess, showError, showInfo, showWarning } = useClipboardToast()
const { error: formatError } = useFormatters()

// JSON format options
interface JsonFormatOptions {
  indentSize: number
  indentType: 'spaces' | 'tabs'
  sortKeys: boolean
  removeNulls: boolean
  removeEmptyStrings: boolean
  removeEmptyArrays: boolean
  removeEmptyObjects: boolean
  escapeUnicode: boolean
  trailingComma: boolean
  quoteStyle: 'double' | 'single'
  arrayBracketSpacing: boolean
  objectBracketSpacing: boolean
  colonSpacing: boolean
  compactArrays: boolean
  maxDepth: number
}

const defaultFormatOptions: JsonFormatOptions = {
  indentSize: 2,
  indentType: 'spaces',
  sortKeys: false,
  removeNulls: false,
  removeEmptyStrings: false,
  removeEmptyArrays: false,
  removeEmptyObjects: false,
  escapeUnicode: false,
  trailingComma: false,
  quoteStyle: 'double',
  arrayBracketSpacing: false,
  objectBracketSpacing: false,
  colonSpacing: true,
  compactArrays: false,
  maxDepth: 0,
}

const persistedJsonOptions = useLocalStorage<JsonFormatOptions>(
  'json-formatter-advanced-options',
  defaultFormatOptions,
)

const state = reactive({
  input: '{}',
  output: '',
  ...persistedJsonOptions.value,
})

// Indent type options
const indentTypeOptions = [
  { label: 'Spaces', value: 'spaces' },
  { label: 'Tabs', value: 'tabs' },
]

// Compute indent string from options
const getIndentString = (): string => {
  if (state.indentType === 'tabs') {
    return '\t'.repeat(state.indentSize > 0 ? 1 : 0)
  }
  return ' '.repeat(state.indentSize)
}

// Quote style options
const quoteStyleOptions = [
  { label: 'Double quotes (")', value: 'double' },
  { label: "Single quotes (')", value: 'single' },
]

// Validation state
const validationResult = ref<{ valid: boolean; error?: string; path?: string } | null>(null)
const jsonStats = ref<{
  keys: number
  values: number
  depth: number
  size: string
} | null>(null)

// JSON Path query
const jsonPathQuery = ref('')
const jsonPathResult = ref<string>('')
const jsonPathError = ref('')

// Compare tab state
const compareJson1 = ref('')
const compareJson2 = ref('')

// Validate JSON and calculate stats
const validateJson = () => {
  validationResult.value = null
  jsonStats.value = null

  if (!state.input.trim()) {
    validationResult.value = { valid: false, error: 'Empty input' }
    return
  }

  try {
    const parsed: unknown = JSON.parse(state.input)
    validationResult.value = { valid: true }

    // Calculate stats
    const stats = calculateJsonStats(parsed)
    jsonStats.value = stats
  } catch (e) {
    if (e instanceof SyntaxError) {
      const match = /position (\d+)/.exec(e.message)
      const position = match?.[1] ? parseInt(match[1]) : undefined

      const path =
        position !== undefined
          ? (() => {
              const beforeError = state.input.substring(0, position)
              const lines = beforeError.split('\n')
              const lastLine = lines[lines.length - 1] ?? ''
              return `Line ${lines.length}, Column ${lastLine.length + 1}`
            })()
          : ''

      validationResult.value = {
        valid: false,
        error: e.message,
        path,
      }
    } else {
      validationResult.value = {
        valid: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }
}

// Calculate JSON statistics
const calculateJsonStats = (
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

// Helper function to process JSON with options
const processJsonWithOptions = (obj: unknown, depth = 0): unknown => {
  // Max depth check
  if (state.maxDepth > 0 && depth >= state.maxDepth) {
    if (typeof obj === 'object' && obj !== null) {
      return Array.isArray(obj) ? '[...]' : '{...}'
    }
    return obj
  }

  if (obj === null) {
    return state.removeNulls ? undefined : null
  }

  if (Array.isArray(obj)) {
    const processed = obj
      .map(item => processJsonWithOptions(item, depth + 1))
      .filter(item => item !== undefined)
    return state.removeEmptyArrays && processed.length === 0 ? undefined : processed
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj)

    // Sort keys if enabled
    const sortedEntries = state.sortKeys
      ? entries.sort((a, b) => a[0].localeCompare(b[0]))
      : entries

    const processed = sortedEntries.reduce<Record<string, unknown>>((acc, [key, value]) => {
      const processedValue = processJsonWithOptions(value, depth + 1)
      if (processedValue !== undefined) {
        acc[key] = processedValue
      }
      return acc
    }, {})

    if (state.removeEmptyObjects && Object.keys(processed).length === 0) {
      return undefined
    }

    return processed
  }

  if (typeof obj === 'string') {
    if (state.removeEmptyStrings && obj === '') {
      return undefined
    }
    return obj
  }

  return obj
}

// JSON post-processing transformations
const escapeUnicodeTransform = (s: string): string =>
  s.replace(/[\u0080-\uFFFF]/g, char => {
    return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4)
  })

const singleQuoteTransform = (s: string): string =>
  s.replace(/"([^"\\]*)"/g, (match, content: string) => {
    if (content.includes("'")) {
      return match // Keep double quotes if content has single quotes
    }
    return `'${content}'`
  })

const arrayBracketSpacingTransform = (s: string): string =>
  s.replace(/\[(?!\s*\n)/g, '[ ').replace(/(?<!\n\s*)\]/g, ' ]')

const objectBracketSpacingTransform = (s: string): string =>
  s.replace(/\{(?!\s*\n)/g, '{ ').replace(/(?<!\n\s*)\}/g, ' }')

const removeColonSpacingTransform = (s: string): string => s.replace(/:\s+/g, ':')

const compactArraysTransform = (s: string): string =>
  s.replace(
    /\[\s*\n(\s*)((?:"[^"]*"|'[^']*'|[\d.eE+-]+|true|false|null)(?:,\s*\n\s*(?:"[^"]*"|'[^']*'|[\d.eE+-]+|true|false|null))*)\s*\n\s*\]/g,
    (_, _indent, content: string) => {
      const items = content.split(/,\s*\n\s*/)
      return '[' + items.join(', ') + ']'
    },
  )

const trailingCommaTransform = (s: string): string => s.replace(/([}\]])\n(\s*[}\]])/g, '$1,\n$2')

// Custom JSON stringify with options
const customStringify = (obj: unknown, indent: string): string => {
  const processedObj = processJsonWithOptions(obj)
  const baseResult = JSON.stringify(processedObj, null, indent)

  const transformations: ((s: string) => string)[] = [
    state.escapeUnicode ? escapeUnicodeTransform : null,
    state.quoteStyle === 'single' ? singleQuoteTransform : null,
    state.arrayBracketSpacing ? arrayBracketSpacingTransform : null,
    state.objectBracketSpacing ? objectBracketSpacingTransform : null,
    !state.colonSpacing ? removeColonSpacingTransform : null,
    state.compactArrays && indent ? compactArraysTransform : null,
    state.trailingComma && indent ? trailingCommaTransform : null,
  ].filter((fn): fn is (s: string) => string => fn !== null)

  return transformations.reduce((result, transform) => transform(result), baseResult)
}

// Format JSON
const onClickFormat = () => {
  try {
    const parsed: unknown = JSON.parse(state.input)
    const indentString = getIndentString()
    state.output = customStringify(parsed, indentString)
    // Save options
    persistedJsonOptions.value = {
      indentSize: state.indentSize,
      indentType: state.indentType,
      sortKeys: state.sortKeys,
      removeNulls: state.removeNulls,
      removeEmptyStrings: state.removeEmptyStrings,
      removeEmptyArrays: state.removeEmptyArrays,
      removeEmptyObjects: state.removeEmptyObjects,
      escapeUnicode: state.escapeUnicode,
      trailingComma: state.trailingComma,
      quoteStyle: state.quoteStyle,
      arrayBracketSpacing: state.arrayBracketSpacing,
      objectBracketSpacing: state.objectBracketSpacing,
      colonSpacing: state.colonSpacing,
      compactArrays: state.compactArrays,
      maxDepth: state.maxDepth,
    }
    validateJson()
    showSuccess('Formatted', 'JSON formatted successfully')
  } catch {
    showError('Error', formatError.value ?? 'Failed to format JSON')
  }
}

// Reset options to defaults
const resetOptions = () => {
  Object.assign(state, defaultFormatOptions)
  persistedJsonOptions.value = defaultFormatOptions
  showInfo('Reset', 'Options reset to defaults')
}

// Minify JSON
const onClickMinify = () => {
  try {
    const parsed: unknown = JSON.parse(state.input)
    state.output = JSON.stringify(parsed)
    validateJson()
    showSuccess('Minified', 'JSON minified successfully')
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'Failed to minify JSON')
  }
}

// Copy output
const copyOutput = () => {
  void copy(state.output, { detail: 'Output copied to clipboard' })
}

// Clear all
const clearAll = () => {
  state.input = ''
  state.output = ''
  validationResult.value = null
  jsonStats.value = null
}

// Load sample JSON
const loadSample = () => {
  state.input = JSON.stringify(
    {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
      },
      hobbies: ['reading', 'gaming', 'coding'],
      active: true,
    },
    null,
    2,
  )
  validateJson()
}

// JSON Path query (simple implementation)
const executeJsonPath = () => {
  jsonPathError.value = ''
  jsonPathResult.value = ''

  if (!jsonPathQuery.value.trim()) return

  try {
    const parsed: unknown = JSON.parse(state.input)
    const path = jsonPathQuery.value.trim()

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
      jsonPathResult.value = JSON.stringify(result, null, 2)
    } else if (result === null || result === undefined) {
      jsonPathResult.value = ''
    } else if (typeof result === 'string') {
      jsonPathResult.value = result
    } else {
      // number, boolean, bigint, symbol
      jsonPathResult.value = JSON.stringify(result)
    }
  } catch (e) {
    jsonPathError.value = e instanceof Error ? e.message : 'Query failed'
  }
}

// Common JSON path queries
const commonQueries = [
  { label: '$.name', query: '$.name' },
  { label: '$.address', query: '$.address' },
  { label: '$.hobbies[0]', query: '$.hobbies[0]' },
]

const applyQuery = (query: string) => {
  jsonPathQuery.value = query
  executeJsonPath()
}

// Compare JSONs
interface DiffItem {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

// Compute compare error separately to avoid side effects
const jsonCompareError = computed(() => {
  if (!compareJson1.value.trim() || !compareJson2.value.trim()) return ''
  try {
    JSON.parse(compareJson1.value)
    JSON.parse(compareJson2.value)
    return ''
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid JSON'
  }
})

const compareJsonDiff = computed((): DiffItem[] => {
  if (!compareJson1.value.trim() || !compareJson2.value.trim() || jsonCompareError.value) return []

  try {
    const obj1: unknown = JSON.parse(compareJson1.value)
    const obj2: unknown = JSON.parse(compareJson2.value)
    return findDifferences(obj1, obj2)
  } catch {
    return []
  }
})

const findDifferences = (obj1: unknown, obj2: unknown, path = '$'): DiffItem[] => {
  // Type mismatch - early return
  if (typeof obj1 !== typeof obj2) {
    return [
      {
        path,
        type: 'changed',
        oldValue: JSON.stringify(obj1),
        newValue: JSON.stringify(obj2),
      },
    ]
  }

  // Array comparison
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length)
    return Array.from({ length: maxLen }, (_, i) => i).flatMap(i => {
      if (i >= obj1.length) {
        return [
          {
            path: `${path}[${i}]`,
            type: 'added' as const,
            newValue: JSON.stringify(obj2[i]),
          },
        ]
      }
      if (i >= obj2.length) {
        return [
          {
            path: `${path}[${i}]`,
            type: 'removed' as const,
            oldValue: JSON.stringify(obj1[i]),
          },
        ]
      }
      return findDifferences(obj1[i], obj2[i], `${path}[${i}]`)
    })
  }

  // Object comparison
  if (obj1 !== null && obj2 !== null && typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = [...new Set([...keys1, ...keys2])]

    return allKeys.flatMap(key => {
      const newPath = `${path}.${key}`
      if (!(key in obj1)) {
        return [
          {
            path: newPath,
            type: 'added' as const,
            newValue: JSON.stringify((obj2 as Record<string, unknown>)[key]),
          },
        ]
      }
      if (!(key in obj2)) {
        return [
          {
            path: newPath,
            type: 'removed' as const,
            oldValue: JSON.stringify((obj1 as Record<string, unknown>)[key]),
          },
        ]
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
    return [
      {
        path,
        type: 'changed',
        oldValue: JSON.stringify(obj1),
        newValue: JSON.stringify(obj2),
      },
    ]
  }

  return []
}

// Load current JSON to compare
const loadToCompare1 = () => {
  compareJson1.value = state.input
}

const loadToCompare2 = () => {
  compareJson2.value = state.input
}

// Convert output state
const convertOutput = ref('')
const convertError = ref('')
const convertFormat = ref<'xml' | 'yaml'>('yaml')

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

// Validate JSON against schema
const validateSchema = () => {
  schemaErrors.value = []
  schemaValidationResult.value = null
  schemaParseError.value = ''

  if (!state.input.trim()) {
    schemaValidationResult.value = { valid: false, error: 'JSON input is empty' }
    return
  }

  if (!schemaInput.value.trim()) {
    schemaValidationResult.value = { valid: false, error: 'Schema is empty' }
    return
  }

  const parseJsonResult = (() => {
    try {
      return { success: true as const, data: JSON.parse(state.input) as unknown }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Parse error' }
    }
  })()

  if (!parseJsonResult.success) {
    schemaValidationResult.value = {
      valid: false,
      error: `Invalid JSON: ${parseJsonResult.error}`,
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

  const jsonData = parseJsonResult.data
  const schema = parseSchemaResult.data

  try {
    const validate = ajv.compile(schema)
    const valid = validate(jsonData)

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

// Load sample schema (also loads sample JSON data)
const loadSampleSchema = () => {
  // Load sample JSON data
  state.input = JSON.stringify(
    {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
      },
      hobbies: ['reading', 'gaming', 'coding'],
      active: true,
    },
    null,
    2,
  )

  // Load sample schema
  schemaInput.value = JSON.stringify(
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        age: { type: 'integer', minimum: 0 },
        email: { type: 'string', format: 'email' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
          },
          required: ['street', 'city'],
        },
        hobbies: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
        },
        active: { type: 'boolean' },
      },
      required: ['name', 'email'],
    },
    null,
    2,
  )
}

// Copy schema
const copySchema = () => {
  void copy(schemaInput.value, { detail: 'Schema copied to clipboard' })
}

// Generate schema from JSON data
const generateSchemaFromData = () => {
  if (!state.input.trim()) {
    showWarning('No Data', 'Please enter JSON data first')
    return
  }

  try {
    const data: unknown = JSON.parse(state.input)
    const schema = inferSchema(data)
    schemaInput.value = JSON.stringify(schema, null, 2)
    showSuccess('Generated', 'Schema generated from JSON data')
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'Failed to parse JSON')
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
    // Infer from first item (could be improved to merge all items)
    return {
      type: 'array',
      items: inferSchema(data[0]),
    }
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)
    const properties = Object.fromEntries(entries.map(([key, value]) => [key, inferSchema(value)]))
    const required = entries.map(([key]) => key)

    return {
      type: 'object',
      properties,
      required,
    }
  }

  if (typeof data === 'string') {
    // Try to detect format
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

// JSON to XML converter
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

// Convert JSON to other formats
const convertTo = (format: 'xml' | 'yaml') => {
  convertOutput.value = ''
  convertError.value = ''
  convertFormat.value = format

  try {
    const parsed: unknown = JSON.parse(state.input)

    if (format === 'yaml') {
      convertOutput.value = YAML.stringify(parsed, { indent: 2 })
    } else {
      // format === 'xml'
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

const convertOutputMode = computed(() => {
  return convertFormat.value === 'yaml' ? 'yaml' : 'xml'
})

// Code Generator
const jsonInputRef = computed(() => state.input)
const {
  language: codeGenLanguage,
  options: codeGenOptions,
  generatedCode,
  selectedLanguageInfo,
  editorMode: codeGenEditorMode,
  error: codeGenError,
  resetOptions: resetCodeGenOptions,
} = useCodeGenerator(jsonInputRef)

// Auto-validate on input change
watchDebounced(() => state.input, validateJson, { immediate: true, debounce: 300 })
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>JSON Formatter</span>
      </div>
    </template>
    <template #subtitle> Format, validate, query, and convert JSON data </template>
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
                    <i class="pi pi-align-left"></i>
                    Indentation
                  </div>
                  <div class="option-item">
                    <label for="indentSize">Indent Size</label>
                    <InputNumber
                      id="indentSize"
                      v-model="state.indentSize"
                      :min="0"
                      :max="8"
                      show-buttons
                      button-layout="horizontal"
                    />
                  </div>
                  <div class="option-item">
                    <label for="indentType">Indent Type</label>
                    <Select
                      id="indentType"
                      v-model="state.indentType"
                      :options="indentTypeOptions"
                      option-label="label"
                      option-value="value"
                    />
                  </div>
                </div>

                <!-- Basic Options -->
                <div class="options-section">
                  <div class="section-title">
                    <i class="pi pi-sliders-h"></i>
                    Basic
                  </div>
                  <div class="option-item">
                    <label for="quoteStyle">Quote Style</label>
                    <Select
                      id="quoteStyle"
                      v-model="state.quoteStyle"
                      :options="quoteStyleOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Quotes"
                    />
                  </div>
                  <div class="option-item">
                    <label for="maxDepth">Max Depth (0 = unlimited)</label>
                    <InputNumber
                      id="maxDepth"
                      v-model="state.maxDepth"
                      :min="0"
                      :max="100"
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
                    <ToggleSwitch v-model="state.removeEmptyArrays" input-id="removeEmptyArrays" />
                    <label for="removeEmptyArrays">Remove empty arrays</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.removeEmptyObjects"
                      input-id="removeEmptyObjects"
                    />
                    <label for="removeEmptyObjects">Remove empty objects</label>
                  </div>
                </div>

                <!-- Formatting Style -->
                <div class="options-section">
                  <div class="section-title">
                    <i class="pi pi-palette"></i>
                    Formatting Style
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.colonSpacing" input-id="colonSpacing" />
                    <label for="colonSpacing">Space after colon</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.arrayBracketSpacing"
                      input-id="arrayBracketSpacing"
                    />
                    <label for="arrayBracketSpacing">Space inside array brackets</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.objectBracketSpacing"
                      input-id="objectBracketSpacing"
                    />
                    <label for="objectBracketSpacing">Space inside object braces</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.compactArrays" input-id="compactArrays" />
                    <label for="compactArrays">Compact primitive arrays</label>
                  </div>
                </div>

                <!-- Advanced -->
                <div class="options-section">
                  <div class="section-title">
                    <i class="pi pi-cog"></i>
                    Advanced
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.escapeUnicode" input-id="escapeUnicode" />
                    <label for="escapeUnicode">Escape Unicode characters</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.trailingComma" input-id="trailingComma" />
                    <label for="trailingComma">Add trailing commas (non-standard)</label>
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
                  mode="json"
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
                  mode="json"
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
                  :value="validationResult.valid ? 'Valid JSON' : 'Invalid JSON'"
                  :severity="validationResult.valid ? 'success' : 'danger'"
                  :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                  class="validation-tag"
                />

                <div v-if="jsonStats && validationResult.valid" class="stats-display">
                  <Tag :value="`${jsonStats.keys} keys`" severity="info" icon="pi pi-key" />
                  <Tag :value="`${jsonStats.values} values`" severity="secondary" />
                  <Tag :value="`Depth: ${jsonStats.depth}`" severity="secondary" />
                  <Tag :value="jsonStats.size" severity="secondary" icon="pi pi-file" />
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
                <Tag v-if="validationResult.path" :value="validationResult.path" severity="warn" />
              </Message>
            </div>
          </TabPanel>

          <TabPanel value="1">
            <Panel toggleable class="query-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-search"></i>
                  <span>JSON Path Query</span>
                </div>
              </template>

              <div class="query-input">
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-search"></i>
                  </InputGroupAddon>
                  <InputText
                    v-model="jsonPathQuery"
                    placeholder="e.g., $.address.city or hobbies[0]"
                    @keyup.enter="executeJsonPath"
                  />
                  <Button
                    label="Query"
                    icon="pi pi-play"
                    :disabled="!jsonPathQuery || !state.input"
                    @click="executeJsonPath"
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

            <Message v-if="jsonPathError" severity="error" :closable="false" class="query-error">
              <i class="pi pi-times-circle"></i>
              {{ jsonPathError }}
            </Message>

            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file"></i>
                  <span>Source JSON</span>
                </div>
                <CodeEditor
                  v-model="state.input"
                  mode="json"
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                />
              </div>

              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-check-square"></i>
                  <span>Query Result</span>
                  <Tag
                    v-if="jsonPathResult"
                    value="Match found"
                    severity="success"
                    icon="pi pi-check"
                  />
                </div>
                <CodeEditor
                  v-model="jsonPathResult"
                  mode="json"
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
                  <span>JSON 1</span>
                </div>
                <CodeEditor
                  v-model="compareJson1"
                  mode="json"
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
                  <span>JSON 2</span>
                </div>
                <CodeEditor
                  v-model="compareJson2"
                  mode="json"
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

            <Message v-if="jsonCompareError" severity="error" :closable="false">
              <i class="pi pi-times-circle"></i>
              {{ jsonCompareError }}
            </Message>

            <Divider v-if="compareJson1 && compareJson2 && !jsonCompareError" align="left">
              <span class="divider-text">
                <i class="pi pi-list"></i>
                Comparison Result
                <Tag
                  v-if="compareJsonDiff.length > 0"
                  :value="`${compareJsonDiff.length} differences`"
                  severity="warn"
                />
                <Tag v-else value="Identical" severity="success" icon="pi pi-check" />
              </span>
            </Divider>

            <div v-if="compareJsonDiff.length > 0" class="diff-results">
              <DataTable :value="compareJsonDiff" striped-rows size="small">
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
              v-else-if="compareJson1 && compareJson2 && !jsonCompareError"
              severity="success"
              :closable="false"
            >
              <i class="pi pi-check-circle"></i>
              No differences found - JSONs are identical
            </Message>
          </TabPanel>

          <TabPanel value="3">
            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-edit"></i>
                  <span>JSON Input</span>
                </div>
                <CodeEditor
                  v-model="state.input"
                  mode="json"
                  height="clamp(300px, calc(100vh - 520px), 600px)"
                />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="To YAML"
                      icon="pi pi-arrow-right"
                      :disabled="!state.input"
                      @click="convertTo('yaml')"
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
                    :severity="convertFormat === 'yaml' ? 'info' : 'warn'"
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
                  <span>JSON Schema Validator</span>
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
                Validate JSON data against a JSON Schema (Draft-07). Supports format validation
                (email, uri, date, etc.)
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
                  <span>JSON Data</span>
                </div>
                <CodeEditor
                  v-model="state.input"
                  mode="json"
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
                      v-tooltip.top="'Load Sample'"
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
              JSON is valid against the schema
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
              :json-input="state.input"
              :language="codeGenLanguage"
              :options="codeGenOptions"
              :generated-code="generatedCode"
              :editor-mode="codeGenEditorMode"
              :selected-language-info="selectedLanguageInfo"
              :error="codeGenError"
              input-mode="json"
              input-label="JSON Input"
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
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

.editor-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

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
