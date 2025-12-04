<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

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

const toast = useToast()
const { copy } = useClipboard()

// Types
interface CronField {
  type: 'every' | 'specific' | 'range' | 'step'
  values: number[]
  rangeStart: number
  rangeEnd: number
  stepValue: number
}

// State
const useSeconds = ref(false)
const cronExpression = ref('* * * * *')

const seconds = ref<CronField>({
  type: 'every',
  values: [],
  rangeStart: 0,
  rangeEnd: 59,
  stepValue: 1,
})

const minutes = ref<CronField>({
  type: 'every',
  values: [],
  rangeStart: 0,
  rangeEnd: 59,
  stepValue: 1,
})

const hours = ref<CronField>({
  type: 'every',
  values: [],
  rangeStart: 0,
  rangeEnd: 23,
  stepValue: 1,
})

const dayOfMonth = ref<CronField>({
  type: 'every',
  values: [],
  rangeStart: 1,
  rangeEnd: 31,
  stepValue: 1,
})

const month = ref<CronField>({
  type: 'every',
  values: [],
  rangeStart: 1,
  rangeEnd: 12,
  stepValue: 1,
})

const dayOfWeek = ref<CronField>({
  type: 'every',
  values: [],
  rangeStart: 0,
  rangeEnd: 6,
  stepValue: 1,
})

// Options
const fieldTypeOptions = [
  { label: 'Every', value: 'every' },
  { label: 'Specific', value: 'specific' },
  { label: 'Range', value: 'range' },
  { label: 'Step', value: 'step' },
]

const monthNames = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

const dayNames = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

// Generate field expression
const generateFieldExpression = (field: CronField, min: number, max: number): string => {
  switch (field.type) {
    case 'every':
      return '*'
    case 'specific':
      return field.values.length > 0 ? field.values.sort((a, b) => a - b).join(',') : '*'
    case 'range':
      return `${Math.max(min, field.rangeStart)}-${Math.min(max, field.rangeEnd)}`
    case 'step':
      return field.stepValue > 1 ? `*/${field.stepValue}` : '*'
    default:
      return '*'
  }
}

// Generate cron expression
const generateCronExpression = () => {
  const parts = [
    generateFieldExpression(minutes.value, 0, 59),
    generateFieldExpression(hours.value, 0, 23),
    generateFieldExpression(dayOfMonth.value, 1, 31),
    generateFieldExpression(month.value, 1, 12),
    generateFieldExpression(dayOfWeek.value, 0, 6),
  ]

  if (useSeconds.value) {
    parts.unshift(generateFieldExpression(seconds.value, 0, 59))
  }

  cronExpression.value = parts.join(' ')
}

// Watch for changes
watch(
  [useSeconds, seconds, minutes, hours, dayOfMonth, month, dayOfWeek],
  () => {
    generateCronExpression()
  },
  { deep: true, immediate: true },
)

// Human readable description
const humanReadable = computed(() => {
  const parts: string[] = []

  // Seconds
  if (useSeconds.value) {
    if (seconds.value.type === 'every') {
      parts.push('Every second')
    } else if (seconds.value.type === 'step') {
      parts.push(`Every ${seconds.value.stepValue} seconds`)
    } else if (seconds.value.type === 'specific' && seconds.value.values.length > 0) {
      parts.push(`At second ${seconds.value.values.join(', ')}`)
    } else if (seconds.value.type === 'range') {
      parts.push(`Seconds ${seconds.value.rangeStart}-${seconds.value.rangeEnd}`)
    }
  }

  // Minutes
  if (minutes.value.type === 'every') {
    if (!useSeconds.value || seconds.value.type !== 'every') {
      parts.push('Every minute')
    }
  } else if (minutes.value.type === 'step') {
    parts.push(`Every ${minutes.value.stepValue} minutes`)
  } else if (minutes.value.type === 'specific' && minutes.value.values.length > 0) {
    parts.push(`At minute ${minutes.value.values.join(', ')}`)
  } else if (minutes.value.type === 'range') {
    parts.push(`Minutes ${minutes.value.rangeStart}-${minutes.value.rangeEnd}`)
  }

  // Hours
  if (hours.value.type === 'step') {
    parts.push(`every ${hours.value.stepValue} hours`)
  } else if (hours.value.type === 'specific' && hours.value.values.length > 0) {
    parts.push(`at hour ${hours.value.values.join(', ')}`)
  } else if (hours.value.type === 'range') {
    parts.push(`hours ${hours.value.rangeStart}-${hours.value.rangeEnd}`)
  }

  // Day of month
  if (dayOfMonth.value.type === 'specific' && dayOfMonth.value.values.length > 0) {
    parts.push(`on day ${dayOfMonth.value.values.join(', ')} of the month`)
  } else if (dayOfMonth.value.type === 'range') {
    parts.push(`days ${dayOfMonth.value.rangeStart}-${dayOfMonth.value.rangeEnd} of the month`)
  } else if (dayOfMonth.value.type === 'step') {
    parts.push(`every ${dayOfMonth.value.stepValue} days`)
  }

  // Month
  if (month.value.type === 'specific' && month.value.values.length > 0) {
    const monthLabels = month.value.values.map(
      v => monthNames.find(m => m.value === v)?.label ?? v.toString(),
    )
    parts.push(`in ${monthLabels.join(', ')}`)
  } else if (month.value.type === 'range') {
    const startMonth = monthNames.find(m => m.value === month.value.rangeStart)?.label
    const endMonth = monthNames.find(m => m.value === month.value.rangeEnd)?.label
    parts.push(`from ${startMonth} to ${endMonth}`)
  }

  // Day of week
  if (dayOfWeek.value.type === 'specific' && dayOfWeek.value.values.length > 0) {
    const dayLabels = dayOfWeek.value.values.map(
      v => dayNames.find(d => d.value === v)?.label ?? v.toString(),
    )
    parts.push(`on ${dayLabels.join(', ')}`)
  } else if (dayOfWeek.value.type === 'range') {
    const startDay = dayNames.find(d => d.value === dayOfWeek.value.rangeStart)?.label
    const endDay = dayNames.find(d => d.value === dayOfWeek.value.rangeEnd)?.label
    parts.push(`from ${startDay} to ${endDay}`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Every minute'
})

// Next executions
const nextExecutions = computed(() => {
  const now = new Date()
  const executions: Date[] = []
  const current = new Date(now)

  // Simple approximation for next 5 executions
  const maxIterations = 1000
  const iterationCount = { value: 0 }

  const matchesField = (value: number, field: CronField, min: number, max: number): boolean => {
    switch (field.type) {
      case 'every':
        return true
      case 'specific':
        return field.values.includes(value)
      case 'range':
        return value >= Math.max(min, field.rangeStart) && value <= Math.min(max, field.rangeEnd)
      case 'step':
        return value % field.stepValue === 0
      default:
        return true
    }
  }

  const matchesCron = (date: Date): boolean => {
    if (useSeconds.value && !matchesField(date.getSeconds(), seconds.value, 0, 59)) return false
    if (!matchesField(date.getMinutes(), minutes.value, 0, 59)) return false
    if (!matchesField(date.getHours(), hours.value, 0, 23)) return false
    if (!matchesField(date.getDate(), dayOfMonth.value, 1, 31)) return false
    if (!matchesField(date.getMonth() + 1, month.value, 1, 12)) return false
    if (!matchesField(date.getDay(), dayOfWeek.value, 0, 6)) return false
    return true
  }

  const incrementTime = (): void => {
    if (useSeconds.value) {
      current.setSeconds(current.getSeconds() + 1)
    } else {
      current.setMinutes(current.getMinutes() + 1)
    }
  }

  // Find next 5 executions
  const findExecutions = (): void => {
    incrementTime()

    if (iterationCount.value >= maxIterations || executions.length >= 5) {
      return
    }

    iterationCount.value++

    if (matchesCron(current)) {
      executions.push(new Date(current))
    }

    if (executions.length < 5 && iterationCount.value < maxIterations) {
      findExecutions()
    }
  }

  findExecutions()

  return executions
})

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: useSeconds.value ? '2-digit' : undefined,
  })
}

// Presets
const presets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every Monday', value: '0 0 * * 1' },
  { label: 'Every weekday', value: '0 0 * * 1-5' },
  { label: 'Every month (1st)', value: '0 0 1 * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
]

// Parse cron expression
const parseCronExpression = (expr: string): void => {
  const parts = expr.trim().split(/\s+/)

  const parseField = (value: string, min: number, max: number): CronField => {
    if (value === '*') {
      return { type: 'every', values: [], rangeStart: min, rangeEnd: max, stepValue: 1 }
    }
    if (value.startsWith('*/')) {
      const step = parseInt(value.slice(2), 10)
      return { type: 'step', values: [], rangeStart: min, rangeEnd: max, stepValue: step }
    }
    if (value.includes('-') && !value.includes(',')) {
      const rangeMatch = value.match(/(\d+)-(\d+)/)
      if (rangeMatch?.[1] && rangeMatch[2]) {
        return {
          type: 'range',
          values: [],
          rangeStart: parseInt(rangeMatch[1], 10),
          rangeEnd: parseInt(rangeMatch[2], 10),
          stepValue: 1,
        }
      }
    }
    if (value.includes(',') || /^\d+$/.test(value)) {
      const values = value.split(',').map(v => parseInt(v, 10))
      return { type: 'specific', values, rangeStart: min, rangeEnd: max, stepValue: 1 }
    }
    return { type: 'every', values: [], rangeStart: min, rangeEnd: max, stepValue: 1 }
  }

  if (parts.length === 6) {
    useSeconds.value = true
    seconds.value = parseField(parts[0] ?? '*', 0, 59)
    minutes.value = parseField(parts[1] ?? '*', 0, 59)
    hours.value = parseField(parts[2] ?? '*', 0, 23)
    dayOfMonth.value = parseField(parts[3] ?? '*', 1, 31)
    month.value = parseField(parts[4] ?? '*', 1, 12)
    dayOfWeek.value = parseField(parts[5] ?? '*', 0, 6)
  } else if (parts.length === 5) {
    useSeconds.value = false
    minutes.value = parseField(parts[0] ?? '*', 0, 59)
    hours.value = parseField(parts[1] ?? '*', 0, 23)
    dayOfMonth.value = parseField(parts[2] ?? '*', 1, 31)
    month.value = parseField(parts[3] ?? '*', 1, 12)
    dayOfWeek.value = parseField(parts[4] ?? '*', 0, 6)
  }
}

// Apply preset
const applyPreset = (preset: string) => {
  parseCronExpression(preset)
  toast.add({
    severity: 'success',
    summary: 'Applied',
    detail: 'Preset applied',
    life: 2000,
  })
}

// Copy expression
const copyExpression = () => {
  copy(cronExpression.value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Cron expression copied to clipboard',
    life: 2000,
  })
}

// Reset
const resetAll = () => {
  useSeconds.value = false
  seconds.value = { type: 'every', values: [], rangeStart: 0, rangeEnd: 59, stepValue: 1 }
  minutes.value = { type: 'every', values: [], rangeStart: 0, rangeEnd: 59, stepValue: 1 }
  hours.value = { type: 'every', values: [], rangeStart: 0, rangeEnd: 23, stepValue: 1 }
  dayOfMonth.value = { type: 'every', values: [], rangeStart: 1, rangeEnd: 31, stepValue: 1 }
  month.value = { type: 'every', values: [], rangeStart: 1, rangeEnd: 12, stepValue: 1 }
  dayOfWeek.value = { type: 'every', values: [], rangeStart: 0, rangeEnd: 6, stepValue: 1 }
}

// Generate value options for specific selection
const generateValueOptions = (min: number, max: number) => {
  return Array.from({ length: max - min + 1 }, (_, i) => ({
    label: String(min + i),
    value: min + i,
  }))
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
            <span>Generated Expression</span>
          </div>
        </template>

        <div class="result-content">
          <div class="cron-expression">
            <code>{{ cronExpression }}</code>
          </div>
          <div class="human-readable">
            <Tag severity="info" :value="humanReadable" />
          </div>
        </div>

        <Toolbar class="editor-toolbar">
          <template #start>
            <div class="seconds-toggle">
              <ToggleSwitch v-model="useSeconds" inputId="useSeconds" />
              <label for="useSeconds">Include Seconds</label>
            </div>
          </template>
          <template #end>
            <Button icon="pi pi-copy" label="Copy" @click="copyExpression" />
            <Button icon="pi pi-refresh" severity="secondary" text @click="resetAll" />
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
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
                <div v-if="seconds.type === 'specific'" class="value-select">
                  <Select
                    v-model="seconds.values"
                    :options="generateValueOptions(0, 59)"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select values"
                    multiple
                    :maxSelectedLabels="5"
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
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
                <div v-if="minutes.type === 'specific'" class="value-select">
                  <Select
                    v-model="minutes.values"
                    :options="generateValueOptions(0, 59)"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select values"
                    multiple
                    :maxSelectedLabels="5"
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
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
                <div v-if="hours.type === 'specific'" class="value-select">
                  <Select
                    v-model="hours.values"
                    :options="generateValueOptions(0, 23)"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select values"
                    multiple
                    :maxSelectedLabels="5"
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
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
                <div v-if="dayOfMonth.type === 'specific'" class="value-select">
                  <Select
                    v-model="dayOfMonth.values"
                    :options="generateValueOptions(1, 31)"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select values"
                    multiple
                    :maxSelectedLabels="5"
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
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
                <div v-if="month.type === 'specific'" class="value-select">
                  <Select
                    v-model="month.values"
                    :options="monthNames"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select months"
                    multiple
                    :maxSelectedLabels="3"
                  />
                </div>
                <div v-if="month.type === 'range'" class="range-inputs">
                  <Select
                    v-model="month.rangeStart"
                    :options="monthNames"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="From"
                    class="month-select"
                  />
                  <span>to</span>
                  <Select
                    v-model="month.rangeEnd"
                    :options="monthNames"
                    optionLabel="label"
                    optionValue="value"
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
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
                <div v-if="dayOfWeek.type === 'specific'" class="value-select">
                  <Select
                    v-model="dayOfWeek.values"
                    :options="dayNames"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select days"
                    multiple
                    :maxSelectedLabels="3"
                  />
                </div>
                <div v-if="dayOfWeek.type === 'range'" class="range-inputs">
                  <Select
                    v-model="dayOfWeek.rangeStart"
                    :options="dayNames"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="From"
                    class="day-select"
                  />
                  <span>to</span>
                  <Select
                    v-model="dayOfWeek.rangeEnd"
                    :options="dayNames"
                    optionLabel="label"
                    optionValue="value"
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
                v-for="preset in presets"
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

            <DataTable
              :value="[
                { field: 'Seconds', range: '0-59', allowed: '* , - /' },
                { field: 'Minutes', range: '0-59', allowed: '* , - /' },
                { field: 'Hours', range: '0-23', allowed: '* , - /' },
                { field: 'Day of Month', range: '1-31', allowed: '* , - / ? L W' },
                { field: 'Month', range: '1-12', allowed: '* , - /' },
                { field: 'Day of Week', range: '0-6', allowed: '* , - / ? L #' },
              ]"
              size="small"
            >
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

.cron-expression {
  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 1.5rem;
    color: var(--primary-color);
    background-color: var(--surface-ground);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
  }
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
}

.value-select {
  flex: 1;
  min-width: 200px;
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
