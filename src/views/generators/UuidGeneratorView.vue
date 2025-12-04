<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import CodeEditor from '@/components/CodeEditor.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'

const toast = useToast()
const { copy } = useClipboard()

// UUID Generation functions
const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateUUIDv7 = (): string => {
  const timestamp = Date.now()
  const timestampHex = timestamp.toString(16).padStart(12, '0')

  const randomPart1 = Math.random().toString(16).slice(2, 6).padEnd(4, '0')
  const randomPart2 = Math.random().toString(16).slice(2, 6).padEnd(4, '0')
  const randomPart3 = Math.random().toString(16).slice(2, 14).padEnd(12, '0')

  const variantByte = ((parseInt(randomPart2[0] ?? '0', 16) & 0x3) | 0x8).toString(16)
  const uuid =
    `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-7${randomPart1.slice(0, 3)}-` +
    `${variantByte}${randomPart2.slice(1, 4)}-${randomPart3}`

  return uuid
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

// State
const uuidVersion = ref<'v4' | 'v7' | 'nil'>('v4')
const count = ref(1)
const uppercase = ref(false)
const noBraces = ref(true)
const generatedUuids = ref<{ id: number; uuid: string }[]>([])

const versionOptions = [
  { label: 'UUID v4 (Random)', value: 'v4', icon: 'pi pi-box' },
  { label: 'UUID v7 (Time-ordered)', value: 'v7', icon: 'pi pi-clock' },
  { label: 'NIL UUID', value: 'nil', icon: 'pi pi-minus' },
]

const formatUuid = (uuid: string): string => {
  const cased = uppercase.value ? uuid.toUpperCase() : uuid
  return noBraces.value ? cased : `{${cased}}`
}

const generateUuids = () => {
  const generateOne = (): string => {
    switch (uuidVersion.value) {
      case 'v7':
        return generateUUIDv7()
      case 'nil':
        return NIL_UUID
      case 'v4':
      default:
        return generateUUIDv4()
    }
  }

  const newUuids = Array.from({ length: count.value }, (_, i) => ({
    id: generatedUuids.value.length + i + 1,
    uuid: formatUuid(generateOne()),
  }))

  generatedUuids.value = [...newUuids, ...generatedUuids.value]
}

const clearAll = () => {
  generatedUuids.value = []
}

const copyUuid = (uuid: string) => {
  copy(uuid)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'UUID copied to clipboard',
    life: 2000,
  })
}

const copyAllUuids = () => {
  const allUuids = generatedUuids.value.map(item => item.uuid).join('\n')
  copy(allUuids)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${generatedUuids.value.length} UUIDs copied to clipboard`,
    life: 2000,
  })
}

const uuidsAsText = computed(() => generatedUuids.value.map(item => item.uuid).join('\n'))

// Quick generate single UUID
const generateAndCopySingle = () => {
  const uuid = formatUuid(
    uuidVersion.value === 'v7'
      ? generateUUIDv7()
      : uuidVersion.value === 'nil'
        ? NIL_UUID
        : generateUUIDv4(),
  )
  copy(uuid)
  toast.add({
    severity: 'success',
    summary: 'Generated & Copied',
    detail: uuid,
    life: 3000,
  })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-id-card"></i>
        <span>UUID Generator</span>
      </div>
    </template>
    <template #subtitle> Generate UUIDs (v4, v7) in various formats </template>
    <template #content>
      <div class="generator-panel">
        <div class="options-grid">
          <div class="option-item">
            <label for="version">
              <i class="pi pi-cog"></i>
              Version
            </label>
            <Select
              id="version"
              v-model="uuidVersion"
              :options="versionOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            >
              <template #option="slotProps">
                <div class="version-option">
                  <i :class="slotProps.option.icon"></i>
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <div class="option-item">
            <label for="count">
              <i class="pi pi-hashtag"></i>
              Count
            </label>
            <InputGroup>
              <InputNumber
                id="count"
                v-model="count"
                :min="1"
                :max="1000"
                showButtons
                buttonLayout="horizontal"
                :step="1"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
              />
            </InputGroup>
          </div>
        </div>

        <div class="format-options">
          <div class="toggle-option">
            <ToggleSwitch v-model="uppercase" inputId="uppercase" />
            <label for="uppercase">
              <Tag
                :value="uppercase ? 'UPPERCASE' : 'lowercase'"
                :severity="uppercase ? 'info' : 'secondary'"
              />
            </label>
          </div>
          <div class="toggle-option">
            <ToggleSwitch v-model="noBraces" inputId="noBraces" />
            <label for="noBraces">
              <Tag
                :value="noBraces ? 'No Braces' : '{Braces}'"
                :severity="noBraces ? 'secondary' : 'info'"
              />
            </label>
          </div>
        </div>

        <Toolbar class="action-toolbar">
          <template #start>
            <Button label="Generate" icon="pi pi-bolt" @click="generateUuids" />
            <Button
              v-tooltip.top="'Generate one and copy'"
              label="Quick Copy"
              icon="pi pi-copy"
              severity="secondary"
              @click="generateAndCopySingle"
            />
          </template>
          <template #center>
            <Tag
              v-if="generatedUuids.length > 0"
              :value="`${generatedUuids.length} generated`"
              severity="success"
              icon="pi pi-check-circle"
            />
          </template>
          <template #end>
            <Button
              v-tooltip.top="'Copy All'"
              icon="pi pi-copy"
              severity="info"
              text
              rounded
              :disabled="generatedUuids.length === 0"
              @click="copyAllUuids"
            />
            <Button
              v-tooltip.top="'Clear All'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="generatedUuids.length === 0"
              @click="clearAll"
            />
          </template>
        </Toolbar>
      </div>

      <div v-if="generatedUuids.length > 0" class="results">
        <Divider align="left">
          <span class="divider-text">
            <i class="pi pi-list"></i>
            Generated UUIDs
          </span>
        </Divider>

        <DataTable
          :value="generatedUuids"
          :paginator="generatedUuids.length > 10"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50, 100]"
          stripedRows
          size="small"
          class="uuid-table"
        >
          <Column field="id" header="#" :headerStyle="{ width: '60px' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.id" severity="secondary" />
            </template>
          </Column>
          <Column field="uuid" header="UUID">
            <template #body="slotProps">
              <code class="uuid-value">{{ slotProps.data.uuid }}</code>
            </template>
          </Column>
          <Column :headerStyle="{ width: '80px' }">
            <template #body="slotProps">
              <Button
                v-tooltip.top="'Copy'"
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                @click="copyUuid(slotProps.data.uuid)"
              />
            </template>
          </Column>
        </DataTable>

        <Divider align="left">
          <span class="divider-text">
            <i class="pi pi-file-edit"></i>
            Plain Text
          </span>
        </Divider>

        <CodeEditor
          :model-value="uuidsAsText"
          mode="plain_text"
          height="200px"
          :options="{ readOnly: true }"
        />
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

.generator-panel {
  background: var(--surface-ground);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.options-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.option-item {
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.version-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  i {
    color: var(--primary-color);
  }
}

.format-options {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 6px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-toolbar {
  background: transparent;
  border: none;
  padding: 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-center),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.results {
  margin-top: 1rem;
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

.uuid-table {
  margin-bottom: 1rem;
}

.uuid-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
</style>
