<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import * as YAML from 'yaml'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

// Get state from parent (injected by main view)
const formatTabRef = inject<{ state: { input: string } }>('formatTabRef', { state: { input: '' } })

// Compare tab state
const compareYaml1 = ref('')
const compareYaml2 = ref('')

interface DiffItem {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

// Compute compare error separately to avoid side effects
const yamlCompareError = computed(() => {
  if (!compareYaml1.value.trim() || !compareYaml2.value.trim()) return ''
  try {
    YAML.parse(compareYaml1.value)
    YAML.parse(compareYaml2.value)
    return ''
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid YAML'
  }
})

const compareYamlDiff = computed((): DiffItem[] => {
  if (!compareYaml1.value.trim() || !compareYaml2.value.trim() || yamlCompareError.value) return []

  try {
    const obj1: unknown = YAML.parse(compareYaml1.value)
    const obj2: unknown = YAML.parse(compareYaml2.value)
    return findDifferences(obj1, obj2)
  } catch {
    return []
  }
})

const findDifferences = (obj1: unknown, obj2: unknown, path = '$'): DiffItem[] => {
  // Type mismatch - early return
  if (typeof obj1 !== typeof obj2) {
    return [{
      path,
      type: 'changed',
      oldValue: YAML.stringify(obj1),
      newValue: YAML.stringify(obj2),
    }]
  }

  // Array comparison
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length)
    return Array.from({ length: maxLen }, (_, i) => i).flatMap(i => {
      if (i >= obj1.length) {
        return [{
          path: `${path}[${i}]`,
          type: 'added' as const,
          newValue: YAML.stringify(obj2[i]),
        }]
      }
      if (i >= obj2.length) {
        return [{
          path: `${path}[${i}]`,
          type: 'removed' as const,
          oldValue: YAML.stringify(obj1[i]),
        }]
      }
      return findDifferences(obj1[i], obj2[i], `${path}[${i}]`)
    })
  }

  // Object comparison
  if (
    obj1 !== null &&
    obj2 !== null &&
    typeof obj1 === 'object' &&
    typeof obj2 === 'object'
  ) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = [...new Set([...keys1, ...keys2])]

    return allKeys.flatMap(key => {
      const newPath = `${path}.${key}`
      if (!(key in obj1)) {
        return [{
          path: newPath,
          type: 'added' as const,
          newValue: YAML.stringify((obj2 as Record<string, unknown>)[key]),
        }]
      }
      if (!(key in obj2)) {
        return [{
          path: newPath,
          type: 'removed' as const,
          oldValue: YAML.stringify((obj1 as Record<string, unknown>)[key]),
        }]
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
    return [{
      path,
      type: 'changed',
      oldValue: YAML.stringify(obj1),
      newValue: YAML.stringify(obj2),
    }]
  }

  return []
}

// Load current YAML to compare
const loadToCompare1 = () => {
  compareYaml1.value = formatTabRef.state.input
}

const loadToCompare2 = () => {
  compareYaml2.value = formatTabRef.state.input
}
</script>

<template>
  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>YAML 1</span>
      </div>
      <CodeEditor
        v-model="compareYaml1"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Load Current"
            icon="pi pi-download"
            severity="secondary"
            :disabled="!formatTabRef.state.input"
            @click="loadToCompare1"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>YAML 2</span>
      </div>
      <CodeEditor
        v-model="compareYaml2"
        mode="yaml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Load Current"
            icon="pi pi-download"
            severity="secondary"
            :disabled="!formatTabRef.state.input"
            @click="loadToCompare2"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <Message v-if="yamlCompareError" severity="error" :closable="false">
    <i class="pi pi-times-circle"></i>
    {{ yamlCompareError }}
  </Message>

  <SectionDivider v-if="compareYaml1 && compareYaml2 && !yamlCompareError" icon="list">
    Comparison Result
    <Tag
      v-if="compareYamlDiff.length > 0"
      :value="`${compareYamlDiff.length} differences`"
      severity="warn"
    />
    <Tag v-else value="Identical" severity="success" icon="pi pi-check" />
  </SectionDivider>

  <div v-if="compareYamlDiff.length > 0" class="diff-results">
    <DataTable :value="compareYamlDiff" striped-rows size="small">
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
    v-else-if="compareYaml1 && compareYaml2 && !yamlCompareError"
    severity="success"
    :closable="false"
  >
    <i class="pi pi-check-circle"></i>
    No differences found - YAMLs are identical
  </Message>
</template>

<style lang="scss" scoped>
.diff-results {
  margin-top: 1rem;
}

.no-value {
  color: var(--text-color-secondary);
}
</style>
