<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import format from 'xml-formatter'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import * as YAML from 'yaml'

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
import { useCodeGenerator } from '@/composables/useCodeGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showSuccess, showError, showInfo, showWarning } = useClipboardToast()

// XML format options interface
interface XmlFormatOptions {
  indentSize: number
  indentType: 'spaces' | 'tabs'
  collapseContent: boolean
  whiteSpaceAtEndOfSelfclosingTag: boolean
  excludeComments: boolean
  preserveWhitespace: boolean
  forceSelfClosingEmptyTag: boolean
  sortAttributes: boolean
  removeEmptyElements: boolean
  normalizeAttributeValues: boolean
  lineSeparator: string
  enforceEmptyTags: boolean
  stripComments: boolean
  stripCDATA: boolean
  maxLineWidth: number
}

const defaultXmlOptions: XmlFormatOptions = {
  indentSize: 2,
  indentType: 'spaces',
  collapseContent: false,
  whiteSpaceAtEndOfSelfclosingTag: false,
  excludeComments: false,
  preserveWhitespace: false,
  forceSelfClosingEmptyTag: false,
  sortAttributes: false,
  removeEmptyElements: false,
  normalizeAttributeValues: false,
  lineSeparator: '\n',
  enforceEmptyTags: false,
  stripComments: false,
  stripCDATA: false,
  maxLineWidth: 0,
}

const persistedXmlOptions = useLocalStorage<XmlFormatOptions>(
  'xml-formatter-advanced-options',
  defaultXmlOptions,
)

const state = reactive({
  input: '<?xml version="1.0" encoding="UTF-8"?>\n<root></root>',
  output: '',
  ...persistedXmlOptions.value,
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

// Line separator options
const lineSeparatorOptions = [
  { label: 'LF (\\n) - Unix/Mac', value: '\n' },
  { label: 'CRLF (\\r\\n) - Windows', value: '\r\n' },
  { label: 'CR (\\r) - Old Mac', value: '\r' },
]

// Validation state
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)
const xmlStats = ref<{
  elements: number
  attributes: number
  depth: number
  size: string
} | null>(null)

// XPath query state
const xpathQuery = ref('')
const xpathResults = ref<string[]>([])
const xpathError = ref('')

// Convert output state
const convertOutput = ref('')
const convertError = ref('')
const convertFormat = ref<'json' | 'yaml'>('json')

// Compare tab state
const compareXml1 = ref('')
const compareXml2 = ref('')

// Calculate XML statistics
const calculateXmlStats = (
  doc: Document,
): { elements: number; attributes: number; depth: number; size: string } => {
  const traverse = (
    node: Node,
    depth: number,
  ): { elements: number; attributes: number; maxDepth: number } => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return { elements: 0, attributes: 0, maxDepth: depth }
    }

    const element = node as Element
    const childResults = Array.from(node.childNodes).reduce(
      (acc, child) => {
        const result = traverse(child, depth + 1)
        return {
          elements: acc.elements + result.elements,
          attributes: acc.attributes + result.attributes,
          maxDepth: Math.max(acc.maxDepth, result.maxDepth),
        }
      },
      { elements: 0, attributes: 0, maxDepth: depth },
    )

    return {
      elements: 1 + childResults.elements,
      attributes: element.attributes.length + childResults.attributes,
      maxDepth: childResults.maxDepth,
    }
  }

  const stats = traverse(doc.documentElement, 0)

  const bytes = new Blob([state.input]).size
  const size =
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(2)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`

  return { elements: stats.elements, attributes: stats.attributes, depth: stats.maxDepth, size }
}

// Validate XML
const validateXml = () => {
  validationResult.value = null
  xmlStats.value = null

  if (!state.input.trim()) {
    validationResult.value = { valid: false, error: 'Empty input' }
    return
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.input, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      validationResult.value = {
        valid: false,
        error: parserError.textContent || 'Invalid XML',
      }
    } else {
      validationResult.value = { valid: true }

      // Calculate stats
      const stats = calculateXmlStats(doc)
      xmlStats.value = stats
    }
  } catch (e) {
    validationResult.value = {
      valid: false,
      error: e instanceof Error ? e.message : 'Failed to parse XML',
    }
  }
}

// Pre-process XML for advanced options
const preprocessXml = (xml: string): string => {
  const transformations: ((s: string) => string)[] = [
    // Strip comments
    state.stripComments ? (s: string) => s.replace(/<!--[\s\S]*?-->/g, '') : null,
    // Strip CDATA sections (convert to plain text)
    state.stripCDATA ? (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : null,
  ].filter((fn): fn is (s: string) => string => fn !== null)

  return transformations.reduce((result, transform) => transform(result), xml)
}

// Sort attributes transformation
const sortAttributesTransform = (s: string): string =>
  s.replace(/<(\w+)((?:\s+[\w:]+="[^"]*")+)/g, (_match, tagName, attrs) => {
    const attrRegex = /\s+([\w:]+)="([^"]*)"/g
    const attrMatches = (attrs as string).match(attrRegex) ?? []
    const sortedAttrs = attrMatches
      .map(attr => {
        const m = /\s+([\w:]+)="([^"]*)"/.exec(attr)
        return m ? { name: m[1], value: m[2] } : null
      })
      .filter((a): a is { name: string; value: string } => a !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(a => ` ${a.name}="${a.value}"`)
      .join('')
    return `<${tagName}${sortedAttrs}`
  })

// Normalize attribute values transformation
const normalizeAttributeValuesTransform = (s: string): string =>
  s.replace(/([\w:]+)="([^"]*)"/g, (_match, name, value) => {
    return `${name}="${(value as string).trim().replace(/\s+/g, ' ')}"`
  })

// Remove empty elements recursively
const removeEmptyElementsTransform = (str: string): string => {
  const cleaned = str.replace(/<(\w+)([^>]*)>\s*<\/\1>/g, '').replace(/<(\w+)([^/>]*)\s*\/>/g, '')
  return cleaned === str ? str : removeEmptyElementsTransform(cleaned)
}

// Force self-closing empty tags transformation
const forceSelfClosingTransform =
  (addSpace: boolean) =>
  (s: string): string =>
    s.replace(/<(\w+)([^>]*)>\s*<\/\1>/g, (_, tag, attrs) => {
      const space = addSpace ? ' ' : ''
      return `<${tag}${attrs}${space}/>`
    })

// Enforce empty tags (explicit closing) transformation
const enforceEmptyTagsTransform = (s: string): string =>
  s.replace(/<(\w+)([^/>]*)\s*\/>/g, '<$1$2></$1>')

// Apply max line width transformation
const maxLineWidthTransform =
  (maxWidth: number) =>
  (s: string): string =>
    s
      .split('\n')
      .map(line => {
        if (line.length > maxWidth) {
          return line.replace(
            /(<\w+)(\s+[\w:]+="[^"]*"){3,}/g,
            (match, tag: string, _attrs: string) => {
              const attrMatches = match.match(/\s+[\w:]+="[^"]*"/g) ?? []
              const indent = /^\s*/.exec(line)?.[0] ?? ''
              return tag + attrMatches.map(a => `\n${indent}  ${a.trim()}`).join('')
            },
          )
        }
        return line
      })
      .join('\n')

// Apply line separator transformation
const lineSeparatorTransform =
  (separator: string) =>
  (s: string): string =>
    s.replace(/\n/g, separator)

// Post-process formatted XML
const postprocessXml = (xml: string): string => {
  const transformations: ((s: string) => string)[] = [
    state.sortAttributes ? sortAttributesTransform : null,
    state.normalizeAttributeValues ? normalizeAttributeValuesTransform : null,
    state.removeEmptyElements ? removeEmptyElementsTransform : null,
    state.forceSelfClosingEmptyTag
      ? forceSelfClosingTransform(state.whiteSpaceAtEndOfSelfclosingTag)
      : null,
    state.enforceEmptyTags ? enforceEmptyTagsTransform : null,
    state.maxLineWidth > 0 ? maxLineWidthTransform(state.maxLineWidth) : null,
    state.lineSeparator !== '\n' ? lineSeparatorTransform(state.lineSeparator) : null,
  ].filter((fn): fn is (s: string) => string => fn !== null)

  return transformations.reduce((result, transform) => transform(result), xml)
}

// Save options to localStorage
const saveOptions = () => {
  persistedXmlOptions.value = {
    indentSize: state.indentSize,
    indentType: state.indentType,
    collapseContent: state.collapseContent,
    whiteSpaceAtEndOfSelfclosingTag: state.whiteSpaceAtEndOfSelfclosingTag,
    excludeComments: state.excludeComments,
    preserveWhitespace: state.preserveWhitespace,
    forceSelfClosingEmptyTag: state.forceSelfClosingEmptyTag,
    sortAttributes: state.sortAttributes,
    removeEmptyElements: state.removeEmptyElements,
    normalizeAttributeValues: state.normalizeAttributeValues,
    lineSeparator: state.lineSeparator,
    enforceEmptyTags: state.enforceEmptyTags,
    stripComments: state.stripComments,
    stripCDATA: state.stripCDATA,
    maxLineWidth: state.maxLineWidth,
  }
}

// Reset options to defaults
const resetOptions = () => {
  Object.assign(state, defaultXmlOptions)
  persistedXmlOptions.value = defaultXmlOptions
  showInfo('Reset', 'Options reset to defaults')
}

// Format XML
const onClickFormat = () => {
  try {
    const preprocessed = preprocessXml(state.input)
    const indentString = getIndentString()
    const formatted = postprocessXml(
      format(preprocessed, {
        indentation: indentString,
        collapseContent: state.collapseContent,
        whiteSpaceAtEndOfSelfclosingTag: state.whiteSpaceAtEndOfSelfclosingTag,
        filter: node => !state.excludeComments || node.type !== 'Comment',
      }),
    )
    state.output = formatted
    saveOptions()
    validateXml()
    showSuccess('Success', 'XML formatted successfully')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid XML format'
    showError('XML Format Error', message)
  }
}

// Minify XML
const onClickMinify = () => {
  try {
    state.output = format(state.input, {
      indentation: '',
      collapseContent: true,
      lineSeparator: '',
    })
    validateXml()
    showSuccess('Success', 'XML minified successfully')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid XML format'
    showError('XML Minify Error', message)
  }
}

// Swap input and output
const swapValues = () => {
  const temp = state.input
  state.input = state.output
  state.output = temp
  validateXml()
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
  xmlStats.value = null
}

// Load sample XML
const loadSample = () => {
  state.input = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title lang="en">Sapiens</title>
    <author>Yuval Noah Harari</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
</bookstore>`
  validateXml()
}

// XPath query execution
const executeXPath = () => {
  xpathResults.value = []
  xpathError.value = ''

  if (!xpathQuery.value.trim()) return

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.input, 'application/xml')

    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      xpathError.value = 'Invalid XML: ' + (parserError.textContent || 'Parse error')
      return
    }

    const result = doc.evaluate(
      xpathQuery.value,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    )

    const results: string[] = Array.from({ length: result.snapshotLength }, (_, i) => {
      const node = result.snapshotItem(i)
      if (!node) return ''
      if (node.nodeType === Node.ELEMENT_NODE) {
        const serializer = new XMLSerializer()
        return serializer.serializeToString(node)
      } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        return `${(node as Attr).name}="${(node as Attr).value}"`
      } else {
        return node.textContent ?? ''
      }
    }).filter(Boolean)

    xpathResults.value = results

    if (results.length === 0) {
      xpathError.value = 'No results found'
    }
  } catch (e) {
    xpathError.value = e instanceof Error ? e.message : 'XPath query failed'
  }
}

// Convert XML to JSON
const xmlToJson = (xml: Element): unknown => {
  const obj: Record<string, unknown> = {}

  // Handle attributes
  if (xml.attributes.length > 0) {
    obj['@attributes'] = Array.from(xml.attributes).reduce<Record<string, string>>((acc, attr) => {
      acc[attr.nodeName] = attr.nodeValue ?? ''
      return acc
    }, {})
  }

  // Handle child nodes
  if (xml.hasChildNodes()) {
    Array.from(xml.childNodes).forEach(item => {
      if (item.nodeType === Node.ELEMENT_NODE) {
        const nodeName = item.nodeName
        const nodeValue = xmlToJson(item as Element)

        if (obj[nodeName] === undefined) {
          obj[nodeName] = nodeValue
        } else {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]]
          }
          ;(obj[nodeName] as unknown[]).push(nodeValue)
        }
      } else if (item.nodeType === Node.TEXT_NODE) {
        const text = item.nodeValue?.trim()
        if (text) {
          if (Object.keys(obj).length === 0) {
            obj['#text'] = text
          } else {
            obj['#text'] = text
          }
        }
      } else if (item.nodeType === Node.CDATA_SECTION_NODE) {
        obj['#cdata'] = item.nodeValue ?? ''
      }
    })
  }

  // If object only has text content, return just the text
  const keys = Object.keys(obj)
  if (keys.length === 1 && keys[0] === '#text') {
    return obj['#text']
  }

  return obj
}

// Convert XML to JSON or YAML
const convertTo = (targetFormat: 'json' | 'yaml') => {
  convertOutput.value = ''
  convertError.value = ''
  convertFormat.value = targetFormat

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.input, 'application/xml')

    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      convertError.value = 'Invalid XML: ' + (parserError.textContent || 'Parse error')
      return
    }

    const rootElement = doc.documentElement
    const json = { [rootElement.nodeName]: xmlToJson(rootElement) }

    if (targetFormat === 'json') {
      convertOutput.value = JSON.stringify(json, null, 2)
    } else {
      // targetFormat === 'yaml'
      convertOutput.value = YAML.stringify(json, { indent: 2 })
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

// Convert output mode for editor
const convertOutputMode = computed(() => {
  return convertFormat.value === 'json' ? 'json' : 'yaml'
})

const copyXPathResults = () => {
  void copy(xpathResults.value.join('\n'), { detail: 'XPath results copied to clipboard' })
}

// Common XPath examples
const xpathExamples = [
  { name: 'All elements', query: '//*' },
  { name: 'Root element', query: '/*' },
  { name: 'All attributes', query: '//@*' },
  { name: 'Element by name', query: '//book' },
  { name: 'With attribute', query: '//book[@category]' },
  { name: 'First child', query: '//book[1]' },
]

const applyXPathExample = (query: string) => {
  xpathQuery.value = query
  executeXPath()
}

// Compare XMLs
interface DiffItem {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

// Helper function to parse XML and convert to comparable object
const parseXmlToObject = (xmlString: string): Record<string, unknown> | null => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) return null
    return { [doc.documentElement.nodeName]: xmlToJson(doc.documentElement) } as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
}

// Compute compare error separately to avoid side effects
const xmlCompareError = computed(() => {
  if (!compareXml1.value.trim() || !compareXml2.value.trim()) return ''

  const obj1 = parseXmlToObject(compareXml1.value)
  const obj2 = parseXmlToObject(compareXml2.value)

  if (!obj1) return 'XML 1 is invalid'
  if (!obj2) return 'XML 2 is invalid'

  return ''
})

const compareXmlDiff = computed((): DiffItem[] => {
  if (!compareXml1.value.trim() || !compareXml2.value.trim() || xmlCompareError.value) return []

  const obj1 = parseXmlToObject(compareXml1.value)
  const obj2 = parseXmlToObject(compareXml2.value)

  if (!obj1 || !obj2) return []

  return findDifferences(obj1, obj2)
})

const findDifferences = (obj1: unknown, obj2: unknown, path = '$'): DiffItem[] => {
  const diffs: DiffItem[] = []

  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      path,
      type: 'changed',
      oldValue: JSON.stringify(obj1),
      newValue: JSON.stringify(obj2),
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
          newValue: JSON.stringify(obj2[i]),
        })
      } else if (i >= obj2.length) {
        diffs.push({
          path: `${path}[${i}]`,
          type: 'removed',
          oldValue: JSON.stringify(obj1[i]),
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
          newValue: JSON.stringify((obj2 as Record<string, unknown>)[key]),
        })
      } else if (!(key in obj2)) {
        diffs.push({
          path: newPath,
          type: 'removed',
          oldValue: JSON.stringify((obj1 as Record<string, unknown>)[key]),
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
      oldValue: JSON.stringify(obj1),
      newValue: JSON.stringify(obj2),
    })
  }

  return diffs
}

// Load current XML to compare
const loadToCompare1 = () => {
  compareXml1.value = state.input
}

const loadToCompare2 = () => {
  compareXml2.value = state.input
}

// Schema validation state (simple structure validation)
interface SchemaRule {
  element: string
  required?: boolean
  attributes?: { name: string; required?: boolean }[]
  children?: string[]
  minOccurs?: number
  maxOccurs?: number
}

interface XmlSchemaValidationError {
  path: string
  message: string
  rule: string
}

const schemaInput = ref('')
const schemaErrors = ref<XmlSchemaValidationError[]>([])
const schemaValidationResult = ref<{ valid: boolean; error?: string } | null>(null)
const schemaParseError = ref('')

// Validate XML against schema rules
const validateXmlSchema = () => {
  schemaErrors.value = []
  schemaValidationResult.value = null
  schemaParseError.value = ''

  if (!state.input.trim()) {
    schemaValidationResult.value = { valid: false, error: 'XML input is empty' }
    return
  }

  if (!schemaInput.value.trim()) {
    schemaValidationResult.value = { valid: false, error: 'Schema is empty' }
    return
  }

  // Parse XML
  const parseXmlResult = (() => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(state.input, 'application/xml')
      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        return { success: false as const, error: parserError.textContent || 'Parse error' }
      }
      return { success: true as const, data: doc }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Parse error' }
    }
  })()

  if (!parseXmlResult.success) {
    schemaValidationResult.value = {
      valid: false,
      error: `Invalid XML: ${parseXmlResult.error}`,
    }
    return
  }

  // Parse schema rules (JSON format)
  const parseSchemaResult = (() => {
    try {
      const parsed: unknown = JSON.parse(schemaInput.value)
      if (!Array.isArray(parsed)) {
        return { success: false as const, error: 'Schema must be a JSON array of rules' }
      }
      return { success: true as const, data: parsed as SchemaRule[] }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Parse error' }
    }
  })()

  if (!parseSchemaResult.success) {
    schemaParseError.value = parseSchemaResult.error
    schemaValidationResult.value = { valid: false, error: 'Invalid schema structure' }
    return
  }

  const doc = parseXmlResult.data
  const rules = parseSchemaResult.data

  // Validate against rules
  const errors: XmlSchemaValidationError[] = []

  const validateElement = (element: Element, path: string) => {
    const elementName = element.nodeName
    const rule = rules.find(r => r.element === elementName)

    if (rule) {
      // Check required attributes
      if (rule.attributes) {
        rule.attributes.forEach(attr => {
          if (attr.required && !element.hasAttribute(attr.name)) {
            errors.push({
              path: path,
              message: `Missing required attribute: ${attr.name}`,
              rule: 'attribute.required',
            })
          }
        })
      }

      // Check allowed children
      if (rule.children) {
        const allowedChildren = rule.children
        const childElements = Array.from(element.children)
        childElements.forEach(child => {
          if (!allowedChildren.includes(child.nodeName)) {
            errors.push({
              path: `${path}/${child.nodeName}`,
              message: `Unexpected child element: ${child.nodeName}. Allowed: ${allowedChildren.join(', ')}`,
              rule: 'children.allowed',
            })
          }
        })
      }

      // Check min/max occurrences for children
      if (rule.children && (rule.minOccurs !== undefined || rule.maxOccurs !== undefined)) {
        rule.children.forEach(childName => {
          const count = element.querySelectorAll(`:scope > ${childName}`).length
          if (rule.minOccurs !== undefined && count < rule.minOccurs) {
            errors.push({
              path: path,
              message: `Element ${childName} occurs ${count} times, minimum is ${rule.minOccurs}`,
              rule: 'occurrences.min',
            })
          }
          if (rule.maxOccurs !== undefined && count > rule.maxOccurs) {
            errors.push({
              path: path,
              message: `Element ${childName} occurs ${count} times, maximum is ${rule.maxOccurs}`,
              rule: 'occurrences.max',
            })
          }
        })
      }
    }

    // Recursively validate children
    Array.from(element.children).forEach((child, index) => {
      validateElement(child, `${path}/${child.nodeName}[${index + 1}]`)
    })
  }

  // Check required elements at root level
  rules.forEach(rule => {
    if (rule.required) {
      const elements = doc.getElementsByTagName(rule.element)
      if (elements.length === 0) {
        errors.push({
          path: '/',
          message: `Missing required element: ${rule.element}`,
          rule: 'element.required',
        })
      }
    }
  })

  // Start validation from root
  validateElement(doc.documentElement, `/${doc.documentElement.nodeName}`)

  if (errors.length === 0) {
    schemaValidationResult.value = { valid: true }
  } else {
    schemaValidationResult.value = { valid: false }
    schemaErrors.value = errors
  }
}

// Load sample schema (also loads sample XML data)
const loadSampleSchema = () => {
  // Load sample XML data
  state.input = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title lang="en">Sapiens</title>
    <author>Yuval Noah Harari</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
</bookstore>`

  // Load sample schema
  schemaInput.value = JSON.stringify(
    [
      {
        element: 'bookstore',
        required: true,
        children: ['book'],
      },
      {
        element: 'book',
        attributes: [{ name: 'category', required: true }],
        children: ['title', 'author', 'year', 'price'],
        minOccurs: 1,
      },
      {
        element: 'title',
        attributes: [{ name: 'lang', required: false }],
      },
    ],
    null,
    2,
  )
}

// Copy schema
const copySchema = () => {
  void copy(schemaInput.value, { detail: 'Schema copied to clipboard' })
}

// Generate schema from XML data
const generateSchemaFromData = () => {
  if (!state.input.trim()) {
    showWarning('No Data', 'Please enter XML data first')
    return
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.input, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Invalid XML')
    }

    const rules = inferXmlSchema(doc.documentElement)
    schemaInput.value = JSON.stringify(rules, null, 2)
    showSuccess('Generated', 'Schema rules generated from XML data')
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'Failed to parse XML')
  }
}

// Infer XML schema rules from element
const inferXmlSchema = (element: Element, visited = new Set<string>()): SchemaRule[] => {
  const rules: SchemaRule[] = []
  const elementName = element.nodeName

  // Avoid duplicates
  if (visited.has(elementName)) {
    return rules
  }
  visited.add(elementName)

  // Create rule for this element
  const rule: SchemaRule = {
    element: elementName,
  }

  // Collect attributes
  if (element.attributes.length > 0) {
    rule.attributes = Array.from(element.attributes).map(attr => ({
      name: attr.name,
      required: true, // Assume required if present
    }))
  }

  // Collect unique child element names
  const childNames = new Set<string>()
  const childElements: Element[] = []
  Array.from(element.children).forEach(child => {
    childNames.add(child.nodeName)
    childElements.push(child)
  })

  if (childNames.size > 0) {
    rule.children = Array.from(childNames)
  }

  rules.push(rule)

  // Recursively process child elements
  childElements.forEach(child => {
    const childRules = inferXmlSchema(child, visited)
    rules.push(...childRules)
  })

  return rules
}

// Code Generator - convert XML to JSON for code generation
const xmlAsJson = computed(() => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.input, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) return ''

    const rootElement = doc.documentElement
    const json = { [rootElement.nodeName]: xmlToJson(rootElement) }
    return JSON.stringify(json, null, 2)
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
} = useCodeGenerator(xmlAsJson)

// Auto-validate on input change
watchDebounced(() => state.input, validateXml, { immediate: true, debounce: 300 })
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-file-edit"></i>
        <span>XML Formatter</span>
      </div>
    </template>
    <template #subtitle> Format, validate, query, and convert XML data </template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Format</Tab>
          <Tab value="1">XPath Query</Tab>
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
                    <label for="lineSeparator">Line Separator</label>
                    <Select
                      id="lineSeparator"
                      v-model="state.lineSeparator"
                      :options="lineSeparatorOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Line ending"
                    />
                  </div>
                  <div class="option-item">
                    <label for="maxLineWidth">Max Line Width (0 = unlimited)</label>
                    <InputNumber
                      id="maxLineWidth"
                      v-model="state.maxLineWidth"
                      :min="0"
                      :max="500"
                      show-buttons
                      button-layout="horizontal"
                    />
                  </div>
                </div>

                <!-- Content Handling -->
                <div class="options-section">
                  <div class="section-title">
                    <i class="pi pi-align-justify"></i>
                    Content Handling
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.collapseContent" input-id="collapseContent" />
                    <label for="collapseContent">Collapse text content</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.preserveWhitespace"
                      input-id="preserveWhitespace"
                    />
                    <label for="preserveWhitespace">Preserve whitespace</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.stripComments" input-id="stripComments" />
                    <label for="stripComments">Strip comments</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.excludeComments" input-id="excludeComments" />
                    <label for="excludeComments">Exclude comments from output</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.stripCDATA" input-id="stripCDATA" />
                    <label for="stripCDATA">Strip CDATA sections</label>
                  </div>
                </div>

                <!-- Element & Tag Options -->
                <div class="options-section">
                  <div class="section-title">
                    <i class="pi pi-tags"></i>
                    Elements & Tags
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.whiteSpaceAtEndOfSelfclosingTag"
                      input-id="selfClosingSpace"
                    />
                    <label for="selfClosingSpace">Space before self-closing /&gt;</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.forceSelfClosingEmptyTag"
                      input-id="forceSelfClosing"
                    />
                    <label for="forceSelfClosing">Force self-closing empty tags</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.enforceEmptyTags" input-id="enforceEmptyTags" />
                    <label for="enforceEmptyTags">Enforce explicit closing tags</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.removeEmptyElements"
                      input-id="removeEmptyElements"
                    />
                    <label for="removeEmptyElements">Remove empty elements</label>
                  </div>
                </div>

                <!-- Attribute Options -->
                <div class="options-section">
                  <div class="section-title">
                    <i class="pi pi-list"></i>
                    Attributes
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch v-model="state.sortAttributes" input-id="sortAttributes" />
                    <label for="sortAttributes">Sort attributes alphabetically</label>
                  </div>
                  <div class="toggle-option">
                    <ToggleSwitch
                      v-model="state.normalizeAttributeValues"
                      input-id="normalizeAttributes"
                    />
                    <label for="normalizeAttributes">Normalize attribute whitespace</label>
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

            <div class="editor-grid">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-import"></i>
                  <span>Input</span>
                </div>
                <CodeEditor v-model="state.input" mode="xml" height="350px" />
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
                  mode="xml"
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
                  :value="validationResult.valid ? 'Valid XML' : 'Invalid XML'"
                  :severity="validationResult.valid ? 'success' : 'danger'"
                  :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                  class="validation-tag"
                />

                <div v-if="xmlStats && validationResult.valid" class="stats-display">
                  <Tag :value="`${xmlStats.elements} elements`" severity="info" icon="pi pi-box" />
                  <Tag :value="`${xmlStats.attributes} attributes`" severity="secondary" />
                  <Tag :value="`Depth: ${xmlStats.depth}`" severity="secondary" />
                  <Tag :value="xmlStats.size" severity="secondary" icon="pi pi-file" />
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
                  <span>XPath Expression</span>
                </div>
              </template>

              <div class="query-input">
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-code"></i>
                  </InputGroupAddon>
                  <InputText
                    v-model="xpathQuery"
                    placeholder="e.g., //element[@attribute='value']"
                    @keyup.enter="executeXPath"
                  />
                  <Button
                    label="Query"
                    icon="pi pi-play"
                    :disabled="!xpathQuery || !state.input"
                    @click="executeXPath"
                  />
                </InputGroup>
                <small class="hint-text">
                  <i class="pi pi-info-circle"></i>
                  Supports XPath 1.0 expressions
                </small>
              </div>

              <div class="common-queries">
                <span class="query-label">Common queries:</span>
                <Button
                  v-for="example in xpathExamples"
                  :key="example.query"
                  :label="example.name"
                  severity="secondary"
                  text
                  @click="applyXPathExample(example.query)"
                />
              </div>
            </Panel>

            <Message v-if="xpathError" severity="warn" :closable="false" class="query-error">
              <i class="pi pi-exclamation-triangle"></i>
              {{ xpathError }}
            </Message>

            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file"></i>
                  <span>Source XML</span>
                </div>
                <CodeEditor v-model="state.input" mode="xml" height="350px" />
              </div>

              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-check-square"></i>
                  <span>Results</span>
                  <Tag
                    v-if="xpathResults.length > 0"
                    :value="`${xpathResults.length} found`"
                    severity="success"
                    icon="pi pi-check"
                  />
                </div>
                <div class="results-list">
                  <div v-if="xpathResults.length === 0" class="no-results">
                    <i class="pi pi-info-circle"></i>
                    <span>No results. Enter an XPath expression and click Query.</span>
                  </div>
                  <div v-for="(result, index) in xpathResults" :key="index" class="result-item">
                    <Tag :value="index + 1" severity="secondary" />
                    <code class="result-content">{{ result }}</code>
                  </div>
                </div>
                <Toolbar v-if="xpathResults.length > 0" class="editor-toolbar">
                  <template #start>
                    <Button
                      label="Copy All"
                      icon="pi pi-copy"
                      severity="secondary"
                      @click="copyXPathResults"
                    />
                  </template>
                </Toolbar>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="compare-grid">
              <Panel class="compare-panel">
                <template #header>
                  <div class="panel-header">
                    <i class="pi pi-file"></i>
                    <span>XML 1</span>
                  </div>
                </template>
                <CodeEditor v-model="compareXml1" mode="xml" height="300px" />
                <div class="panel-actions">
                  <Button
                    label="Load Current"
                    icon="pi pi-download"
                    severity="secondary"
                    text
                    :disabled="!state.input"
                    @click="loadToCompare1"
                  />
                </div>
              </Panel>

              <Panel class="compare-panel">
                <template #header>
                  <div class="panel-header">
                    <i class="pi pi-file"></i>
                    <span>XML 2</span>
                  </div>
                </template>
                <CodeEditor v-model="compareXml2" mode="xml" height="300px" />
                <div class="panel-actions">
                  <Button
                    label="Load Current"
                    icon="pi pi-download"
                    severity="secondary"
                    text
                    :disabled="!state.input"
                    @click="loadToCompare2"
                  />
                </div>
              </Panel>
            </div>

            <Message v-if="xmlCompareError" severity="error" :closable="false">
              <i class="pi pi-times-circle"></i>
              {{ xmlCompareError }}
            </Message>

            <Divider v-if="compareXml1 && compareXml2 && !xmlCompareError" align="left">
              <span class="divider-text">
                <i class="pi pi-list"></i>
                Comparison Result
                <Tag
                  v-if="compareXmlDiff.length > 0"
                  :value="`${compareXmlDiff.length} differences`"
                  severity="warn"
                />
                <Tag v-else value="Identical" severity="success" icon="pi pi-check" />
              </span>
            </Divider>

            <div v-if="compareXmlDiff.length > 0" class="diff-results">
              <DataTable :value="compareXmlDiff" striped-rows size="small">
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
              v-else-if="compareXml1 && compareXml2 && !xmlCompareError"
              severity="success"
              :closable="false"
            >
              <i class="pi pi-check-circle"></i>
              No differences found - XMLs are identical
            </Message>
          </TabPanel>

          <TabPanel value="3">
            <div class="editor-grid-2col">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-edit"></i>
                  <span>XML Input</span>
                </div>
                <CodeEditor v-model="state.input" mode="xml" height="350px" />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="To JSON"
                      icon="pi pi-arrow-right"
                      :disabled="!state.input"
                      @click="convertTo('json')"
                    />
                    <Button
                      label="To YAML"
                      icon="pi pi-arrow-right"
                      severity="secondary"
                      :disabled="!state.input"
                      @click="convertTo('yaml')"
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

          <TabPanel value="4">
            <Panel toggleable class="schema-panel">
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-verified"></i>
                  <span>XML Structure Validator</span>
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
                Validate XML structure against a JSON schema definition. Define element rules,
                required attributes, and allowed children.
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
                  <span>XML Data</span>
                </div>
                <CodeEditor v-model="state.input" mode="xml" height="300px" />
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
                  <span>Schema Rules (JSON)</span>
                </div>
                <CodeEditor v-model="schemaInput" mode="json" height="300px" />
                <Toolbar class="editor-toolbar">
                  <template #start>
                    <Button
                      label="Validate"
                      icon="pi pi-check"
                      :disabled="!state.input || !schemaInput"
                      @click="validateXmlSchema"
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
              XML structure is valid against the schema
            </Message>

            <div v-if="schemaErrors.length > 0" class="schema-errors">
              <DataTable :value="schemaErrors" striped-rows size="small">
                <Column field="path" header="Path" style="width: 200px">
                  <template #body="slotProps">
                    <code class="path-code">{{ slotProps.data.path }}</code>
                  </template>
                </Column>
                <Column field="rule" header="Rule" style="width: 150px">
                  <template #body="slotProps">
                    <Tag :value="slotProps.data.rule" severity="warn" />
                  </template>
                </Column>
                <Column field="message" header="Message">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.message }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>

          <TabPanel value="5">
            <CodeGeneratorPanel
              :json-input="xmlAsJson"
              :language="codeGenLanguage"
              :options="codeGenOptions"
              :generated-code="generatedCode"
              :editor-mode="codeGenEditorMode"
              :selected-language-info="selectedLanguageInfo"
              :error="codeGenError"
              input-mode="xml"
              input-label="XML Input"
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
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--primary-color);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 0.25rem;

  i {
    font-size: 0.85rem;
  }
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  label {
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text-color);
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

.results-list {
  height: 350px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-ground);
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-color-secondary);

  i {
    font-size: 1.5rem;
    color: var(--primary-color);
  }
}

.result-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  align-items: flex-start;

  &:last-child {
    border-bottom: none;
  }

  .result-content {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-break: break-all;
    flex: 1;
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
</style>
