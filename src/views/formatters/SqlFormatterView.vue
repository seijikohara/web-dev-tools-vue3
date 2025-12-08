<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { format as formatSQL, type FormatOptionsWithLanguage } from 'sql-formatter'
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import { useClipboardToast } from '@/composables/useClipboardToast'

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

import CodeEditor from '@/components/editors/CodeEditor.vue'

const { copy, showSuccess, showInfo } = useClipboardToast()

// SQL Formatter supported languages (sql-formatter v15)
type SqlLanguage =
  | 'sql'
  | 'bigquery'
  | 'db2'
  | 'db2i'
  | 'duckdb'
  | 'hive'
  | 'mariadb'
  | 'mysql'
  | 'n1ql'
  | 'plsql'
  | 'postgresql'
  | 'redshift'
  | 'singlestoredb'
  | 'snowflake'
  | 'spark'
  | 'sqlite'
  | 'tidb'
  | 'transactsql'
  | 'trino'

type KeywordCase = 'upper' | 'lower' | 'preserve'
type IdentifierCase = 'upper' | 'lower' | 'preserve'
type DataTypeCase = 'upper' | 'lower' | 'preserve'
type FunctionCase = 'upper' | 'lower' | 'preserve'
type IndentStyle = 'standard' | 'tabularLeft' | 'tabularRight'
type LogicalOperatorNewline = 'before' | 'after'

interface SqlFormatterOptions {
  // Language
  language: SqlLanguage
  // Indentation
  tabWidth: number
  useTabs: boolean
  indentStyle: IndentStyle
  // Case options
  keywordCase: KeywordCase
  identifierCase: IdentifierCase
  dataTypeCase: DataTypeCase
  functionCase: FunctionCase
  // Layout options
  logicalOperatorNewline: LogicalOperatorNewline
  expressionWidth: number
  linesBetweenQueries: number
  // Formatting style
  denseOperators: boolean
  newlineBeforeSemicolon: boolean
}

const defaultOptions: SqlFormatterOptions = {
  language: 'sql',
  tabWidth: 2,
  useTabs: false,
  indentStyle: 'standard',
  keywordCase: 'upper',
  identifierCase: 'preserve',
  dataTypeCase: 'upper',
  functionCase: 'preserve',
  logicalOperatorNewline: 'before',
  expressionWidth: 50,
  linesBetweenQueries: 1,
  denseOperators: false,
  newlineBeforeSemicolon: false,
}

const persistedOptions = useLocalStorage<SqlFormatterOptions>(
  'sql-formatter-options-v2',
  defaultOptions,
)

// State
const state = reactive({
  input: '',
  output: '',
})

const options = reactive<SqlFormatterOptions>({
  ...persistedOptions.value,
})

// Language options - all supported dialects
const languageOptions = [
  { label: 'Standard SQL', value: 'sql' },
  { label: 'BigQuery', value: 'bigquery' },
  { label: 'DB2', value: 'db2' },
  { label: 'DB2i (iSeries)', value: 'db2i' },
  { label: 'DuckDB', value: 'duckdb' },
  { label: 'Hive', value: 'hive' },
  { label: 'MariaDB', value: 'mariadb' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'N1QL (Couchbase)', value: 'n1ql' },
  { label: 'PL/SQL (Oracle)', value: 'plsql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'Redshift', value: 'redshift' },
  { label: 'SingleStoreDB', value: 'singlestoredb' },
  { label: 'Snowflake', value: 'snowflake' },
  { label: 'Spark SQL', value: 'spark' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'TiDB', value: 'tidb' },
  { label: 'T-SQL (SQL Server)', value: 'transactsql' },
  { label: 'Trino (PrestoSQL)', value: 'trino' },
]

const keywordCaseOptions = [
  { label: 'UPPER', value: 'upper' },
  { label: 'lower', value: 'lower' },
  { label: 'Preserve', value: 'preserve' },
]

const identifierCaseOptions = [
  { label: 'UPPER', value: 'upper' },
  { label: 'lower', value: 'lower' },
  { label: 'Preserve', value: 'preserve' },
]

const dataTypeCaseOptions = [
  { label: 'UPPER', value: 'upper' },
  { label: 'lower', value: 'lower' },
  { label: 'Preserve', value: 'preserve' },
]

const functionCaseOptions = [
  { label: 'UPPER', value: 'upper' },
  { label: 'lower', value: 'lower' },
  { label: 'Preserve', value: 'preserve' },
]

const indentStyleOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Tabular Left', value: 'tabularLeft' },
  { label: 'Tabular Right', value: 'tabularRight' },
]

const logicalOperatorNewlineOptions = [
  { label: 'Before (AND\\n)', value: 'before' },
  { label: 'After (\\nAND)', value: 'after' },
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
    const formatOptions: FormatOptionsWithLanguage = {
      language: options.language,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      indentStyle: options.indentStyle,
      keywordCase: options.keywordCase,
      identifierCase: options.identifierCase,
      dataTypeCase: options.dataTypeCase,
      functionCase: options.functionCase,
      logicalOperatorNewline: options.logicalOperatorNewline,
      expressionWidth: options.expressionWidth,
      linesBetweenQueries: options.linesBetweenQueries,
      denseOperators: options.denseOperators,
      newlineBeforeSemicolon: options.newlineBeforeSemicolon,
    }
    state.output = formatSQL(state.input, formatOptions)
    showSuccess('Formatted', 'SQL formatted successfully')
  } catch (e) {
    formatError.value = e instanceof Error ? e.message : 'Format failed'
    state.output = ''
  }
}

// Save options
const saveOptions = () => {
  persistedOptions.value = { ...options }
}

// Reset options to defaults
const resetOptions = () => {
  Object.assign(options, defaultOptions)
  persistedOptions.value = defaultOptions
  showInfo('Reset', 'Options reset to defaults')
}

// Auto-format on option change and persist to localStorage
watchDebounced(
  () => [
    options.language,
    options.tabWidth,
    options.useTabs,
    options.indentStyle,
    options.keywordCase,
    options.identifierCase,
    options.dataTypeCase,
    options.functionCase,
    options.logicalOperatorNewline,
    options.expressionWidth,
    options.linesBetweenQueries,
    options.denseOperators,
    options.newlineBeforeSemicolon,
  ],
  () => {
    // Persist options
    saveOptions()
    if (state.input.trim()) {
      formatSql()
    }
  },
  { debounce: 300 },
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
    showSuccess('Minified', 'SQL minified successfully')
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
  void copy(state.output, { detail: 'SQL copied to clipboard' })
}

// Load sample
const loadSample = () => {
  state.input = `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_spent DESC LIMIT 100;

INSERT INTO audit_log (user_id, action, timestamp) VALUES (1, 'login', NOW());

UPDATE products SET price = price * 1.1, updated_at = CURRENT_TIMESTAMP WHERE category_id IN (SELECT id FROM categories WHERE name = 'Electronics') AND stock > 0;

WITH ranked_sales AS (SELECT product_id, SUM(quantity) as total_qty, RANK() OVER (ORDER BY SUM(quantity) DESC) as rank FROM sales GROUP BY product_id) SELECT p.name, rs.total_qty, rs.rank FROM ranked_sales rs JOIN products p ON rs.product_id = p.id WHERE rs.rank <= 10;`
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
    'FULL',
    'CROSS',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'LIMIT',
    'OFFSET',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'ALTER',
    'DROP',
    'TRUNCATE',
    'WITH',
    'UNION',
    'INTERSECT',
    'EXCEPT',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
  ]

  const upperInput = input.toUpperCase()
  const foundKeywords = keywords.filter(kw => upperInput.includes(kw))

  // Count statements (approximate by counting semicolons)
  const statements = (input.match(/;/g) ?? []).length || 1

  return {
    chars: input.length,
    lines: input.split('\n').length,
    keywords: foundKeywords.length,
    statements,
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
    <template #subtitle> Format and beautify SQL queries with advanced options </template>
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

        <div class="options-grid">
          <!-- Language -->
          <div class="options-section">
            <div class="section-title">
              <i class="pi pi-code"></i>
              Language
            </div>
            <div class="option-item">
              <label for="language">SQL Dialect</label>
              <Select
                id="language"
                v-model="options.language"
                :options="languageOptions"
                option-label="label"
                option-value="value"
              />
            </div>
          </div>

          <!-- Indentation -->
          <div class="options-section">
            <div class="section-title">
              <i class="pi pi-align-left"></i>
              Indentation
            </div>
            <div class="option-item">
              <label for="tabWidth">Indent Size</label>
              <InputNumber
                id="tabWidth"
                v-model="options.tabWidth"
                :min="1"
                :max="8"
                show-buttons
                button-layout="horizontal"
              />
            </div>
            <div class="option-item">
              <label for="indentStyle">Indent Style</label>
              <Select
                id="indentStyle"
                v-model="options.indentStyle"
                :options="indentStyleOptions"
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="toggle-option">
              <ToggleSwitch v-model="options.useTabs" input-id="useTabs" />
              <label for="useTabs">Use Tabs instead of Spaces</label>
            </div>
          </div>

          <!-- Case Options -->
          <div class="options-section">
            <div class="section-title">
              <i class="pi pi-text-aa"></i>
              Case Options
            </div>
            <div class="option-item">
              <label for="keywordCase">Keywords</label>
              <Select
                id="keywordCase"
                v-model="options.keywordCase"
                :options="keywordCaseOptions"
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="option-item">
              <label for="identifierCase">Identifiers</label>
              <Select
                id="identifierCase"
                v-model="options.identifierCase"
                :options="identifierCaseOptions"
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="option-item">
              <label for="dataTypeCase">Data Types</label>
              <Select
                id="dataTypeCase"
                v-model="options.dataTypeCase"
                :options="dataTypeCaseOptions"
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="option-item">
              <label for="functionCase">Functions</label>
              <Select
                id="functionCase"
                v-model="options.functionCase"
                :options="functionCaseOptions"
                option-label="label"
                option-value="value"
              />
            </div>
          </div>

          <!-- Layout Options -->
          <div class="options-section">
            <div class="section-title">
              <i class="pi pi-th-large"></i>
              Layout
            </div>
            <div class="option-item">
              <label for="expressionWidth">Expression Width</label>
              <InputNumber
                id="expressionWidth"
                v-model="options.expressionWidth"
                :min="10"
                :max="200"
                show-buttons
                button-layout="horizontal"
              />
            </div>
            <div class="option-item">
              <label for="linesBetweenQueries">Lines Between Queries</label>
              <InputNumber
                id="linesBetweenQueries"
                v-model="options.linesBetweenQueries"
                :min="0"
                :max="5"
                show-buttons
                button-layout="horizontal"
              />
            </div>
            <div class="option-item">
              <label for="logicalOperatorNewline">Logical Operator Position</label>
              <Select
                id="logicalOperatorNewline"
                v-model="options.logicalOperatorNewline"
                :options="logicalOperatorNewlineOptions"
                option-label="label"
                option-value="value"
              />
            </div>
          </div>

          <!-- Formatting Style -->
          <div class="options-section">
            <div class="section-title">
              <i class="pi pi-sliders-h"></i>
              Formatting Style
            </div>
            <div class="toggle-option">
              <ToggleSwitch v-model="options.denseOperators" input-id="denseOperators" />
              <label for="denseOperators">Dense operators (no spaces)</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                v-model="options.newlineBeforeSemicolon"
                input-id="newlineBeforeSemicolon"
              />
              <label for="newlineBeforeSemicolon">Newline before semicolon</label>
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

        <Divider />

        <div v-if="sqlStats" class="stats-display">
          <Tag :value="`${sqlStats.chars} chars`" severity="secondary" icon="pi pi-file" />
          <Tag :value="`${sqlStats.lines} lines`" severity="secondary" icon="pi pi-list" />
          <Tag :value="`${sqlStats.statements} statements`" severity="info" icon="pi pi-database" />
          <Tag :value="`${sqlStats.keywords} keywords`" severity="secondary" icon="pi pi-code" />
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

.stats-display {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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
