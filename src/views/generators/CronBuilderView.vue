<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Select from 'primevue/select'
import Divider from 'primevue/divider'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import SelectButton from 'primevue/selectbutton'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'

import {
  useCronBuilder,
  FIELD_TYPE_OPTIONS,
  MONTH_NAMES,
  DAY_NAMES,
  PRESETS,
  CRON_REFERENCE,
  generateValueOptions,
} from '@/composables/useCronBuilder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showSuccess } = useClipboardToast()

// Use composable
const {
  useSeconds,
  manualInput,
  parseError,
  seconds,
  minutes,
  hours,
  dayOfMonth,
  month,
  dayOfWeek,
  humanReadable,
  nextExecutions,
  applyPreset: applyPresetInternal,
  resetAll,
  formatDate,
} = useCronBuilder()

// UI actions with toast notifications
const applyPreset = (preset: string) => {
  applyPresetInternal(preset)
  showSuccess('Applied', 'Preset applied')
}

const copyExpression = () => {
  void copy(manualInput.value, { detail: 'Cron expression copied to clipboard' })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-clock"></i>
        <span>Cron Expression Builder</span>
      </div>
    </template>
    <template #subtitle> Build and parse cron expressions visually </template>
    <template #content>
      <!-- Result Section -->
      <Panel class="result-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-code"></i>
            <span>Expression</span>
          </div>
        </template>

        <div class="result-content">
          <div class="cron-expression-input">
            <InputText
              v-model="manualInput"
              class="cron-input"
              placeholder="Enter cron expression (e.g., */5 * * * *)"
              :invalid="!!parseError"
            />
          </div>
          <Message v-if="parseError" severity="error" :closable="false" class="parse-error">
            {{ parseError }}
          </Message>
          <div class="human-readable">
            <Tag severity="info" :value="humanReadable" />
          </div>
        </div>

        <Toolbar class="editor-toolbar">
          <template #start>
            <div class="seconds-toggle">
              <ToggleSwitch v-model="useSeconds" input-id="useSeconds" />
              <label for="useSeconds">Include Seconds</label>
            </div>
          </template>
          <template #end>
            <Button icon="pi pi-copy" label="Copy" @click="copyExpression" />
            <Button
              v-tooltip.top="'Reset'"
              icon="pi pi-refresh"
              severity="secondary"
              text
              rounded
              @click="resetAll"
            />
          </template>
        </Toolbar>
      </Panel>

      <div class="builder-grid">
        <!-- Fields Section -->
        <div class="fields-section">
          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-sliders-h"></i>
                <span>Fields</span>
              </div>
            </template>

            <!-- Seconds -->
            <div v-if="useSeconds" class="field-row">
              <div class="field-label">
                <Tag value="Seconds" severity="secondary" />
                <span class="field-range">(0-59)</span>
              </div>
              <div class="field-controls">
                <SelectButton
                  v-model="seconds.type"
                  :options="FIELD_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
                <div v-if="seconds.type === 'specific'" class="value-select">
                  <Select
                    v-model="seconds.values"
                    :options="generateValueOptions(0, 59)"
                    option-label="label"
                    option-value="value"
                    placeholder="Select values"
                    multiple
                    :max-selected-labels="5"
                  />
                </div>
                <div v-if="seconds.type === 'range'" class="range-inputs">
                  <InputNumber
                    v-model="seconds.rangeStart"
                    :min="0"
                    :max="59"
                    class="range-input"
                  />
                  <span>to</span>
                  <InputNumber v-model="seconds.rangeEnd" :min="0" :max="59" class="range-input" />
                </div>
                <div v-if="seconds.type === 'step'" class="step-input">
                  <span>Every</span>
                  <InputNumber v-model="seconds.stepValue" :min="1" :max="59" class="step-value" />
                  <span>seconds</span>
                </div>
              </div>
            </div>

            <Divider v-if="useSeconds" />

            <!-- Minutes -->
            <div class="field-row">
              <div class="field-label">
                <Tag value="Minutes" severity="secondary" />
                <span class="field-range">(0-59)</span>
              </div>
              <div class="field-controls">
                <SelectButton
                  v-model="minutes.type"
                  :options="FIELD_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
                <div v-if="minutes.type === 'specific'" class="value-select">
                  <Select
                    v-model="minutes.values"
                    :options="generateValueOptions(0, 59)"
                    option-label="label"
                    option-value="value"
                    placeholder="Select values"
                    multiple
                    :max-selected-labels="5"
                  />
                </div>
                <div v-if="minutes.type === 'range'" class="range-inputs">
                  <InputNumber
                    v-model="minutes.rangeStart"
                    :min="0"
                    :max="59"
                    class="range-input"
                  />
                  <span>to</span>
                  <InputNumber v-model="minutes.rangeEnd" :min="0" :max="59" class="range-input" />
                </div>
                <div v-if="minutes.type === 'step'" class="step-input">
                  <span>Every</span>
                  <InputNumber v-model="minutes.stepValue" :min="1" :max="59" class="step-value" />
                  <span>minutes</span>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Hours -->
            <div class="field-row">
              <div class="field-label">
                <Tag value="Hours" severity="secondary" />
                <span class="field-range">(0-23)</span>
              </div>
              <div class="field-controls">
                <SelectButton
                  v-model="hours.type"
                  :options="FIELD_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
                <div v-if="hours.type === 'specific'" class="value-select">
                  <Select
                    v-model="hours.values"
                    :options="generateValueOptions(0, 23)"
                    option-label="label"
                    option-value="value"
                    placeholder="Select values"
                    multiple
                    :max-selected-labels="5"
                  />
                </div>
                <div v-if="hours.type === 'range'" class="range-inputs">
                  <InputNumber v-model="hours.rangeStart" :min="0" :max="23" class="range-input" />
                  <span>to</span>
                  <InputNumber v-model="hours.rangeEnd" :min="0" :max="23" class="range-input" />
                </div>
                <div v-if="hours.type === 'step'" class="step-input">
                  <span>Every</span>
                  <InputNumber v-model="hours.stepValue" :min="1" :max="23" class="step-value" />
                  <span>hours</span>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Day of Month -->
            <div class="field-row">
              <div class="field-label">
                <Tag value="Day of Month" severity="secondary" />
                <span class="field-range">(1-31)</span>
              </div>
              <div class="field-controls">
                <SelectButton
                  v-model="dayOfMonth.type"
                  :options="FIELD_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
                <div v-if="dayOfMonth.type === 'specific'" class="value-select">
                  <Select
                    v-model="dayOfMonth.values"
                    :options="generateValueOptions(1, 31)"
                    option-label="label"
                    option-value="value"
                    placeholder="Select values"
                    multiple
                    :max-selected-labels="5"
                  />
                </div>
                <div v-if="dayOfMonth.type === 'range'" class="range-inputs">
                  <InputNumber
                    v-model="dayOfMonth.rangeStart"
                    :min="1"
                    :max="31"
                    class="range-input"
                  />
                  <span>to</span>
                  <InputNumber
                    v-model="dayOfMonth.rangeEnd"
                    :min="1"
                    :max="31"
                    class="range-input"
                  />
                </div>
                <div v-if="dayOfMonth.type === 'step'" class="step-input">
                  <span>Every</span>
                  <InputNumber
                    v-model="dayOfMonth.stepValue"
                    :min="1"
                    :max="31"
                    class="step-value"
                  />
                  <span>days</span>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Month -->
            <div class="field-row">
              <div class="field-label">
                <Tag value="Month" severity="secondary" />
                <span class="field-range">(1-12)</span>
              </div>
              <div class="field-controls">
                <SelectButton
                  v-model="month.type"
                  :options="FIELD_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
                <div v-if="month.type === 'specific'" class="value-select">
                  <Select
                    v-model="month.values"
                    :options="MONTH_NAMES"
                    option-label="label"
                    option-value="value"
                    placeholder="Select months"
                    multiple
                    :max-selected-labels="3"
                  />
                </div>
                <div v-if="month.type === 'range'" class="range-inputs">
                  <Select
                    v-model="month.rangeStart"
                    :options="MONTH_NAMES"
                    option-label="label"
                    option-value="value"
                    placeholder="From"
                    class="month-select"
                  />
                  <span>to</span>
                  <Select
                    v-model="month.rangeEnd"
                    :options="MONTH_NAMES"
                    option-label="label"
                    option-value="value"
                    placeholder="To"
                    class="month-select"
                  />
                </div>
                <div v-if="month.type === 'step'" class="step-input">
                  <span>Every</span>
                  <InputNumber v-model="month.stepValue" :min="1" :max="12" class="step-value" />
                  <span>months</span>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Day of Week -->
            <div class="field-row">
              <div class="field-label">
                <Tag value="Day of Week" severity="secondary" />
                <span class="field-range">(0-6)</span>
              </div>
              <div class="field-controls">
                <SelectButton
                  v-model="dayOfWeek.type"
                  :options="FIELD_TYPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
                <div v-if="dayOfWeek.type === 'specific'" class="value-select">
                  <Select
                    v-model="dayOfWeek.values"
                    :options="DAY_NAMES"
                    option-label="label"
                    option-value="value"
                    placeholder="Select days"
                    multiple
                    :max-selected-labels="3"
                  />
                </div>
                <div v-if="dayOfWeek.type === 'range'" class="range-inputs">
                  <Select
                    v-model="dayOfWeek.rangeStart"
                    :options="DAY_NAMES"
                    option-label="label"
                    option-value="value"
                    placeholder="From"
                    class="day-select"
                  />
                  <span>to</span>
                  <Select
                    v-model="dayOfWeek.rangeEnd"
                    :options="DAY_NAMES"
                    option-label="label"
                    option-value="value"
                    placeholder="To"
                    class="day-select"
                  />
                </div>
                <div v-if="dayOfWeek.type === 'step'" class="step-input">
                  <span>Every</span>
                  <InputNumber v-model="dayOfWeek.stepValue" :min="1" :max="6" class="step-value" />
                  <span>days</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <!-- Sidebar -->
        <div class="sidebar-section">
          <!-- Presets -->
          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-bookmark"></i>
                <span>Presets</span>
              </div>
            </template>

            <div class="presets-list">
              <Button
                v-for="preset in PRESETS"
                :key="preset.value"
                :label="preset.label"
                severity="secondary"
                text
                class="preset-button"
                @click="applyPreset(preset.value)"
              />
            </div>
          </Panel>

          <!-- Next Executions -->
          <Panel toggleable>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-calendar"></i>
                <span>Next Executions</span>
              </div>
            </template>

            <div class="executions-list">
              <div v-for="(execution, index) in nextExecutions" :key="index" class="execution-item">
                <Tag :value="String(index + 1)" severity="info" class="execution-number" />
                <span>{{ formatDate(execution) }}</span>
              </div>
              <div v-if="nextExecutions.length === 0" class="no-executions">
                No upcoming executions found
              </div>
            </div>
          </Panel>

          <!-- Reference -->
          <Panel toggleable collapsed>
            <template #header>
              <div class="panel-header">
                <i class="pi pi-info-circle"></i>
                <span>Reference</span>
              </div>
            </template>

            <DataTable :value="CRON_REFERENCE" size="small">
              <Column field="field" header="Field" />
              <Column field="range" header="Range" />
              <Column field="allowed" header="Allowed" />
            </DataTable>
          </Panel>
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

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  i {
    color: var(--primary-color);
  }
}

.result-panel {
  margin-bottom: 1.5rem;
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.cron-expression-input {
  width: 100%;
  max-width: 500px;

  .cron-input {
    width: 100%;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 1.25rem;
    text-align: center;
    padding: 0.75rem 1rem;

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
    }
  }
}

.parse-error {
  width: 100%;
  max-width: 500px;
  margin: 0;
}

.human-readable {
  text-align: center;
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

.seconds-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    cursor: pointer;
  }
}

.builder-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.fields-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .field-range {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.field-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;

  :deep(.p-selectbutton) {
    flex-shrink: 0;
  }
}

.value-select {
  flex: 1;
  min-width: 0;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .range-input {
    width: 80px;
  }

  .month-select,
  .day-select {
    width: 140px;
  }
}

.step-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .step-value {
    width: 60px;
  }
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .preset-button {
    justify-content: flex-start;
    text-align: left;
  }
}

.executions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.execution-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding: 0.5rem;
  background-color: var(--surface-ground);
  border-radius: 4px;

  .execution-number {
    min-width: 24px;
    text-align: center;
  }
}

.no-executions {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem;
}
</style>
