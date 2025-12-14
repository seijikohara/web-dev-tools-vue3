<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import {
  useTimestampConverter,
  UNIT_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/composables/useTimestampConverter'

const {
  timestampInput,
  timestampUnit,
  selectedTimezone,
  timestampConversionError,
  convertedFromTimestamp,
  setCurrentTimestamp,
} = useTimestampConverter()
</script>

<template>
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
        <InputText v-model="timestampInput" class="flex-grow-1" placeholder="e.g., 1699000000" />
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
        <SectionDivider icon="calendar">Converted Date</SectionDivider>

        <div class="result-grid">
          <div class="result-item">
            <Tag value="Local" severity="secondary" />
            <code class="result-value">{{ convertedFromTimestamp.local }}</code>
            <CopyButton
              :value="convertedFromTimestamp.local"
              tooltip="Local Time copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag value="UTC" severity="info" />
            <code class="result-value">{{ convertedFromTimestamp.utc }}</code>
            <CopyButton
              :value="convertedFromTimestamp.utc"
              tooltip="UTC copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag value="ISO 8601" severity="success" />
            <code class="result-value">{{ convertedFromTimestamp.iso }}</code>
            <CopyButton
              :value="convertedFromTimestamp.iso"
              tooltip="ISO 8601 copied to clipboard"
              icon-only
              rounded
            />
          </div>
          <div class="result-item">
            <Tag :value="selectedTimezone" severity="warn" />
            <code class="result-value">{{ convertedFromTimestamp.timezone }}</code>
            <CopyButton
              :value="convertedFromTimestamp.timezone"
              :tooltip="`${selectedTimezone} copied to clipboard`"
              icon-only
              rounded
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

.error-content {
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

  &.relative-item {
    .relative-value {
      font-style: italic;
      color: var(--text-color-secondary);
      flex: 1;
    }
  }
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
