import { reactive, ref, computed, type Ref } from 'vue'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import * as YAML from 'yaml'
import xmlFormatter from 'xml-formatter'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

// Types
export interface JsonFormatOptions {
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

export interface JsonStats {
  keys: number
  values: number
  depth: number
  size: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  path?: string
}

export interface DiffItem {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

export interface SchemaValidationError {
  path: string
  message: string
  keyword: string
  params: Record<string, unknown>
}

const defaultFormatOptions = {
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
} as const satisfies JsonFormatOptions

// Singleton state for sharing between tabs
let sharedState: ReturnType<typeof createJsonFormatterState> | null = null

function createJsonFormatterState() {
  const persistedOptions = useLocalStorage<JsonFormatOptions>(
    'json-formatter-advanced-options',
    defaultFormatOptions,
  )

  const state = reactive({
    input: '{}',
    output: '',
    ...persistedOptions.value,
  })

  const validationResult = ref<ValidationResult | null>(null)
  const jsonStats = ref<JsonStats | null>(null)

  // Indent type options
  const indentTypeOptions = [
    { label: 'Spaces', value: 'spaces' },
    { label: 'Tabs', value: 'tabs' },
  ]

  // Quote style options
  const quoteStyleOptions = [
    { label: 'Double quotes (")', value: 'double' },
    { label: "Single quotes (')", value: 'single' },
  ]

  /**
   * Pure function: Compute indent string from options
   */
  const getIndentString = (): string =>
    state.indentType === 'tabs'
      ? '\t'.repeat(state.indentSize > 0 ? 1 : 0)
      : ' '.repeat(state.indentSize)

  // Calculate JSON statistics using pure recursive approach
  const calculateJsonStats = (obj: unknown, _depth = 0): JsonStats => {
    interface TraverseResult {
      keys: number
      values: number
      maxDepth: number
    }

    const traverse = (item: unknown, currentDepth: number): TraverseResult => {
      if (Array.isArray(item)) {
        const childResults = item.map(i => traverse(i, currentDepth + 1))
        return childResults.reduce(
          (acc, result) => ({
            keys: acc.keys + result.keys,
            values: acc.values + result.values,
            maxDepth: Math.max(acc.maxDepth, result.maxDepth),
          }),
          { keys: 0, values: item.length, maxDepth: currentDepth },
        )
      }

      if (item !== null && typeof item === 'object') {
        const entries = Object.entries(item as Record<string, unknown>)
        const childResults = entries.map(([, v]) => traverse(v, currentDepth + 1))
        return childResults.reduce(
          (acc, result) => ({
            keys: acc.keys + result.keys,
            values: acc.values + result.values,
            maxDepth: Math.max(acc.maxDepth, result.maxDepth),
          }),
          { keys: entries.length, values: 0, maxDepth: currentDepth },
        )
      }

      return { keys: 0, values: 1, maxDepth: currentDepth }
    }

    const result = traverse(obj, 0)

    const bytes = new Blob([state.input]).size
    const size =
      bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 * 1024
          ? `${(bytes / 1024).toFixed(2)} KB`
          : `${(bytes / (1024 * 1024)).toFixed(2)} MB`

    return { keys: result.keys, values: result.values, depth: result.maxDepth, size }
  }

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
      jsonStats.value = calculateJsonStats(parsed)
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

  // Helper function to process JSON with options
  const processJsonWithOptions = (obj: unknown, depth = 0): unknown => {
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

  /**
   * Pure transformation functions for JSON post-processing
   */
  const escapeUnicodeTransform = (s: string): string =>
    s.replace(
      /[\u0080-\uFFFF]/g,
      char => `\\u${('0000' + char.charCodeAt(0).toString(16)).slice(-4)}`,
    )

  const singleQuoteTransform = (s: string): string =>
    s.replace(/"([^"\\]*)"/g, (match, content: string) =>
      content.includes("'") ? match : `'${content}'`,
    )

  const arrayBracketSpacingTransform = (s: string): string =>
    s.replace(/\[(?!\s*\n)/g, '[ ').replace(/(?<!\n\s*)\]/g, ' ]')

  const objectBracketSpacingTransform = (s: string): string =>
    s.replace(/\{(?!\s*\n)/g, '{ ').replace(/(?<!\n\s*)\}/g, ' }')

  const removeColonSpacingTransform = (s: string): string => s.replace(/:\s+/g, ':')

  const compactArraysTransform = (s: string): string =>
    s.replace(
      /\[\s*\n(\s*)((?:"[^"]*"|'[^']*'|[\d.eE+-]+|true|false|null)(?:,\s*\n\s*(?:"[^"]*"|'[^']*'|[\d.eE+-]+|true|false|null))*)\s*\n\s*\]/g,
      (_, _indent, content: string) => `[${content.split(/,\s*\n\s*/).join(', ')}]`,
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
  const formatJson = (): { success: boolean; error?: string } => {
    try {
      const parsed: unknown = JSON.parse(state.input)
      const indentString = getIndentString()
      state.output = customStringify(parsed, indentString)
      persistedOptions.value = {
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
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to format JSON' }
    }
  }

  // Minify JSON
  const minifyJson = (): { success: boolean; error?: string } => {
    try {
      const parsed: unknown = JSON.parse(state.input)
      state.output = JSON.stringify(parsed)
      validateJson()
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to minify JSON' }
    }
  }

  // Reset options to defaults
  const resetOptions = () => {
    Object.assign(state, defaultFormatOptions)
    persistedOptions.value = defaultFormatOptions
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

  // Auto-validate on input change
  watchDebounced(() => state.input, validateJson, { immediate: true, debounce: 300 })

  return {
    state,
    validationResult,
    jsonStats,
    indentTypeOptions,
    quoteStyleOptions,
    getIndentString,
    formatJson,
    minifyJson,
    resetOptions,
    clearAll,
    loadSample,
    validateJson,
  }
}

// Query Tab
export function useJsonQuery(inputRef: Ref<string>) {
  const jsonPathQuery = ref('')
  const jsonPathResult = ref<string>('')
  const jsonPathError = ref('')

  const commonQueries = [
    { label: '$.name', query: '$.name' },
    { label: '$.address', query: '$.address' },
    { label: '$.hobbies[0]', query: '$.hobbies[0]' },
  ]

  const executeJsonPath = () => {
    jsonPathError.value = ''
    jsonPathResult.value = ''

    if (!jsonPathQuery.value.trim()) return

    try {
      const parsed: unknown = JSON.parse(inputRef.value)
      const path = jsonPathQuery.value.trim()

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
        jsonPathResult.value = JSON.stringify(result)
      }
    } catch (e) {
      jsonPathError.value = e instanceof Error ? e.message : 'Query failed'
    }
  }

  const applyQuery = (query: string) => {
    jsonPathQuery.value = query
    executeJsonPath()
  }

  return {
    jsonPathQuery,
    jsonPathResult,
    jsonPathError,
    commonQueries,
    executeJsonPath,
    applyQuery,
  }
}

// Compare Tab
export function useJsonCompare(inputRef: Ref<string>) {
  const compareJson1 = ref('')
  const compareJson2 = ref('')

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

  const compareJsonDiff = computed((): DiffItem[] => {
    if (!compareJson1.value.trim() || !compareJson2.value.trim() || jsonCompareError.value)
      return []

    try {
      const obj1: unknown = JSON.parse(compareJson1.value)
      const obj2: unknown = JSON.parse(compareJson2.value)
      return findDifferences(obj1, obj2)
    } catch {
      return []
    }
  })

  const loadToCompare1 = () => {
    compareJson1.value = inputRef.value
  }

  const loadToCompare2 = () => {
    compareJson2.value = inputRef.value
  }

  return {
    compareJson1,
    compareJson2,
    jsonCompareError,
    compareJsonDiff,
    loadToCompare1,
    loadToCompare2,
  }
}

// Convert Tab
export function useJsonConvert(inputRef: Ref<string>) {
  const convertOutput = ref('')
  const convertError = ref('')
  const convertFormat = ref<'xml' | 'yaml'>('yaml')

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
      const primitiveValue = typeof data === 'string' ? data : JSON.stringify(data)
      return `<${name}>${primitiveValue}</${name}>`
    }

    return convert(obj, rootName)
  }

  const convertTo = (format: 'xml' | 'yaml') => {
    convertOutput.value = ''
    convertError.value = ''
    convertFormat.value = format

    try {
      const parsed: unknown = JSON.parse(inputRef.value)

      if (format === 'yaml') {
        convertOutput.value = YAML.stringify(parsed, { indent: 2 })
      } else {
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

  const convertOutputMode = computed(() => {
    return convertFormat.value === 'yaml' ? 'yaml' : 'xml'
  })

  return {
    convertOutput,
    convertError,
    convertFormat,
    convertOutputMode,
    convertTo,
  }
}

// Schema Tab
export function useJsonSchema(inputRef: Ref<string>) {
  const schemaInput = ref('')
  const schemaErrors = ref<SchemaValidationError[]>([])
  const schemaValidationResult = ref<{ valid: boolean; error?: string } | null>(null)
  const schemaParseError = ref('')

  const validateSchema = () => {
    schemaErrors.value = []
    schemaValidationResult.value = null
    schemaParseError.value = ''

    if (!inputRef.value.trim()) {
      schemaValidationResult.value = { valid: false, error: 'JSON input is empty' }
      return
    }

    if (!schemaInput.value.trim()) {
      schemaValidationResult.value = { valid: false, error: 'Schema is empty' }
      return
    }

    const parseJsonResult = (() => {
      try {
        return { success: true as const, data: JSON.parse(inputRef.value) as unknown }
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

  const loadSampleSchema = (loadSampleJson: () => void) => {
    loadSampleJson()

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

  const inferSchema = (data: unknown): Record<string, unknown> => {
    if (data === null) {
      return { type: 'null' }
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { type: 'array', items: {} }
      }
      return {
        type: 'array',
        items: inferSchema(data[0]),
      }
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data)
      const properties = Object.fromEntries(
        entries.map(([key, value]) => [key, inferSchema(value)]),
      )
      const required = entries.map(([key]) => key)

      return {
        type: 'object',
        properties,
        required,
      }
    }

    if (typeof data === 'string') {
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

  const generateSchemaFromData = (): { success: boolean; error?: string } => {
    if (!inputRef.value.trim()) {
      return { success: false, error: 'Please enter JSON data first' }
    }

    try {
      const data: unknown = JSON.parse(inputRef.value)
      const schema = inferSchema(data)
      schemaInput.value = JSON.stringify(schema, null, 2)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to parse JSON' }
    }
  }

  return {
    schemaInput,
    schemaErrors,
    schemaValidationResult,
    schemaParseError,
    validateSchema,
    loadSampleSchema,
    generateSchemaFromData,
  }
}

// Main composable - singleton pattern for shared state
export function useJsonFormatter() {
  sharedState ??= createJsonFormatterState()
  return sharedState
}

// Reset shared state (for testing)
export function resetJsonFormatterState() {
  sharedState = null
}
