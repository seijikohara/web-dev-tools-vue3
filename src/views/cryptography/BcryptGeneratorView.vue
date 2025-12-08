<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

import { useBcryptGenerator, useBcryptOverlay } from '@/composables/useBcryptGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showError, showInfo } = useClipboardToast()

// Use composables
const {
  // Generate state
  generateState,
  hashedValue,
  isComputing,
  computeTime,

  // Verify state
  verifyState,
  verifyResult,
  isVerifying,

  // Computed
  roundInfo,
  passwordStrength,

  // Actions
  cancelComputation,

  // Callback setters
  setOnError,
  setOnCancelled,
  setOnComputeStart,
  setOnComputeEnd,
} = useBcryptGenerator()

// UI overlay state (separated from core logic)
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

// Copy hash to clipboard
const copyHash = () => {
  if (hashedValue.value) {
    void copy(hashedValue.value, { detail: 'Hash copied to clipboard' })
  }
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-lock"></i>
        <span>BCrypt Generator</span>
      </div>
    </template>
    <template #subtitle> Generate and verify BCrypt password hashes </template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Generate</Tab>
          <Tab value="1">Verify</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
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
                  <InputNumber
                    id="rounds"
                    v-model="generateState.rounds"
                    :min="4"
                    :max="20"
                    show-buttons
                  />
                </div>
                <small class="hint-text">
                  <i class="pi pi-info-circle"></i>
                  Higher cost = more secure but slower. Recommended: 10-12 for most applications.
                </small>
              </div>

              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-hashtag"></i>
                  Generated Hash
                </span>
              </Divider>

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
                    <Button icon="pi pi-copy" label="Copy" severity="secondary" @click="copyHash" />
                  </div>
                </div>
                <div v-else class="placeholder-state">
                  <i class="pi pi-info-circle"></i>
                  <span>Enter a password above to generate hash</span>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="1">
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

              <Divider align="left">
                <span class="divider-text">
                  <i class="pi pi-check-circle"></i>
                  Verification Result
                </span>
              </Divider>

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
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

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
            <p class="overlay-message">
              {{ isVerifying ? 'Verifying password...' : 'Generating hash...' }}
            </p>
            <div class="overlay-stats">
              <Tag
                :value="`Elapsed: ${overlay.formattedElapsedTime.value}`"
                severity="info"
                icon="pi pi-clock"
              />
              <Tag
                v-if="!isVerifying"
                :value="`${generateState.rounds} rounds`"
                severity="secondary"
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

.generate-section,
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

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;

  i {
    color: var(--primary-color);
  }
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

.hash-output,
.verify-result {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  min-height: 80px;
}

.computing-state,
.verifying-state,
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
