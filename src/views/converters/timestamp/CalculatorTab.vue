<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Tag from 'primevue/tag'

import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import {
  useTimestampConverter,
  OPERATION_OPTIONS,
  CALC_UNIT_OPTIONS,
} from '@/composables/useTimestampConverter'

const { calcBaseTimestamp, calcOperation, calcAmount, calcUnit, calculatedResult, setCalcBaseNow } =
  useTimestampConverter()
</script>

<template>
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
          <Button label="Now" icon="pi pi-clock" severity="secondary" @click="setCalcBaseNow" />
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
        <SectionDivider icon="calculator">Result</SectionDivider>

        <div class="result-grid">
          <div class="result-item">
            <Tag value="Date/Time" severity="secondary" />
            <code class="result-value">{{ calculatedResult.date }}</code>
            <CopyButton
              :value="calculatedResult.date"
              tooltip="Date/Time copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag value="Timestamp (ms)" severity="info" />
            <code class="result-value">{{ calculatedResult.timestamp }}</code>
            <CopyButton
              :value="calculatedResult.timestamp.toString()"
              tooltip="Timestamp copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag value="ISO 8601" severity="success" />
            <code class="result-value">{{ calculatedResult.iso }}</code>
            <CopyButton
              :value="calculatedResult.iso"
              tooltip="ISO 8601 copied to clipboard"
              icon-only
              rounded
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

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
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
