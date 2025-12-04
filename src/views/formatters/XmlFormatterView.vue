<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import format from 'xml-formatter'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import * as YAML from 'yaml'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import TabView from 'primevue/tabview'
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

import CodeEditor from '@/components/CodeEditor.vue'
import { FORMAT_OPTIONS, DEFAULT_FORMAT_OPTION } from '@/constants/formatOptions'

const toast = useToast()
const { copy } = useClipboard()

const state = reactive({
  input: '',
  output: '',
  formatOptionValue: DEFAULT_FORMAT_OPTION,
  collapseContent: false,
  whiteSpaceAtEndOfSelfclosingTag: false,
  excludeComments: false,
})

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

// Format XML
const onClickFormat = () => {
  try {
    state.output = format(state.input, {
      indentation: state.formatOptionValue,
      collapseContent: state.collapseContent,
      whiteSpaceAtEndOfSelfclosingTag: state.whiteSpaceAtEndOfSelfclosingTag,
      filter: node => !state.excludeComments || node.type !== 'Comment',
    })
    validateXml()
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'XML formatted successfully',
      life: 2000,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid XML format'
    toast.add({
      severity: 'error',
      summary: 'XML Format Error',
      detail: message,
      life: 3000,
    })
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
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'XML minified successfully',
      life: 2000,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid XML format'
    toast.add({
      severity: 'error',
      summary: 'XML Minify Error',
      detail: message,
      life: 3000,
    })
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
  copy(state.output)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Output copied to clipboard',
    life: 2000,
  })
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
  if (xml.attributes && xml.attributes.length > 0) {
    obj['@attributes'] = Array.from(xml.attributes).reduce(
      (acc, attr) => {
        acc[attr.nodeName] = attr.nodeValue ?? ''
        return acc
      },
      {} as Record<string, string>,
    )
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
    } else if (targetFormat === 'yaml') {
      convertOutput.value = YAML.stringify(json, { indent: 2 })
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

// Convert output mode for editor
const convertOutputMode = computed(() => {
  return convertFormat.value === 'json' ? 'json' : 'yaml'
})

const copyXPathResults = () => {
  copy(xpathResults.value.join('\n'))
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'XPath results copied to clipboard',
    life: 2000,
  })
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

// Auto-validate on input change
watch(() => state.input, validateXml, { immediate: true })
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
      <TabView>
        <TabPanel value="0" header="Format">
          <Panel toggleable class="options-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-cog"></i>
                <span>Options</span>
                <Tag
                  v-if="validationResult"
                  :value="validationResult.valid ? 'Valid XML' : 'Invalid'"
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

              <Divider layout="vertical" class="vertical-divider" />

              <div class="toggle-options">
                <div class="toggle-option">
                  <ToggleSwitch v-model="state.collapseContent" inputId="collapseContent" />
                  <label for="collapseContent">Collapse content</label>
                </div>
                <div class="toggle-option">
                  <ToggleSwitch
                    v-model="state.whiteSpaceAtEndOfSelfclosingTag"
                    inputId="selfClosing"
                  />
                  <label for="selfClosing">Self-closing space</label>
                </div>
                <div class="toggle-option">
                  <ToggleSwitch v-model="state.excludeComments" inputId="excludeComments" />
                  <label for="excludeComments">Exclude comments</label>
                </div>
              </div>
            </div>

            <div v-if="xmlStats && validationResult?.valid" class="stats-display">
              <Tag :value="`${xmlStats.elements} elements`" severity="info" icon="pi pi-box" />
              <Tag :value="`${xmlStats.attributes} attributes`" severity="secondary" />
              <Tag :value="`Depth: ${xmlStats.depth}`" severity="secondary" />
              <Tag :value="xmlStats.size" severity="secondary" icon="pi pi-file" />
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
        </TabPanel>

        <TabPanel value="1" header="XPath Query">
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
                size="small"
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

        <TabPanel value="2" header="Compare">
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
                  <span>XML 2</span>
                </div>
              </template>
              <CodeEditor v-model="compareXml2" mode="xml" height="300px" />
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
            <DataTable :value="compareXmlDiff" stripedRows size="small">
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

        <TabPanel value="3" header="Convert">
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
  align-items: center;
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

.vertical-divider {
  height: 60px;

  @media (max-width: 768px) {
    display: none;
  }
}

.toggle-options {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    cursor: pointer;
    font-size: 0.9rem;
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
</style>
