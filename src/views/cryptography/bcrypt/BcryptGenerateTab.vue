<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useBcryptGenerator, useBcryptOverlay } from '@/composables/useBcryptGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showError, showInfo } = useClipboardToast()

const {
  generateState,
  hashedValue,
  isComputing,
  computeTime,
  roundInfo,
  passwordStrength,
  cancelComputation,
  setOnError,
  setOnCancelled,
  setOnComputeStart,
  setOnComputeEnd,
} = useBcryptGenerator()

const overlay = useBcryptOverlay()

// Connect overlay to bcrypt generator
setOnComputeStart((isHighCost: boolean) => {
  if (isHighCost) {
    overlay.show()
  }
})

setOnComputeEnd(() => {
  overlay.hide()
})

// Set up callbacks for UI notifications
setOnError((message: string) => {
  showError('Error', message)
})

setOnCancelled(() => {
  showInfo('Cancelled', 'Computation was cancelled')
})
</script>

<template>
  <div class="generate-section">
    <div class="field">
      <label for="password">
        <i class="pi pi-key"></i>
        Password
      </label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-lock"></i>
        </InputGroupAddon>
        <InputText
          id="password"
          v-model="generateState.password"
          type="text"
          class="w-full"
          placeholder="Enter password to hash"
        />
        <InputGroupAddon v-if="passwordStrength">
          <Tag :value="passwordStrength.label" :severity="passwordStrength.severity" />
        </InputGroupAddon>
      </InputGroup>
    </div>

    <div class="field">
      <div class="rounds-header">
        <label for="rounds">
          <i class="pi pi-cog"></i>
          Cost Factor (Rounds)
        </label>
        <div class="rounds-info">
          <Tag :value="`${generateState.rounds} rounds`" severity="secondary" />
          <Tag :value="roundInfo.time" severity="info" />
          <Tag :value="roundInfo.security" :severity="roundInfo.severity" />
        </div>
      </div>
      <div class="rounds-control">
        <InputNumber id="rounds" v-model="generateState.rounds" :min="4" :max="20" show-buttons />
      </div>
      <small class="hint-text">
        <i class="pi pi-info-circle"></i>
        Higher cost = more secure but slower. Recommended: 10-12 for most applications.
      </small>
    </div>

    <SectionDivider icon="hashtag">Generated Hash</SectionDivider>

    <div class="hash-output">
      <div v-if="isComputing && !overlay.showOverlay.value" class="computing-state">
        <ProgressSpinner style="width: 30px; height: 30px" stroke-width="4" />
        <span>Computing hash...</span>
      </div>
      <div v-else-if="hashedValue" class="hash-result">
        <code class="hash-value">{{ hashedValue }}</code>
        <div class="hash-meta">
          <Tag
            v-if="computeTime !== null"
            :value="`${computeTime}ms`"
            severity="info"
            icon="pi pi-clock"
          />
          <Tag value="60 chars" severity="secondary" />
          <CopyButton :value="hashedValue" label="Copy" tooltip="Hash copied to clipboard" />
        </div>
      </div>
      <div v-else class="placeholder-state">
        <i class="pi pi-info-circle"></i>
        <span>Enter a password above to generate hash</span>
      </div>
    </div>

    <!-- Computing Overlay Dialog -->
    <Dialog
      v-model:visible="overlay.showOverlay.value"
      modal
      :closable="false"
      :draggable="false"
      header="Computing BCrypt Hash"
      :style="{ width: '400px' }"
      class="computing-dialog"
    >
      <div class="overlay-content">
        <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
        <div class="overlay-info">
          <p class="overlay-message">Generating hash...</p>
          <div class="overlay-stats">
            <Tag
              :value="`Elapsed: ${overlay.formattedElapsedTime.value}`"
              severity="info"
              icon="pi pi-clock"
            />
            <Tag :value="`${generateState.rounds} rounds`" severity="secondary" />
          </div>
          <p class="overlay-hint">
            <i class="pi pi-info-circle"></i>
            High cost factor operations may take a while
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" severity="danger" @click="cancelComputation" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.generate-section {
  padding: 0.5rem 0;
}

.field {
  margin-bottom: 1.5rem;

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

.rounds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rounds-info {
  display: flex;
  gap: 0.5rem;
}

.rounds-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hash-output {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  min-height: 80px;
}

.computing-state,
.placeholder-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

.hash-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hash-value {
  word-break: break-all;
  font-size: 0.9rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: var(--surface-card);
  color: var(--primary-color);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.hash-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

// Computing overlay styles
.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
}

.overlay-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.overlay-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.overlay-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.overlay-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 0;

  i {
    color: var(--primary-color);
  }
}
</style>
