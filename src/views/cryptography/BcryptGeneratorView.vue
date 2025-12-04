<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { hashSync, compareSync } from 'bcryptjs'
import { useDebounceFn, useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ProgressSpinner from 'primevue/progressspinner'
import Slider from 'primevue/slider'

const toast = useToast()
const { copy } = useClipboard()

// Estimated time per round (in ms, approximate)
const ROUND_TIME_ESTIMATES: Record<number, { time: string; security: string; severity: string }> = {
  4: { time: '~2ms', security: 'Very Weak', severity: 'danger' },
  5: { time: '~4ms', security: 'Weak', severity: 'danger' },
  6: { time: '~8ms', security: 'Weak', severity: 'danger' },
  7: { time: '~15ms', security: 'Fair', severity: 'warn' },
  8: { time: '~30ms', security: 'Fair', severity: 'warn' },
  9: { time: '~60ms', security: 'Fair', severity: 'warn' },
  10: { time: '~120ms', security: 'Good', severity: 'success' },
  11: { time: '~250ms', security: 'Good', severity: 'success' },
  12: { time: '~500ms', security: 'Strong', severity: 'success' },
  13: { time: '~1s', security: 'Strong', severity: 'success' },
  14: { time: '~2s', security: 'Very Strong', severity: 'info' },
  15: { time: '~4s', security: 'Very Strong', severity: 'info' },
  16: { time: '~8s', security: 'Extreme', severity: 'contrast' },
  17: { time: '~16s', security: 'Extreme', severity: 'contrast' },
  18: { time: '~32s', security: 'Extreme', severity: 'contrast' },
  19: { time: '~1min', security: 'Maximum', severity: 'contrast' },
  20: { time: '~2min', security: 'Maximum', severity: 'contrast' },
}

// Generate Tab State
const generateState = reactive({
  password: '',
  rounds: 10,
})

const hashedValue = ref('')
const isComputing = ref(false)
const computeTime = ref<number | null>(null)

const roundInfo = computed(
  () =>
    ROUND_TIME_ESTIMATES[generateState.rounds] ?? {
      time: 'unknown',
      security: 'Unknown',
      severity: 'secondary',
    },
)

// Debounced hash computation to prevent UI freezing
const computeHash = useDebounceFn(() => {
  if (!generateState.password) {
    hashedValue.value = ''
    computeTime.value = null
    return
  }
  isComputing.value = true
  const startTime = globalThis.performance.now()
  try {
    hashedValue.value = hashSync(generateState.password, generateState.rounds)
    computeTime.value = Math.round(globalThis.performance.now() - startTime)
  } finally {
    isComputing.value = false
  }
}, 500)

// Watch for changes and trigger debounced computation
watch(() => [generateState.password, generateState.rounds], computeHash, { deep: true })

// Copy hash to clipboard
const copyHash = () => {
  if (hashedValue.value) {
    copy(hashedValue.value)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Hash copied to clipboard',
      life: 2000,
    })
  }
}

// Verify Tab State
const verifyState = reactive({
  password: '',
  hash: '',
})

const verifyResult = ref<boolean | null>(null)
const isVerifying = ref(false)

const verifyPassword = () => {
  if (!verifyState.password || !verifyState.hash) {
    verifyResult.value = null
    return
  }

  isVerifying.value = true
  try {
    verifyResult.value = compareSync(verifyState.password, verifyState.hash)
  } catch {
    verifyResult.value = false
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Invalid hash format',
      life: 3000,
    })
  } finally {
    isVerifying.value = false
  }
}

// Watch verify inputs and auto-verify
watch(
  () => [verifyState.password, verifyState.hash],
  () => {
    if (verifyState.password && verifyState.hash) {
      verifyPassword()
    } else {
      verifyResult.value = null
    }
  },
)

// Password strength indicator
const passwordStrength = computed(() => {
  const pwd = generateState.password
  if (!pwd) return null

  const checks = [
    pwd.length >= 8,
    pwd.length >= 12,
    /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
    /\d/.test(pwd),
    /[^a-zA-Z0-9]/.test(pwd),
  ]
  const score = checks.filter(Boolean).length

  if (score <= 1) return { label: 'Weak', severity: 'danger' }
  if (score <= 2) return { label: 'Fair', severity: 'warn' }
  if (score <= 3) return { label: 'Good', severity: 'info' }
  return { label: 'Strong', severity: 'success' }
})
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
      <TabView>
        <TabPanel value="0" header="Generate">
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
                  showButtons
                  buttonLayout="horizontal"
                  incrementButtonIcon="pi pi-plus"
                  decrementButtonIcon="pi pi-minus"
                />
                <Slider v-model="generateState.rounds" :min="4" :max="20" class="flex-grow-1" />
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
              <div v-if="isComputing" class="computing-state">
                <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
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
                  <Button
                    icon="pi pi-copy"
                    label="Copy"
                    severity="secondary"
                    size="small"
                    @click="copyHash"
                  />
                </div>
              </div>
              <div v-else class="placeholder-state">
                <i class="pi pi-info-circle"></i>
                <span>Enter a password above to generate hash</span>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="1" header="Verify">
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
              <div v-if="isVerifying" class="verifying-state">
                <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
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

.flex-grow-1 {
  flex-grow: 1;
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
</style>
