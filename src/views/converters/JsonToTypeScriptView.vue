<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import JsonToTS from 'json-to-ts'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/CodeEditor.vue'

const toast = useToast()
const { copy } = useClipboard()

const json = ref('')
const typeScript = ref('')
const rootName = ref('RootObject')
const useInterfaces = ref(true)
const addExport = ref(true)
const optionalProperties = ref(false)
const validationError = ref('')

const convertJsonToTypeScript = (jsonString: string): string => {
  validationError.value = ''
  if (!jsonString.trim()) {
    return ''
  }

  try {
    const parsed = JSON.parse(jsonString)
    const interfaces = JsonToTS(parsed, { rootName: rootName.value })

    const result = interfaces.map(i => {
      // Convert interface to type if needed
      const withType = useInterfaces.value
        ? i
        : i.replace(/^interface\s+(\w+)\s*\{/gm, 'type $1 = {')

      // Add export keyword
      const withExport = addExport.value
        ? withType.replace(/^(interface|type)\s+/gm, 'export $1 ')
        : withType

      // Make properties optional
      const withOptional = optionalProperties.value
        ? withExport.replace(/^(\s+)(\w+):/gm, '$1$2?:')
        : withExport

      return withOptional
    })

    return result.join('\n\n')
  } catch (error) {
    validationError.value = error instanceof Error ? error.message : 'Invalid JSON format'
    return ''
  }
}

watch(
  [json, rootName, useInterfaces, addExport, optionalProperties],
  () => {
    typeScript.value = convertJsonToTypeScript(json.value)
  },
  { immediate: true },
)

// Copy TypeScript
const copyTypeScript = () => {
  if (typeScript.value) {
    copy(typeScript.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'TypeScript code copied to clipboard',
      life: 2000,
    })
  }
}

// Download TypeScript
const downloadTypeScript = () => {
  if (!typeScript.value) return

  const blob = new Blob([typeScript.value], { type: 'text/typescript' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${rootName.value.toLowerCase()}.ts`
  link.click()
  URL.revokeObjectURL(url)

  toast.add({
    severity: 'success',
    summary: 'Downloaded',
    detail: 'TypeScript file downloaded',
    life: 2000,
  })
}

// Sample JSON
const loadSample = () => {
  json.value = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "isActive": true,
  "roles": ["admin", "user"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "country": "USA"
  },
  "orders": [
    {
      "orderId": "ORD001",
      "total": 99.99,
      "items": [
        {
          "productId": "P001",
          "name": "Widget",
          "quantity": 2,
          "price": 49.99
        }
      ]
    }
  ],
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z",
    "tags": ["premium", "verified"]
  }
}`
}

// Clear all
const clearAll = () => {
  json.value = ''
  typeScript.value = ''
  validationError.value = ''
}

// JSON stats
const jsonStats = computed(() => {
  if (!json.value.trim()) return null

  try {
    const parsed = JSON.parse(json.value)
    return {
      valid: true,
      type: Array.isArray(parsed) ? 'Array' : typeof parsed,
    }
  } catch {
    return { valid: false, type: 'Invalid' }
  }
})

// Count generated interfaces/types
const typeCount = computed(() => {
  if (!typeScript.value) return 0
  const matches = typeScript.value.match(/^(export\s+)?(interface|type)\s+/gm)
  return matches ? matches.length : 0
})
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>JSON to TypeScript</span>
      </div>
    </template>
    <template #subtitle> Convert JSON to TypeScript interfaces or types </template>
    <template #content>
      <Panel toggleable class="options-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-cog"></i>
            <span>Options</span>
            <Tag
              v-if="jsonStats"
              :value="jsonStats.valid ? 'Valid JSON' : 'Invalid'"
              :severity="jsonStats.valid ? 'success' : 'danger'"
              :icon="jsonStats.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
            />
          </div>
        </template>

        <div class="options-content">
          <div class="option-item">
            <label for="rootName">
              <i class="pi pi-tag"></i>
              Root Name
            </label>
            <InputGroup>
              <InputGroupAddon>
                <i class="pi pi-code"></i>
              </InputGroupAddon>
              <InputText id="rootName" v-model="rootName" placeholder="RootObject" />
            </InputGroup>
          </div>

          <Divider layout="vertical" />

          <div class="toggle-options">
            <div class="toggle-option">
              <ToggleSwitch v-model="useInterfaces" inputId="useInterfaces" />
              <label for="useInterfaces">
                <Tag
                  :value="useInterfaces ? 'interface' : 'type'"
                  :severity="useInterfaces ? 'info' : 'secondary'"
                />
              </label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch v-model="addExport" inputId="addExport" />
              <label for="addExport">
                <Tag
                  :value="addExport ? 'export' : 'no export'"
                  :severity="addExport ? 'success' : 'secondary'"
                />
              </label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch v-model="optionalProperties" inputId="optionalProps" />
              <label for="optionalProps">
                <Tag
                  :value="optionalProperties ? 'prop?: T' : 'prop: T'"
                  :severity="optionalProperties ? 'warn' : 'secondary'"
                />
              </label>
            </div>
          </div>
        </div>
      </Panel>

      <Message v-if="validationError" severity="error" :closable="false" class="error-message">
        <i class="pi pi-times-circle"></i>
        {{ validationError }}
      </Message>

      <div class="editor-grid">
        <div class="editor-panel">
          <div class="panel-label">
            <i class="pi pi-file"></i>
            <span>JSON</span>
            <Tag v-if="jsonStats?.valid" :value="`Type: ${jsonStats.type}`" severity="info" />
          </div>
          <CodeEditor v-model="json" mode="json" height="450px" />
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
                :disabled="!json"
                @click="clearAll"
              />
            </template>
          </Toolbar>
        </div>

        <div class="editor-panel">
          <div class="panel-label">
            <i class="pi pi-code"></i>
            <span>TypeScript</span>
            <Tag
              v-if="typeCount > 0"
              :value="`${typeCount} ${useInterfaces ? 'interfaces' : 'types'}`"
              severity="success"
            />
          </div>
          <CodeEditor
            v-model="typeScript"
            mode="typescript"
            height="450px"
            :options="{ readOnly: true }"
          />
          <Toolbar class="editor-toolbar">
            <template #start>
              <Button
                icon="pi pi-copy"
                label="Copy"
                severity="secondary"
                :disabled="!typeScript"
                @click="copyTypeScript"
              />
              <Button
                icon="pi pi-download"
                label="Download .ts"
                severity="info"
                :disabled="!typeScript"
                @click="downloadTypeScript"
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
  align-items: center;
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

.toggle-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message {
  margin-bottom: 1rem;

  i {
    margin-right: 0.5rem;
  }
}

.editor-grid {
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
</style>
