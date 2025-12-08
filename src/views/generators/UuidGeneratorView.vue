<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import CodeEditor from '@/components/editors/CodeEditor.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

import { useClipboardToast } from '@/composables/useClipboardToast'
import { useUuidGenerator } from '@/composables/useUuidGenerator'

const { copy } = useClipboardToast()

// Use composable for UUID generation
const {
  version: uuidVersion,
  count,
  uppercase,
  noBraces,
  generatedUuids,
  uuidsAsText,
  uuidsCount,
  generate: generateUuids,
  generateSingle,
  clear: clearAll,
  versionOptions,
} = useUuidGenerator()

// UI actions with toast notifications
const copyUuid = (uuid: string) => {
  void copy(uuid, { detail: 'UUID copied to clipboard' })
}

const copyAllUuids = () => {
  void copy(uuidsAsText.value, { detail: `${uuidsCount.value} UUIDs copied to clipboard` })
}

const generateAndCopySingle = () => {
  const uuid = generateSingle()
  void copy(uuid, { summary: 'Generated & Copied', detail: uuid, life: 3000 })
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
              option-label="label"
              option-value="value"
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
            <InputNumber id="count" v-model="count" :min="1" :max="1000" show-buttons />
          </div>
        </div>

        <div class="format-options">
          <div class="toggle-option">
            <ToggleSwitch v-model="uppercase" input-id="uppercase" />
            <label for="uppercase">
              <Tag
                :value="uppercase ? 'UPPERCASE' : 'lowercase'"
                :severity="uppercase ? 'info' : 'secondary'"
              />
            </label>
          </div>
          <div class="toggle-option">
            <ToggleSwitch v-model="noBraces" input-id="noBraces" />
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
              v-if="uuidsCount > 0"
              :value="`${uuidsCount} generated`"
              severity="success"
              icon="pi pi-check-circle"
            />
          </template>
          <template #end>
            <Button
              v-tooltip.top="'Copy All'"
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              :disabled="uuidsCount === 0"
              @click="copyAllUuids"
            />
            <Button
              v-tooltip.top="'Clear All'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="uuidsCount === 0"
              @click="clearAll"
            />
          </template>
        </Toolbar>
      </div>

      <Transition name="fade-slide">
        <div v-if="uuidsCount > 0" class="results">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-list"></i>
              Generated UUIDs
            </span>
          </Divider>

          <DataTable
            :value="generatedUuids"
            :paginator="uuidsCount > 10"
            :rows="10"
            :rows-per-page-options="[10, 25, 50, 100]"
            striped-rows
            size="small"
            class="uuid-table"
          >
            <Column field="id" header="#" :header-style="{ width: '60px' }">
              <template #body="slotProps">
                <Tag :value="slotProps.data.id" severity="secondary" />
              </template>
            </Column>
            <Column field="uuid" header="UUID">
              <template #body="slotProps">
                <code class="uuid-value">{{ slotProps.data.uuid }}</code>
              </template>
            </Column>
            <Column :header-style="{ width: '80px' }">
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
      </Transition>
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
