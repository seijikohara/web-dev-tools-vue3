<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

const toast = useToast()
const { copy } = useClipboard()

// Current time state
const currentTimestamp = ref(Date.now())
const intervalId = ref<number | null>(null)

onMounted(() => {
  intervalId.value = window.setInterval(() => {
    currentTimestamp.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})

// Current time computed values
const currentTimeFormats = computed(() => {
  const now = dayjs(currentTimestamp.value)
  return [
    {
      label: 'Unix Timestamp (seconds)',
      value: Math.floor(currentTimestamp.value / 1000).toString(),
      icon: 'pi pi-clock',
    },
    {
      label: 'Unix Timestamp (milliseconds)',
      value: currentTimestamp.value.toString(),
      icon: 'pi pi-stopwatch',
    },
    { label: 'ISO 8601', value: now.toISOString(), icon: 'pi pi-calendar' },
    {
      label: 'RFC 2822',
      value: now.format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
      icon: 'pi pi-envelope',
    },
    { label: 'Local', value: now.format('YYYY-MM-DD HH:mm:ss'), icon: 'pi pi-home' },
    { label: 'UTC', value: now.utc().format('YYYY-MM-DD HH:mm:ss [UTC]'), icon: 'pi pi-globe' },
  ]
})

// Converter state
const timestampInput = ref('')
const timestampUnit = ref<'seconds' | 'milliseconds'>('seconds')
const dateTimeInput = ref('')
const selectedTimezone = ref(dayjs.tz.guess())

const unitOptions = [
  { label: 'Seconds', value: 'seconds' },
  { label: 'Milliseconds', value: 'milliseconds' },
]

// Common timezones
const timezoneOptions = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
].map(tz => ({ label: tz, value: tz }))

// Convert timestamp to date - compute error separately to avoid side effects
const timestampConversionError = computed(() => {
  if (!timestampInput.value) return ''

  const ts = parseInt(timestampInput.value)
  if (isNaN(ts)) return 'Invalid timestamp'

  const multiplier = timestampUnit.value === 'seconds' ? 1000 : 1
  const date = dayjs(ts * multiplier)
  if (!date.isValid()) return 'Invalid timestamp'

  return ''
})

const convertedFromTimestamp = computed(() => {
  if (!timestampInput.value || timestampConversionError.value) return null

  try {
    const parsed = parseInt(timestampInput.value)
    if (isNaN(parsed)) return null

    const ts = timestampUnit.value === 'seconds' ? parsed * 1000 : parsed

    const date = dayjs(ts)
    if (!date.isValid()) return null

    return {
      local: date.format('YYYY-MM-DD HH:mm:ss'),
      utc: date.utc().format('YYYY-MM-DD HH:mm:ss [UTC]'),
      iso: date.toISOString(),
      relative: date.fromNow(),
      timezone: date.tz(selectedTimezone.value).format('YYYY-MM-DD HH:mm:ss Z'),
    }
  } catch {
    return null
  }
})

// Convert date to timestamp
const convertedFromDate = computed(() => {
  if (!dateTimeInput.value) return null

  try {
    const date = dayjs(dateTimeInput.value)
    if (!date.isValid()) return null

    return {
      seconds: Math.floor(date.valueOf() / 1000),
      milliseconds: date.valueOf(),
      iso: date.toISOString(),
    }
  } catch {
    return null
  }
})

// Copy functions
const copyValue = (value: string, label: string) => {
  copy(value)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: `${label} copied to clipboard`,
    life: 2000,
  })
}

// Set current timestamp
const setCurrentTimestamp = () => {
  const now = Date.now()
  timestampInput.value =
    timestampUnit.value === 'seconds' ? Math.floor(now / 1000).toString() : now.toString()
}

// Set current date/time
const setCurrentDateTime = () => {
  dateTimeInput.value = dayjs().format('YYYY-MM-DDTHH:mm:ss')
}

// Common timestamps
const commonTimestamps = computed(() => {
  const now = dayjs()
  return [
    { label: 'Now', ts: now.valueOf(), date: now.format('YYYY-MM-DD HH:mm:ss') },
    {
      label: 'Start of today',
      ts: now.startOf('day').valueOf(),
      date: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'End of today',
      ts: now.endOf('day').valueOf(),
      date: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Start of week',
      ts: now.startOf('week').valueOf(),
      date: now.startOf('week').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Start of month',
      ts: now.startOf('month').valueOf(),
      date: now.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Start of year',
      ts: now.startOf('year').valueOf(),
      date: now.startOf('year').format('YYYY-MM-DD HH:mm:ss'),
    },
    { label: 'Unix Epoch', ts: 0, date: '1970-01-01 00:00:00' },
    { label: 'Y2K', ts: 946684800000, date: '2000-01-01 00:00:00' },
  ]
})

// Time calculations
const calcBaseTimestamp = ref('')
const calcOperation = ref<'add' | 'subtract'>('add')
const calcAmount = ref(1)
const calcUnit = ref<'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'>(
  'days',
)

const operationOptions = [
  { label: 'Add', value: 'add', icon: 'pi pi-plus' },
  { label: 'Subtract', value: 'subtract', icon: 'pi pi-minus' },
]

const calcUnitOptions = [
  { label: 'Seconds', value: 'seconds' },
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
  { label: 'Years', value: 'years' },
]

const calculatedResult = computed(() => {
  if (!calcBaseTimestamp.value) return null

  try {
    const base = dayjs(calcBaseTimestamp.value)
    if (!base.isValid()) return null

    const result =
      calcOperation.value === 'add'
        ? base.add(calcAmount.value, calcUnit.value)
        : base.subtract(calcAmount.value, calcUnit.value)

    return {
      date: result.format('YYYY-MM-DD HH:mm:ss'),
      timestamp: result.valueOf(),
      iso: result.toISOString(),
    }
  } catch {
    return null
  }
})

const setCalcBaseNow = () => {
  calcBaseTimestamp.value = dayjs().format('YYYY-MM-DDTHH:mm:ss')
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-clock"></i>
        <span>Timestamp Converter</span>
      </div>
    </template>
    <template #subtitle> Convert between Unix timestamps and human-readable dates </template>
    <template #content>
      <TabView>
        <TabPanel value="0" header="Current Time">
          <div class="current-time-section">
            <div class="live-indicator">
              <Tag value="LIVE" severity="success" icon="pi pi-circle-fill" />
              <span class="live-text">Real-time clock</span>
            </div>

            <DataTable :value="currentTimeFormats" stripedRows size="small" class="formats-table">
              <Column field="label" header="Format" style="width: 200px">
                <template #body="slotProps">
                  <div class="format-label">
                    <i :class="slotProps.data.icon"></i>
                    <span>{{ slotProps.data.label }}</span>
                  </div>
                </template>
              </Column>
              <Column field="value" header="Value">
                <template #body="slotProps">
                  <code class="value-text">{{ slotProps.data.value }}</code>
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
                    @click="copyValue(slotProps.data.value, slotProps.data.label)"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <TabPanel value="1" header="Timestamp to Date">
          <div class="converter-section">
            <div class="field">
              <label>
                <i class="pi pi-hashtag"></i>
                Unix Timestamp
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-clock"></i>
                </InputGroupAddon>
                <InputText
                  v-model="timestampInput"
                  class="flex-grow-1"
                  placeholder="e.g., 1699000000"
                />
                <InputGroupAddon>
                  <Select
                    v-model="timestampUnit"
                    :options="unitOptions"
                    optionLabel="label"
                    optionValue="value"
                    style="width: 140px"
                  />
                </InputGroupAddon>
                <InputGroupAddon>
                  <Button
                    label="Now"
                    icon="pi pi-clock"
                    severity="secondary"
                    @click="setCurrentTimestamp"
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div class="field">
              <label>
                <i class="pi pi-globe"></i>
                Display Timezone
              </label>
              <Select
                v-model="selectedTimezone"
                :options="timezoneOptions"
                optionLabel="label"
                optionValue="value"
                filter
                class="w-full"
              />
            </div>

            <Message v-if="timestampConversionError" severity="error" :closable="false">
              <div class="error-content">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ timestampConversionError }}</span>
              </div>
            </Message>

            <div v-if="convertedFromTimestamp" class="result-section">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-calendar"></i>
                  Converted Date
                </span>
              </Divider>

              <div class="result-grid">
                <div class="result-item">
                  <Tag value="Local" severity="secondary" />
                  <code class="result-value">{{ convertedFromTimestamp.local }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(convertedFromTimestamp.local, 'Local Time')"
                  />
                </div>
                <div class="result-item">
                  <Tag value="UTC" severity="info" />
                  <code class="result-value">{{ convertedFromTimestamp.utc }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(convertedFromTimestamp.utc, 'UTC')"
                  />
                </div>
                <div class="result-item">
                  <Tag value="ISO 8601" severity="success" />
                  <code class="result-value">{{ convertedFromTimestamp.iso }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(convertedFromTimestamp.iso, 'ISO 8601')"
                  />
                </div>
                <div class="result-item">
                  <Tag :value="selectedTimezone" severity="warn" />
                  <code class="result-value">{{ convertedFromTimestamp.timezone }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(convertedFromTimestamp.timezone, selectedTimezone)"
                  />
                </div>
                <div class="result-item relative-item">
                  <Tag value="Relative" severity="contrast" />
                  <span class="relative-value">{{ convertedFromTimestamp.relative }}</span>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="2" header="Date to Timestamp">
          <div class="converter-section">
            <div class="field">
              <label>
                <i class="pi pi-calendar"></i>
                Date & Time
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-calendar"></i>
                </InputGroupAddon>
                <InputText v-model="dateTimeInput" type="datetime-local" class="flex-grow-1" />
                <InputGroupAddon>
                  <Button
                    label="Now"
                    icon="pi pi-clock"
                    severity="secondary"
                    @click="setCurrentDateTime"
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div v-if="convertedFromDate" class="result-section">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-hashtag"></i>
                  Converted Timestamp
                </span>
              </Divider>

              <div class="result-grid">
                <div class="result-item">
                  <Tag value="Seconds" severity="secondary" />
                  <code class="result-value">{{ convertedFromDate.seconds }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(convertedFromDate.seconds.toString(), 'Unix seconds')"
                  />
                </div>
                <div class="result-item">
                  <Tag value="Milliseconds" severity="info" />
                  <code class="result-value">{{ convertedFromDate.milliseconds }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="
                      copyValue(convertedFromDate.milliseconds.toString(), 'Unix milliseconds')
                    "
                  />
                </div>
                <div class="result-item">
                  <Tag value="ISO 8601" severity="success" />
                  <code class="result-value">{{ convertedFromDate.iso }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(convertedFromDate.iso, 'ISO 8601')"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="3" header="Calculator">
          <div class="calculator-section">
            <div class="field">
              <label>
                <i class="pi pi-calendar"></i>
                Base Date/Time
              </label>
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-calendar"></i>
                </InputGroupAddon>
                <InputText v-model="calcBaseTimestamp" type="datetime-local" class="flex-grow-1" />
                <InputGroupAddon>
                  <Button
                    label="Now"
                    icon="pi pi-clock"
                    severity="secondary"
                    @click="setCalcBaseNow"
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div class="calc-row">
              <div class="field">
                <label>
                  <i class="pi pi-sliders-h"></i>
                  Operation
                </label>
                <Select
                  v-model="calcOperation"
                  :options="operationOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                >
                  <template #option="slotProps">
                    <div class="operation-option">
                      <i :class="slotProps.option.icon"></i>
                      <span>{{ slotProps.option.label }}</span>
                    </div>
                  </template>
                </Select>
              </div>
              <div class="field">
                <label>
                  <i class="pi pi-hashtag"></i>
                  Amount
                </label>
                <InputNumber v-model="calcAmount" :min="0" showButtons class="w-full" />
              </div>
              <div class="field">
                <label>
                  <i class="pi pi-clock"></i>
                  Unit
                </label>
                <Select
                  v-model="calcUnit"
                  :options="calcUnitOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </div>

            <div v-if="calculatedResult" class="result-section">
              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-calculator"></i>
                  Result
                </span>
              </Divider>

              <div class="result-grid">
                <div class="result-item">
                  <Tag value="Date/Time" severity="secondary" />
                  <code class="result-value">{{ calculatedResult.date }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(calculatedResult.date, 'Date/Time')"
                  />
                </div>
                <div class="result-item">
                  <Tag value="Timestamp (ms)" severity="info" />
                  <code class="result-value">{{ calculatedResult.timestamp }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(calculatedResult.timestamp.toString(), 'Timestamp')"
                  />
                </div>
                <div class="result-item">
                  <Tag value="ISO 8601" severity="success" />
                  <code class="result-value">{{ calculatedResult.iso }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    @click="copyValue(calculatedResult.iso, 'ISO 8601')"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="4" header="Common Timestamps">
          <DataTable :value="commonTimestamps" stripedRows size="small" class="common-table">
            <Column field="label" header="Description" style="width: 150px">
              <template #body="slotProps">
                <Tag :value="slotProps.data.label" severity="secondary" />
              </template>
            </Column>
            <Column field="date" header="Date/Time">
              <template #body="slotProps">
                <code class="value-text">{{ slotProps.data.date }}</code>
              </template>
            </Column>
            <Column header="Timestamp (ms)">
              <template #body="slotProps">
                <code class="value-text">{{ slotProps.data.ts }}</code>
              </template>
            </Column>
            <Column style="width: 100px">
              <template #body="slotProps">
                <Button
                  v-tooltip.top="'Copy timestamp'"
                  icon="pi pi-copy"
                  severity="secondary"
                  text
                  rounded
                  @click="copyValue(slotProps.data.ts.toString(), slotProps.data.label)"
                />
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabView>
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

.current-time-section {
  .live-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    background: var(--surface-ground);
    border-radius: 6px;
  }

  .live-text {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
  }
}

.formats-table,
.common-table {
  .format-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: var(--primary-color);
    }
  }

  .value-text {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
  }
}

.converter-section,
.calculator-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;

    i {
      color: var(--primary-color);
    }
  }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calc-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.operation-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-section {
  margin-top: 0.5rem;
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

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 1rem;

  .result-value {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
    flex: 1;
  }

  &.relative-item {
    .relative-value {
      font-style: italic;
      color: var(--text-color-secondary);
    }
  }
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
