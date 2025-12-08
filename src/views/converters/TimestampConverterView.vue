<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

import {
  useTimestampConverter,
  UNIT_OPTIONS,
  TIMEZONE_OPTIONS,
  OPERATION_OPTIONS,
  CALC_UNIT_OPTIONS,
} from '@/composables/useTimestampConverter'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy } = useClipboardToast()

// Use composable
const {
  timestampInput,
  timestampUnit,
  dateTimeInput,
  selectedTimezone,
  calcBaseTimestamp,
  calcOperation,
  calcAmount,
  calcUnit,
  currentTimeFormats,
  timestampConversionError,
  convertedFromTimestamp,
  convertedFromDate,
  calculatedResult,
  commonTimestamps,
  setCurrentTimestamp,
  setCurrentDateTime,
  setCalcBaseNow,
} = useTimestampConverter()

// UI actions with toast notifications
const copyValue = (value: string, label: string) => {
  void copy(value, { detail: `${label} copied to clipboard` })
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
      <Tabs value="0">
        <TabList>
          <Tab value="0">Current Time</Tab>
          <Tab value="1">Timestamp to Date</Tab>
          <Tab value="2">Date to Timestamp</Tab>
          <Tab value="3">Calculator</Tab>
          <Tab value="4">Common Timestamps</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="0">
            <div class="current-time-section">
              <div class="live-indicator">
                <Tag value="LIVE" severity="success" icon="pi pi-circle-fill" />
                <span class="live-text">Real-time clock</span>
              </div>

              <DataTable
                :value="currentTimeFormats"
                striped-rows
                size="small"
                class="formats-table"
              >
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

          <TabPanel value="1">
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
                      :options="UNIT_OPTIONS"
                      option-label="label"
                      option-value="value"
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
                  :options="TIMEZONE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  filter
                  class="w-full"
                />
              </div>

              <Transition name="fade-slide">
                <Message v-if="timestampConversionError" severity="error" :closable="false">
                  <div class="error-content">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>{{ timestampConversionError }}</span>
                  </div>
                </Message>
              </Transition>

              <Transition name="fade-slide">
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
                        rounded
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
                        rounded
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
                        rounded
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
                        rounded
                        @click="copyValue(convertedFromTimestamp.timezone, selectedTimezone)"
                      />
                    </div>
                    <div class="result-item relative-item">
                      <Tag value="Relative" severity="contrast" />
                      <span class="relative-value">{{ convertedFromTimestamp.relative }}</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </TabPanel>

          <TabPanel value="2">
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

              <Transition name="fade-slide">
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
                        rounded
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
                        rounded
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
                        rounded
                        @click="copyValue(convertedFromDate.iso, 'ISO 8601')"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </TabPanel>

          <TabPanel value="3">
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
                  <InputText
                    v-model="calcBaseTimestamp"
                    type="datetime-local"
                    class="flex-grow-1"
                  />
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
                    :options="OPERATION_OPTIONS"
                    option-label="label"
                    option-value="value"
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
                  <InputNumber v-model="calcAmount" :min="0" show-buttons class="w-full" />
                </div>
                <div class="field">
                  <label>
                    <i class="pi pi-clock"></i>
                    Unit
                  </label>
                  <Select
                    v-model="calcUnit"
                    :options="CALC_UNIT_OPTIONS"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>
              </div>

              <Transition name="fade-slide">
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
                        rounded
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
                        rounded
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
                        rounded
                        @click="copyValue(calculatedResult.iso, 'ISO 8601')"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </TabPanel>

          <TabPanel value="4">
            <DataTable :value="commonTimestamps" striped-rows size="small" class="common-table">
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
        </TabPanels>
      </Tabs>
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
  flex-wrap: wrap;

  .result-value {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
    flex: 1;
    min-width: 0;
    word-break: break-all;
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
