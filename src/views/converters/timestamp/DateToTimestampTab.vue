<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Tag from 'primevue/tag'

import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useTimestampConverter } from '@/composables/useTimestampConverter'

const { dateTimeInput, convertedFromDate, setCurrentDateTime } = useTimestampConverter()
</script>

<template>
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
          <Button label="Now" icon="pi pi-clock" severity="secondary" @click="setCurrentDateTime" />
        </InputGroupAddon>
      </InputGroup>
    </div>

    <Transition name="fade-slide">
      <div v-if="convertedFromDate" class="result-section">
        <SectionDivider icon="hashtag">Converted Timestamp</SectionDivider>

        <div class="result-grid">
          <div class="result-item">
            <Tag value="Seconds" severity="secondary" />
            <code class="result-value">{{ convertedFromDate.seconds }}</code>
            <CopyButton
              :value="convertedFromDate.seconds.toString()"
              tooltip="Unix seconds copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag value="Milliseconds" severity="info" />
            <code class="result-value">{{ convertedFromDate.milliseconds }}</code>
            <CopyButton
              :value="convertedFromDate.milliseconds.toString()"
              tooltip="Unix milliseconds copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag value="ISO 8601" severity="success" />
            <code class="result-value">{{ convertedFromDate.iso }}</code>
            <CopyButton
              :value="convertedFromDate.iso"
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

.converter-section {
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
