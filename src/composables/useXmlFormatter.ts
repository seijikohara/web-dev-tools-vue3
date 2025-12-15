import { reactive, ref, computed, type Ref } from 'vue'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import format from 'xml-formatter'
import * as YAML from 'yaml'

// Types
export interface XmlFormatOptions {
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

export interface XmlStats {
  elements: number
  attributes: number
  depth: number
  size: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface DiffItem {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

export interface SchemaRule {
  element: string
  required?: boolean
  attributes?: { name: string; required?: boolean }[]
  children?: string[]
  minOccurs?: number
  maxOccurs?: number
}

export interface XmlSchemaValidationError {
  path: string
  message: string
  rule: string
}

const defaultFormatOptions = {
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
  lineSeparator: `
`,
  enforceEmptyTags: false,
  stripComments: false,
  stripCDATA: false,
  maxLineWidth: 0,
} as const satisfies XmlFormatOptions

// Singleton state for sharing between tabs
let sharedState: ReturnType<typeof createXmlFormatterState> | null = null

function createXmlFormatterState() {
  const persistedOptions = useLocalStorage<XmlFormatOptions>(
    'xml-formatter-advanced-options',
    defaultFormatOptions,
  )

  const state = reactive({
    input: '<?xml version="1.0" encoding="UTF-8"?>\n<root></root>',
    output: '',
    ...persistedOptions.value,
  })

  const validationResult = ref<ValidationResult | null>(null)
  const xmlStats = ref<XmlStats | null>(null)

  // Indent type options
  const indentTypeOptions = [
    { label: 'Spaces', value: 'spaces' },
    { label: 'Tabs', value: 'tabs' },
  ]

  // Line separator options
  const lineSeparatorOptions = [
    {
      label: 'LF (\\n) - Unix/Mac',
      value: `
`,
    },
    {
      label: 'CRLF (\\r\\n) - Windows',
      value: `
`,
    },
    { label: 'CR (\\r) - Old Mac', value: `\r` },
  ]

  /**
   * Pure function: Compute indent string from options
   */
  const getIndentString = (): string =>
    state.indentType === 'tabs'
      ? '\t'.repeat(state.indentSize > 0 ? 1 : 0)
      : ' '.repeat(state.indentSize)

  // Calculate XML statistics
  const calculateXmlStats = (doc: Document): XmlStats => {
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

  // Validate XML and calculate stats
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
        xmlStats.value = calculateXmlStats(doc)
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
      state.stripComments ? (s: string) => s.replace(/<!--[\s\S]*?-->/g, '') : null,
      state.stripCDATA ? (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : null,
    ].filter((fn): fn is (s: string) => string => fn !== null)

    return transformations.reduce((result, transform) => transform(result), xml)
  }

  /**
   * Pure transformation functions for XML post-processing
   */
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

  const normalizeAttributeValuesTransform = (s: string): string =>
    s.replace(
      /([\w:]+)="([^"]*)"/g,
      (_match, name, value) => `${name}="${(value as string).trim().replace(/\s+/g, ' ')}"`,
    )

  const removeEmptyElementsTransform = (str: string): string => {
    const cleaned = str.replace(/<(\w+)([^>]*)>\s*<\/\1>/g, '').replace(/<(\w+)([^/>]*)\s*\/>/g, '')
    return cleaned === str ? str : removeEmptyElementsTransform(cleaned)
  }

  const forceSelfClosingTransform =
    (addSpace: boolean) =>
    (s: string): string =>
      s.replace(
        /<(\w+)([^>]*)>\s*<\/\1>/g,
        (_, tag, attrs) => `<${tag}${attrs}${addSpace ? ' ' : ''}/>`,
      )

  const enforceEmptyTagsTransform = (s: string): string =>
    s.replace(/<(\w+)([^/>]*)\s*\/>/g, '<$1$2></$1>')

  const maxLineWidthTransform =
    (maxWidth: number) =>
    (s: string): string =>
      s
        .split(
          `
`,
        )
        .map(line =>
          line.length <= maxWidth
            ? line
            : line.replace(/(<\w+)(\s+[\w:]+="[^"]*"){3,}/g, (match, tag: string) => {
                const attrMatches = match.match(/\s+[\w:]+="[^"]*"/g) ?? []
                const indent = /^\s*/.exec(line)?.[0] ?? ''
                return `${tag}${attrMatches
                  .map(
                    a => `
${indent}  ${a.trim()}`,
                  )
                  .join('')}`
              }),
        ).join(`
`)

  const lineSeparatorTransform =
    (separator: string) =>
    (s: string): string =>
      s.replace(
        new RegExp(
          `
`,
          'g',
        ),
        separator,
      )

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
      state.lineSeparator !==
      `
`
        ? lineSeparatorTransform(state.lineSeparator)
        : null,
    ].filter((fn): fn is (s: string) => string => fn !== null)

    return transformations.reduce((result, transform) => transform(result), xml)
  }

  // Format XML
  const formatXml = (): { success: boolean; error?: string } => {
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
      persistedOptions.value = {
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
      validateXml()
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to format XML' }
    }
  }

  // Minify XML
  const minifyXml = (): { success: boolean; error?: string } => {
    try {
      state.output = format(state.input, {
        indentation: '',
        collapseContent: true,
        lineSeparator: '',
      })
      validateXml()
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to minify XML' }
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

  // Auto-validate on input change
  watchDebounced(() => state.input, validateXml, { immediate: true, debounce: 300 })

  return {
    state,
    validationResult,
    xmlStats,
    indentTypeOptions,
    lineSeparatorOptions,
    getIndentString,
    formatXml,
    minifyXml,
    resetOptions,
    clearAll,
    loadSample,
    validateXml,
  }
}

// Query Tab (XPath)
export function useXmlQuery(inputRef: Ref<string>) {
  const xpathQuery = ref('')
  const xpathResults = ref<string[]>([])
  const xpathError = ref('')

  const xpathExamples = [
    { name: 'All elements', query: '//*' },
    { name: 'Root element', query: '/*' },
    { name: 'All attributes', query: '//@*' },
    { name: 'Element by name', query: '//book' },
    { name: 'With attribute', query: '//book[@category]' },
    { name: 'First child', query: '//book[1]' },
  ]

  const executeXPath = () => {
    xpathResults.value = []
    xpathError.value = ''

    if (!xpathQuery.value.trim()) return

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(inputRef.value, 'application/xml')

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

  const applyXPathExample = (query: string) => {
    xpathQuery.value = query
    executeXPath()
  }

  return {
    xpathQuery,
    xpathResults,
    xpathError,
    xpathExamples,
    executeXPath,
    applyXPathExample,
  }
}

// Compare Tab
export function useXmlCompare(inputRef: Ref<string>) {
  const compareXml1 = ref('')
  const compareXml2 = ref('')

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

  // Convert XML to JSON
  const xmlToJson = (xml: Element): unknown => {
    const obj: Record<string, unknown> = {}

    // Handle attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = Array.from(xml.attributes).reduce<Record<string, string>>(
        (acc, attr) => {
          acc[attr.nodeName] = attr.nodeValue ?? ''
          return acc
        },
        {},
      )
    }

    // Handle child nodes using reduce
    if (xml.hasChildNodes()) {
      Array.from(xml.childNodes).reduce((acc, item) => {
        if (item.nodeType === Node.ELEMENT_NODE) {
          const nodeName = item.nodeName
          const nodeValue = xmlToJson(item as Element)

          if (acc[nodeName] === undefined) {
            acc[nodeName] = nodeValue
          } else {
            if (!Array.isArray(acc[nodeName])) {
              acc[nodeName] = [acc[nodeName]]
            }
            ;(acc[nodeName] as unknown[]).push(nodeValue)
          }
        } else if (item.nodeType === Node.TEXT_NODE) {
          const text = item.nodeValue?.trim()
          if (text) {
            acc['#text'] = text
          }
        } else if (item.nodeType === Node.CDATA_SECTION_NODE) {
          acc['#cdata'] = item.nodeValue ?? ''
        }
        return acc
      }, obj)
    }

    // If object only has text content, return just the text
    const keys = Object.keys(obj)
    if (keys.length === 1 && keys[0] === '#text') {
      return obj['#text']
    }

    return obj
  }

  const xmlCompareError = computed(() => {
    if (!compareXml1.value.trim() || !compareXml2.value.trim()) return ''

    const obj1 = parseXmlToObject(compareXml1.value)
    const obj2 = parseXmlToObject(compareXml2.value)

    if (!obj1) return 'XML 1 is invalid'
    if (!obj2) return 'XML 2 is invalid'

    return ''
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

  const compareXmlDiff = computed((): DiffItem[] => {
    if (!compareXml1.value.trim() || !compareXml2.value.trim() || xmlCompareError.value) return []

    const obj1 = parseXmlToObject(compareXml1.value)
    const obj2 = parseXmlToObject(compareXml2.value)

    if (!obj1 || !obj2) return []

    return findDifferences(obj1, obj2)
  })

  const loadToCompare1 = () => {
    compareXml1.value = inputRef.value
  }

  const loadToCompare2 = () => {
    compareXml2.value = inputRef.value
  }

  return {
    compareXml1,
    compareXml2,
    xmlCompareError,
    compareXmlDiff,
    loadToCompare1,
    loadToCompare2,
  }
}

// Convert Tab
export function useXmlConvert(inputRef: Ref<string>) {
  const convertOutput = ref('')
  const convertError = ref('')
  const convertFormat = ref<'json' | 'yaml'>('json')

  // Convert XML to JSON
  const xmlToJson = (xml: Element): unknown => {
    const obj: Record<string, unknown> = {}

    // Handle attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = Array.from(xml.attributes).reduce<Record<string, string>>(
        (acc, attr) => {
          acc[attr.nodeName] = attr.nodeValue ?? ''
          return acc
        },
        {},
      )
    }

    // Handle child nodes using reduce
    if (xml.hasChildNodes()) {
      Array.from(xml.childNodes).reduce((acc, item) => {
        if (item.nodeType === Node.ELEMENT_NODE) {
          const nodeName = item.nodeName
          const nodeValue = xmlToJson(item as Element)

          if (acc[nodeName] === undefined) {
            acc[nodeName] = nodeValue
          } else {
            if (!Array.isArray(acc[nodeName])) {
              acc[nodeName] = [acc[nodeName]]
            }
            ;(acc[nodeName] as unknown[]).push(nodeValue)
          }
        } else if (item.nodeType === Node.TEXT_NODE) {
          const text = item.nodeValue?.trim()
          if (text) {
            acc['#text'] = text
          }
        } else if (item.nodeType === Node.CDATA_SECTION_NODE) {
          acc['#cdata'] = item.nodeValue ?? ''
        }
        return acc
      }, obj)
    }

    // If object only has text content, return just the text
    const keys = Object.keys(obj)
    if (keys.length === 1 && keys[0] === '#text') {
      return obj['#text']
    }

    return obj
  }

  const convertTo = (targetFormat: 'json' | 'yaml') => {
    convertOutput.value = ''
    convertError.value = ''
    convertFormat.value = targetFormat

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(inputRef.value, 'application/xml')

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
        convertOutput.value = YAML.stringify(json, { indent: 2 })
      }
    } catch (e) {
      convertError.value = e instanceof Error ? e.message : 'Conversion failed'
    }
  }

  const convertOutputMode = computed(() => {
    return convertFormat.value === 'json' ? 'json' : 'yaml'
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
export function useXmlSchema(inputRef: Ref<string>) {
  const schemaInput = ref('')
  const schemaErrors = ref<XmlSchemaValidationError[]>([])
  const schemaValidationResult = ref<{ valid: boolean; error?: string } | null>(null)
  const schemaParseError = ref('')

  const validateXmlSchema = () => {
    schemaErrors.value = []
    schemaValidationResult.value = null
    schemaParseError.value = ''

    if (!inputRef.value.trim()) {
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
        const doc = parser.parseFromString(inputRef.value, 'application/xml')
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
          const attrErrors = rule.attributes
            .filter(attr => attr.required && !element.hasAttribute(attr.name))
            .map(attr => ({
              path: path,
              message: `Missing required attribute: ${attr.name}`,
              rule: 'attribute.required',
            }))
          errors.push(...attrErrors)
        }

        // Check allowed children
        if (rule.children) {
          const allowedChildren = rule.children
          const childErrors = Array.from(element.children)
            .filter(child => !allowedChildren.includes(child.nodeName))
            .map(child => ({
              path: `${path}/${child.nodeName}`,
              message: `Unexpected child element: ${child.nodeName}. Allowed: ${allowedChildren.join(', ')}`,
              rule: 'children.allowed',
            }))
          errors.push(...childErrors)
        }

        // Check min/max occurrences for children
        if (rule.children && (rule.minOccurs !== undefined || rule.maxOccurs !== undefined)) {
          const occurrenceErrors = rule.children.flatMap(childName => {
            const count = element.querySelectorAll(`:scope > ${childName}`).length
            const errs: XmlSchemaValidationError[] = []
            if (rule.minOccurs !== undefined && count < rule.minOccurs) {
              errs.push({
                path: path,
                message: `Element ${childName} occurs ${count} times, minimum is ${rule.minOccurs}`,
                rule: 'occurrences.min',
              })
            }
            if (rule.maxOccurs !== undefined && count > rule.maxOccurs) {
              errs.push({
                path: path,
                message: `Element ${childName} occurs ${count} times, maximum is ${rule.maxOccurs}`,
                rule: 'occurrences.max',
              })
            }
            return errs
          })
          errors.push(...occurrenceErrors)
        }
      }

      // Recursively validate children
      Array.from(element.children).forEach((child, index) =>
        validateElement(child, `${path}/${child.nodeName}[${index + 1}]`),
      )
    }

    // Check required elements at root level
    const requiredErrors = rules
      .filter(rule => rule.required && doc.getElementsByTagName(rule.element).length === 0)
      .map(rule => ({
        path: '/',
        message: `Missing required element: ${rule.element}`,
        rule: 'element.required',
      }))
    errors.push(...requiredErrors)

    // Start validation from root
    validateElement(doc.documentElement, `/${doc.documentElement.nodeName}`)

    if (errors.length === 0) {
      schemaValidationResult.value = { valid: true }
    } else {
      schemaValidationResult.value = { valid: false }
      schemaErrors.value = errors
    }
  }

  const loadSampleSchema = (loadSampleXml: () => void) => {
    loadSampleXml()

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

  // Infer XML schema rules from element
  const inferXmlSchema = (element: Element, visited = new Set<string>()): SchemaRule[] => {
    const elementName = element.nodeName

    // Avoid duplicates - early return
    if (visited.has(elementName)) {
      return []
    }
    visited.add(elementName)

    // Collect attributes
    const attributes =
      element.attributes.length > 0
        ? Array.from(element.attributes).map(attr => ({
            name: attr.name,
            required: true, // Assume required if present
          }))
        : undefined

    // Collect unique child element names
    const childElements = Array.from(element.children)
    const childNames = [...new Set(childElements.map(child => child.nodeName))]

    // Create rule for this element
    const rule: SchemaRule = {
      element: elementName,
      ...(attributes && { attributes }),
      ...(childNames.length > 0 && { children: childNames }),
    }

    // Recursively process child elements and combine with current rule
    const childRules = childElements.flatMap(child => inferXmlSchema(child, visited))

    return [rule, ...childRules]
  }

  const generateSchemaFromData = (): { success: boolean; error?: string } => {
    if (!inputRef.value.trim()) {
      return { success: false, error: 'Please enter XML data first' }
    }

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(inputRef.value, 'application/xml')
      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        return { success: false, error: 'Invalid XML' }
      }

      const rules = inferXmlSchema(doc.documentElement)
      schemaInput.value = JSON.stringify(rules, null, 2)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to parse XML' }
    }
  }

  return {
    schemaInput,
    schemaErrors,
    schemaValidationResult,
    schemaParseError,
    validateXmlSchema,
    loadSampleSchema,
    generateSchemaFromData,
  }
}

// Main composable - singleton pattern for shared state
export function useXmlFormatter() {
  sharedState ??= createXmlFormatterState()
  return sharedState
}

// Reset shared state (for testing)
export function resetXmlFormatterState() {
  sharedState = null
}
