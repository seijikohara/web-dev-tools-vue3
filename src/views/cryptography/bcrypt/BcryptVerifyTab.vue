<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useBcryptGenerator, useBcryptOverlay } from '@/composables/useBcryptGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showError, showInfo } = useClipboardToast()

const {
  verifyState,
  verifyResult,
  isVerifying,
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
  <div class="verify-section">
    <div class="field">
      <label for="verify-password">
        <i class="pi pi-key"></i>
        Password
      </label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-lock"></i>
        </InputGroupAddon>
        <InputText
          id="verify-password"
          v-model="verifyState.password"
          type="text"
          class="w-full"
          placeholder="Enter password to verify"
        />
      </InputGroup>
    </div>

    <div class="field">
      <label for="verify-hash">
        <i class="pi pi-hashtag"></i>
        BCrypt Hash
      </label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-shield"></i>
        </InputGroupAddon>
        <InputText
          id="verify-hash"
          v-model="verifyState.hash"
          type="text"
          class="w-full"
          placeholder="Enter BCrypt hash (e.g., $2a$10$...)"
        />
      </InputGroup>
    </div>

    <SectionDivider icon="check-circle">Verification Result</SectionDivider>

    <div class="verify-result">
      <div v-if="isVerifying && !overlay.showOverlay.value" class="verifying-state">
        <ProgressSpinner style="width: 30px; height: 30px" stroke-width="4" />
        <span>Verifying...</span>
      </div>
      <Message v-else-if="verifyResult === true" severity="success" :closable="false">
        <div class="result-content">
          <i class="pi pi-check-circle"></i>
          <span>Password matches the hash!</span>
        </div>
      </Message>
      <Message v-else-if="verifyResult === false" severity="error" :closable="false">
        <div class="result-content">
          <i class="pi pi-times-circle"></i>
          <span>Password does not match the hash</span>
        </div>
      </Message>
      <div v-else class="placeholder-state">
        <i class="pi pi-info-circle"></i>
        <span>Enter password and hash to verify</span>
      </div>
    </div>

    <!-- Computing Overlay Dialog -->
    <Dialog
      v-model:visible="overlay.showOverlay.value"
      modal
      :closable="false"
      :draggable="false"
      header="Verifying Password"
      :style="{ width: '400px' }"
      class="computing-dialog"
    >
      <div class="overlay-content">
        <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
        <div class="overlay-info">
          <p class="overlay-message">Verifying password...</p>
          <div class="overlay-stats">
            <Tag
              :value="`Elapsed: ${overlay.formattedElapsedTime.value}`"
              severity="info"
              icon="pi pi-clock"
            />
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
.verify-section {
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

.verify-result {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  min-height: 80px;
}

.verifying-state,
.placeholder-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
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
