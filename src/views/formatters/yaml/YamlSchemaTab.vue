<script setup lang="ts">
import { ref, inject } from 'vue'
import * as YAML from 'yaml'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess, showWarning } = useClipboardToast()

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

// Get state from parent (injected by main view)
const formatTabRef = inject<{ state: { input: string } }>('formatTabRef', { state: { input: '' } })

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

  if (!formatTabRef.state.input.trim()) {
    schemaValidationResult.value = { valid: false, error: 'YAML input is empty' }
    return
  }

  if (!schemaInput.value.trim()) {
    schemaValidationResult.value = { valid: false, error: 'Schema is empty' }
    return
  }

  const parseYamlResult = (() => {
    try {
      return { success: true as const, data: YAML.parse(formatTabRef.state.input) as unknown }
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
  formatTabRef.state.input = `# Sample YAML Configuration
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

// Load sample YAML
const loadSample = () => {
  formatTabRef.state.input = `# Sample YAML Configuration
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
}

// Generate schema from YAML data
const generateSchemaFromData = () => {
  if (!formatTabRef.state.input.trim()) {
    showWarning('No Data', 'Please enter YAML data first')
    return
  }

  try {
    const data: unknown = YAML.parse(formatTabRef.state.input)
    const schema = inferSchema(data)
    schemaInput.value = JSON.stringify(schema, null, 2)
    showSuccess('Generated', 'Schema generated from YAML data')
  } catch (e) {
    showWarning('Error', e instanceof Error ? e.message : 'Failed to parse YAML')
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
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="verified">
        YAML Schema Validator
        <Tag
          v-if="schemaValidationResult"
          :value="schemaValidationResult.valid ? 'Valid' : 'Invalid'"
          :severity="schemaValidationResult.valid ? 'success' : 'danger'"
          :icon="schemaValidationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        />
      </PanelHeader>
    </template>

    <small class="hint-text">
      <i class="pi pi-info-circle"></i>
      Validate YAML data against a JSON Schema (Draft-07). YAML is parsed and validated using the
      same rules as JSON Schema.
    </small>
  </Panel>

  <Message v-if="schemaParseError" severity="error" :closable="false" class="schema-error">
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
        v-model="formatTabRef.state.input"
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
            :disabled="!formatTabRef.state.input || !schemaInput"
            @click="validateSchema"
          />
        </template>
        <template #end>
          <Button
            v-tooltip.top="'Generate Schema from Data'"
            icon="pi pi-bolt"
            severity="success"
            text
            :disabled="!formatTabRef.state.input"
            @click="generateSchemaFromData"
          />
          <Button
            v-tooltip.top="'Load Sample Schema'"
            icon="pi pi-file"
            severity="info"
            text
            @click="loadSampleSchema"
          />
          <CopyButton
            :value="schemaInput"
            tooltip="Schema copied to clipboard"
            :disabled="!schemaInput"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <SectionDivider v-if="schemaValidationResult" icon="list"> Validation Result </SectionDivider>

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
</template>

<style lang="scss" scoped>
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
