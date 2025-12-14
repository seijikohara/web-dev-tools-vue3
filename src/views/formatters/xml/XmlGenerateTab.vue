<script setup lang="ts">
import { computed } from 'vue'

import CodeGeneratorPanel from '@/components/code-generator/CodeGeneratorPanel.vue'
import { useXmlFormatter } from '@/composables/useXmlFormatter'
import { useCodeGenerator } from '@/composables/useCodeGenerator'

const { state, loadSample } = useXmlFormatter()

// Convert XML to JSON for code generation
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

// Convert XML to JSON helper
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

const {
  language: codeGenLanguage,
  options: codeGenOptions,
  generatedCode,
  selectedLanguageInfo,
  editorMode: codeGenEditorMode,
  error: codeGenError,
  resetOptions: resetCodeGenOptions,
} = useCodeGenerator(xmlAsJson)
</script>

<template>
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
</template>
