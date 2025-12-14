<script setup lang="ts">
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useHashGenerator } from '@/composables/useHashGenerator'

const { compareHash, compareInput, compareResult } = useHashGenerator()
</script>

<template>
  <div class="compare-section">
    <div class="field">
      <label for="compareHash">Expected Hash</label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-check-circle"></i>
        </InputGroupAddon>
        <InputText id="compareHash" v-model="compareHash" placeholder="Enter expected hash value" />
      </InputGroup>
    </div>

    <div class="field">
      <label for="compareInput">Calculated Hash</label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-calculator"></i>
        </InputGroupAddon>
        <InputText id="compareInput" v-model="compareInput" placeholder="Enter hash to compare" />
      </InputGroup>
    </div>

    <Transition name="fade-slide">
      <div v-if="compareResult !== null" class="compare-result">
        <Message v-if="compareResult" severity="success" :closable="false">
          <div class="message-content">
            <i class="pi pi-check-circle"></i>
            <span>Hashes match!</span>
          </div>
        </Message>
        <Message v-else severity="error" :closable="false">
          <div class="message-content">
            <i class="pi pi-times-circle"></i>
            <span>Hashes do not match</span>
          </div>
        </Message>
      </div>
    </Transition>

    <SectionDivider />

    <div class="compare-hint">
      <i class="pi pi-info-circle"></i>
      <span>
        Paste two hash values to compare them. Comparison is case-insensitive and ignores
        leading/trailing whitespace.
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.compare-section {
  max-width: 600px;
}

.field {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
}

.compare-result {
  margin-bottom: 1rem;
}

.compare-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-color);
    margin-top: 0.1rem;
  }
}
</style>
