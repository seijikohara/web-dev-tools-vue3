<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { format as formatSQL } from 'sql-formatter'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

// State
const state = reactive({
  input: '',
  output: '',
})

const options = reactive({
  language: 'sql' as
    | 'sql'
    | 'mysql'
    | 'postgresql'
    | 'plsql'
    | 'transactsql'
    | 'sqlite'
    | 'bigquery'
    | 'redshift',
  tabWidth: 2,
  useTabs: false,
  keywordCase: 'upper' as 'upper' | 'lower' | 'preserve',
  indentStyle: 'standard' as 'standard' | 'tabularLeft' | 'tabularRight',
})

const languageOptions = [
  { label: 'Standard SQL', value: 'sql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'PL/SQL (Oracle)', value: 'plsql' },
  { label: 'T-SQL (SQL Server)', value: 'transactsql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'BigQuery', value: 'bigquery' },
  { label: 'Redshift', value: 'redshift' },
]

const keywordCaseOptions = [
  { label: 'UPPER', value: 'upper' },
  { label: 'lower', value: 'lower' },
  { label: 'Preserve', value: 'preserve' },
]

const indentStyleOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Tabular Left', value: 'tabularLeft' },
  { label: 'Tabular Right', value: 'tabularRight' },
]

const formatError = ref('')

// Validation
const validationResult = computed(() => {
  if (!state.input.trim()) return null
  return { valid: !formatError.value, error: formatError.value }
})

// Format SQL
const formatSql = () => {
  formatError.value = ''
  if (!state.input.trim()) {
    state.output = ''
    return
  }

  try {
    state.output = formatSQL(state.input, {
      language: options.language,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      keywordCase: options.keywordCase,
      indentStyle: options.indentStyle,
    })
  } catch (e) {
    formatError.value = e instanceof Error ? e.message : 'Format failed'
    state.output = ''
  }
}

// Auto-format on option change
watch(
  () => [
    options.language,
    options.tabWidth,
    options.useTabs,
    options.keywordCase,
    options.indentStyle,
  ],
  () => {
    if (state.input.trim()) {
      formatSql()
    }
  },
)

// Minify SQL
const minifySql = () => {
  formatError.value = ''
  if (!state.input.trim()) return

  try {
    // Simple minification: remove extra whitespace and newlines
    state.output = state.input
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([(),;])\s*/g, '$1') // Remove space around punctuation
      .trim()
  } catch (e) {
    formatError.value = e instanceof Error ? e.message : 'Minify failed'
  }
}

// Swap values
const swapValues = () => {
  const temp = state.input
  state.input = state.output
  state.output = temp
}

// Copy output
const copyOutput = () => {
  if (!state.output) return
  copy(state.output)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'SQL copied to clipboard',
    life: 2000,
  })
}

// Load sample
const loadSample = () => {
  state.input = `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_spent DESC LIMIT 100;`
  formatSql()
}

// Clear all
const clearAll = () => {
  state.input = ''
  state.output = ''
  formatError.value = ''
}

// Stats
const sqlStats = computed(() => {
  if (!state.input.trim()) return null

  const input = state.input
  const keywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'JOIN',
    'LEFT',
    'RIGHT',
    'INNER',
    'OUTER',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'LIMIT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'ALTER',
    'DROP',
  ]

  const upperInput = input.toUpperCase()
  const foundKeywords = keywords.filter(kw => upperInput.includes(kw))

  return {
    chars: input.length,
    lines: input.split('\n').length,
    keywords: foundKeywords.length,
  }
})
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-database"></i>
        <span>SQL Formatter</span>
      </div>
    </template>
    <template #subtitle> Format and beautify SQL queries </template>
    <template #content>
      <Panel toggleable class="options-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-cog"></i>
            <span>Options</span>
            <Tag
              v-if="validationResult"
              :value="validationResult.valid ? 'Valid' : 'Error'"
              :severity="validationResult.valid ? 'success' : 'danger'"
              :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
            />
          </div>
        </template>

        <div class="options-content">
          <div class="option-item">
            <label>
              <i class="pi pi-code"></i>
              Dialect
            </label>
            <Select
              v-model="options.language"
              :options="languageOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <Divider layout="vertical" class="vertical-divider" />

          <div class="option-item">
            <label>
              <i class="pi pi-align-left"></i>
              Indent
            </label>
            <InputNumber v-model="options.tabWidth" :min="1" :max="8" showButtons class="w-full" />
          </div>

          <Divider layout="vertical" class="vertical-divider" />

          <div class="option-item">
            <label>
              <i class="pi pi-text-aa"></i>
              Keywords
            </label>
            <Select
              v-model="options.keywordCase"
              :options="keywordCaseOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <Divider layout="vertical" class="vertical-divider" />

          <div class="option-item">
            <label>
              <i class="pi pi-bars"></i>
              Style
            </label>
            <Select
              v-model="options.indentStyle"
              :options="indentStyleOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <Divider layout="vertical" class="vertical-divider" />

          <div class="toggle-option">
            <ToggleSwitch v-model="options.useTabs" inputId="useTabs" />
            <label for="useTabs">
              <Tag :value="options.useTabs ? 'Tabs' : 'Spaces'" severity="secondary" />
            </label>
          </div>
        </div>

        <div v-if="sqlStats" class="stats-display">
          <Tag :value="`${sqlStats.chars} chars`" severity="secondary" icon="pi pi-file" />
          <Tag :value="`${sqlStats.lines} lines`" severity="secondary" icon="pi pi-list" />
          <Tag :value="`${sqlStats.keywords} keywords`" severity="info" icon="pi pi-code" />
        </div>
      </Panel>

      <Message v-if="formatError" severity="error" :closable="false" class="error-message">
        <i class="pi pi-times-circle"></i>
        {{ formatError }}
      </Message>

      <div class="editor-grid">
        <div class="editor-panel">
          <div class="panel-label">
            <i class="pi pi-file-import"></i>
            <span>Input</span>
          </div>
          <CodeEditor v-model="state.input" mode="sql" height="350px" />
          <Toolbar class="editor-toolbar">
            <template #start>
              <Button
                label="Format"
                icon="pi pi-check"
                :disabled="!state.input"
                @click="formatSql"
              />
              <Button
                label="Minify"
                icon="pi pi-compress"
                severity="secondary"
                :disabled="!state.input"
                @click="minifySql"
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
            mode="sql"
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

.options-panel {
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
  align-items: flex-end;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 140px;

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

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vertical-divider {
  @media (max-width: 768px) {
    display: none;
  }
}

.stats-display {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.error-message {
  margin: 1rem 0;

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
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding-top: 175px;

  @media (max-width: 1024px) {
    flex-direction: row;
    padding-top: 0;
    padding: 1rem 0;
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
</style>
