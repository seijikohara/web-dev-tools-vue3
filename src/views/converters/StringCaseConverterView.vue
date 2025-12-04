<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

// State
const inputText = ref('')

// Helper: Split string into words
const splitIntoWords = (str: string): string[] => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // XMLParser -> XML Parser
    .replace(/[-_./\\]+/g, ' ') // Replace separators with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .split(' ')
    .filter(Boolean)
}

// Case conversion functions
const toCamelCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
}

const toPascalCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('')
}

const toSnakeCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toLowerCase()).join('_')
}

const toScreamingSnakeCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toUpperCase()).join('_')
}

const toKebabCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toLowerCase()).join('-')
}

const toScreamingKebabCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toUpperCase()).join('-')
}

const toTrainCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('-')
}

const toDotCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toLowerCase()).join('.')
}

const toPathCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toLowerCase()).join('/')
}

const toTitleCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

const toSentenceCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase(),
    )
    .join(' ')
}

const toUpperCase = (str: string): string => str.toUpperCase()

const toLowerCase = (str: string): string => str.toLowerCase()

const toFlatCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toLowerCase()).join('')
}

const toUpperFlatCase = (str: string): string => {
  const words = splitIntoWords(str)
  return words.map(word => word.toUpperCase()).join('')
}

const toAlternatingCase = (str: string): string => {
  return [...str]
    .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
    .join('')
}

const toInverseCase = (str: string): string => {
  return [...str]
    .map(char => {
      if (char === char.toUpperCase()) return char.toLowerCase()
      return char.toUpperCase()
    })
    .join('')
}

// Case definitions
interface CaseDefinition {
  name: string
  key: string
  converter: (str: string) => string
  example: string
  description: string
}

const caseDefinitions: CaseDefinition[] = [
  {
    name: 'camelCase',
    key: 'camel',
    converter: toCamelCase,
    example: 'myVariableName',
    description: 'First word lowercase, subsequent words capitalized',
  },
  {
    name: 'PascalCase',
    key: 'pascal',
    converter: toPascalCase,
    example: 'MyClassName',
    description: 'All words capitalized, no separator',
  },
  {
    name: 'snake_case',
    key: 'snake',
    converter: toSnakeCase,
    example: 'my_variable_name',
    description: 'All lowercase with underscores',
  },
  {
    name: 'SCREAMING_SNAKE_CASE',
    key: 'screaming_snake',
    converter: toScreamingSnakeCase,
    example: 'MY_CONSTANT_NAME',
    description: 'All uppercase with underscores',
  },
  {
    name: 'kebab-case',
    key: 'kebab',
    converter: toKebabCase,
    example: 'my-css-class',
    description: 'All lowercase with hyphens',
  },
  {
    name: 'SCREAMING-KEBAB-CASE',
    key: 'screaming_kebab',
    converter: toScreamingKebabCase,
    example: 'MY-HEADER-NAME',
    description: 'All uppercase with hyphens',
  },
  {
    name: 'Train-Case',
    key: 'train',
    converter: toTrainCase,
    example: 'My-Train-Case',
    description: 'Capitalized words with hyphens',
  },
  {
    name: 'dot.case',
    key: 'dot',
    converter: toDotCase,
    example: 'my.config.key',
    description: 'All lowercase with dots',
  },
  {
    name: 'path/case',
    key: 'path',
    converter: toPathCase,
    example: 'my/file/path',
    description: 'All lowercase with slashes',
  },
  {
    name: 'Title Case',
    key: 'title',
    converter: toTitleCase,
    example: 'My Title Here',
    description: 'All words capitalized with spaces',
  },
  {
    name: 'Sentence case',
    key: 'sentence',
    converter: toSentenceCase,
    example: 'My sentence here',
    description: 'First word capitalized with spaces',
  },
  {
    name: 'UPPERCASE',
    key: 'upper',
    converter: toUpperCase,
    example: 'UPPERCASE TEXT',
    description: 'All characters uppercase',
  },
  {
    name: 'lowercase',
    key: 'lower',
    converter: toLowerCase,
    example: 'lowercase text',
    description: 'All characters lowercase',
  },
  {
    name: 'flatcase',
    key: 'flat',
    converter: toFlatCase,
    example: 'myflatcase',
    description: 'All lowercase, no separator',
  },
  {
    name: 'UPPERFLATCASE',
    key: 'upper_flat',
    converter: toUpperFlatCase,
    example: 'MYUPPERFLATCASE',
    description: 'All uppercase, no separator',
  },
  {
    name: 'aLtErNaTiNg CaSe',
    key: 'alternating',
    converter: toAlternatingCase,
    example: 'aLtErNaTiNg',
    description: 'Alternating lower and upper case',
  },
  {
    name: 'iNVERSE cASE',
    key: 'inverse',
    converter: toInverseCase,
    example: 'iNVERSE',
    description: 'Swap case of each character',
  },
]

// Computed conversions
const conversions = computed(() => {
  if (!inputText.value.trim()) return []

  return caseDefinitions.map(def => ({
    ...def,
    result: def.converter(inputText.value),
  }))
})

// Copy result
const copyResult = (result: string, name: string) => {
  copy(result)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${name} copied to clipboard`,
    life: 2000,
  })
}

// Load sample
const loadSample = () => {
  inputText.value = 'hello world example'
}

// Clear
const clearAll = () => {
  inputText.value = ''
}

// Stats
const inputStats = computed(() => {
  if (!inputText.value) return null
  const words = splitIntoWords(inputText.value)
  return {
    chars: inputText.value.length,
    words: words.length,
  }
})
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-sort-alpha-down"></i>
        <span>String Case Converter</span>
      </div>
    </template>
    <template #subtitle>
      Convert text between camelCase, PascalCase, snake_case, kebab-case, and more
    </template>
    <template #content>
      <Panel toggleable class="input-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-pencil"></i>
            <span>Input Text</span>
            <Tag
              v-if="inputStats"
              :value="`${inputStats.words} words / ${inputStats.chars} chars`"
              severity="info"
            />
          </div>
        </template>

        <CodeEditor v-model="inputText" mode="plain_text" height="100px" />

        <Toolbar class="editor-toolbar">
          <template #start>
            <Button
              v-tooltip.top="'Load Sample'"
              icon="pi pi-file"
              label="Sample"
              severity="info"
              text
              @click="loadSample"
            />
          </template>
          <template #end>
            <Button
              v-tooltip.top="'Clear'"
              icon="pi pi-trash"
              severity="danger"
              text
              :disabled="!inputText"
              @click="clearAll"
            />
          </template>
        </Toolbar>
      </Panel>

      <div v-if="conversions.length > 0" class="results-section">
        <DataTable :value="conversions" stripedRows class="results-table">
          <Column field="name" header="Case Type" style="width: 200px">
            <template #body="slotProps">
              <div class="case-name">
                <Tag :value="slotProps.data.name" severity="secondary" />
              </div>
            </template>
          </Column>
          <Column field="result" header="Result">
            <template #body="slotProps">
              <code class="result-code">{{ slotProps.data.result }}</code>
            </template>
          </Column>
          <Column field="description" header="Description" style="width: 280px">
            <template #body="slotProps">
              <span class="description-text">{{ slotProps.data.description }}</span>
            </template>
          </Column>
          <Column style="width: 80px">
            <template #body="slotProps">
              <Button
                v-tooltip.top="'Copy'"
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                size="small"
                @click="copyResult(slotProps.data.result, slotProps.data.name)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="empty-state">
        <i class="pi pi-sort-alpha-down"></i>
        <span>Enter text above to see all case conversions</span>
      </div>
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

.input-panel {
  margin-bottom: 1.5rem;

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

.editor-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.results-section {
  margin-top: 1rem;
}

.results-table {
  :deep(.p-datatable-thead > tr > th) {
    background-color: var(--surface-ground);
    font-weight: 600;
  }
}

.case-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.result-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  background-color: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
}

.description-text {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--text-color-secondary);

  i {
    font-size: 3rem;
    opacity: 0.3;
  }
}
</style>
