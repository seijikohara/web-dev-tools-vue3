<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

import { usePasswordGenerator, type PasswordPreset } from '@/composables/usePasswordGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showError } = useClipboardToast()

// Use composable
const {
  length,
  count,
  includeLowercase,
  includeUppercase,
  includeNumbers,
  includeSymbols,
  excludeAmbiguous,
  customChars,
  generatedPasswords,
  characterPool,
  isValid,
  entropy,
  entropyInfo,
  passwordCount,
  allPasswordsAsText,
  generate,
  generateSingle,
  clear: clearAll,
  applyPreset,
} = usePasswordGenerator()

// UI actions with toast notifications
const generatePasswords = () => {
  const success = generate()
  if (!success) {
    showError('Error', 'Please select at least one character type', 3000)
  }
}

const copyPassword = (password: string) => {
  void copy(password, { detail: 'Password copied to clipboard' })
}

const copyAllPasswords = () => {
  void copy(allPasswordsAsText.value, {
    detail: `${passwordCount.value} passwords copied to clipboard`,
  })
}

const generateAndCopySingle = () => {
  if (!isValid.value) {
    showError('Error', 'Please select at least one character type', 3000)
    return
  }

  const password = generateSingle()
  void copy(password, { summary: 'Generated & Copied', detail: password, life: 3000 })
}

const handleApplyPreset = (preset: PasswordPreset) => {
  applyPreset(preset)
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-key"></i>
        <span>Password Generator</span>
      </div>
    </template>
    <template #subtitle> Generate secure random passwords with customizable options </template>
    <template #content>
      <div class="generator-panel">
        <!-- Presets -->
        <div class="presets-section">
          <label>
            <i class="pi pi-bookmark"></i>
            Quick Presets
          </label>
          <div class="preset-buttons">
            <Button label="Simple" severity="secondary" text @click="handleApplyPreset('simple')" />
            <Button label="Strong" severity="success" text @click="handleApplyPreset('strong')" />
            <Button label="PIN" severity="info" text @click="handleApplyPreset('pin')" />
            <Button
              label="Passphrase"
              severity="warn"
              text
              @click="handleApplyPreset('passphrase')"
            />
          </div>
        </div>

        <Divider />

        <!-- Options Grid -->
        <div class="options-grid">
          <div class="option-item">
            <label for="length">
              <i class="pi pi-arrows-h"></i>
              Length
            </label>
            <InputNumber id="length" v-model="length" :min="4" :max="128" show-buttons />
          </div>

          <div class="option-item">
            <label for="count">
              <i class="pi pi-hashtag"></i>
              Count
            </label>
            <InputNumber id="count" v-model="count" :min="1" :max="100" show-buttons />
          </div>
        </div>

        <!-- Character Options -->
        <div class="char-options">
          <div class="char-option">
            <ToggleSwitch v-model="includeLowercase" input-id="lowercase" />
            <label for="lowercase">
              <code>a-z</code>
              <span>Lowercase</span>
            </label>
          </div>

          <div class="char-option">
            <ToggleSwitch v-model="includeUppercase" input-id="uppercase" />
            <label for="uppercase">
              <code>A-Z</code>
              <span>Uppercase</span>
            </label>
          </div>

          <div class="char-option">
            <ToggleSwitch v-model="includeNumbers" input-id="numbers" />
            <label for="numbers">
              <code>0-9</code>
              <span>Numbers</span>
            </label>
          </div>

          <div class="char-option">
            <ToggleSwitch v-model="includeSymbols" input-id="symbols" />
            <label for="symbols">
              <code>!@#$</code>
              <span>Symbols</span>
            </label>
          </div>

          <div class="char-option">
            <ToggleSwitch v-model="excludeAmbiguous" input-id="ambiguous" />
            <label for="ambiguous">
              <code>il1O0</code>
              <span>Exclude Ambiguous</span>
            </label>
          </div>
        </div>

        <!-- Custom Characters -->
        <div class="custom-chars">
          <label for="customChars">
            <i class="pi pi-pencil"></i>
            Custom Characters (optional)
          </label>
          <InputText
            id="customChars"
            v-model="customChars"
            placeholder="Add custom characters to include"
            class="w-full"
          />
        </div>

        <!-- Entropy Info -->
        <div class="entropy-info">
          <Tag :value="`${characterPool.length} chars in pool`" severity="secondary" />
          <Tag :value="`${entropy} bits entropy`" :severity="entropyInfo.severity" />
          <Tag :value="entropyInfo.label" :severity="entropyInfo.severity" />
        </div>

        <!-- Validation Message -->
        <Message v-if="!isValid" severity="warn" :closable="false">
          <div class="message-content">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Please select at least one character type and minimum length of 4</span>
          </div>
        </Message>

        <!-- Action Toolbar -->
        <Toolbar class="action-toolbar">
          <template #start>
            <Button
              label="Generate"
              icon="pi pi-bolt"
              :disabled="!isValid"
              @click="generatePasswords"
            />
            <Button
              v-tooltip.top="'Generate one and copy'"
              label="Quick Copy"
              icon="pi pi-copy"
              severity="secondary"
              :disabled="!isValid"
              @click="generateAndCopySingle"
            />
          </template>
          <template #center>
            <Tag
              v-if="passwordCount > 0"
              :value="`${passwordCount} generated`"
              severity="success"
              icon="pi pi-check-circle"
            />
          </template>
          <template #end>
            <Button
              v-tooltip.top="'Copy All'"
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              :disabled="passwordCount === 0"
              @click="copyAllPasswords"
            />
            <Button
              v-tooltip.top="'Clear All'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="passwordCount === 0"
              @click="clearAll"
            />
          </template>
        </Toolbar>
      </div>

      <!-- Results -->
      <Transition name="fade-slide">
        <div v-if="passwordCount > 0" class="results">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-list"></i>
              Generated Passwords
            </span>
          </Divider>

          <DataTable
            :value="generatedPasswords"
            :paginator="passwordCount > 10"
            :rows="10"
            :rows-per-page-options="[10, 25, 50, 100]"
            striped-rows
            size="small"
            class="password-table"
          >
            <Column field="id" header="#" :header-style="{ width: '60px' }">
              <template #body="slotProps">
                <Tag :value="slotProps.data.id" severity="secondary" />
              </template>
            </Column>
            <Column field="password" header="Password">
              <template #body="slotProps">
                <code class="password-value">{{ slotProps.data.password }}</code>
              </template>
            </Column>
            <Column header="Strength" :header-style="{ width: '120px' }">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.strength.label"
                  :severity="slotProps.data.strength.severity"
                />
              </template>
            </Column>
            <Column :header-style="{ width: '80px' }">
              <template #body="slotProps">
                <Button
                  v-tooltip.top="'Copy'"
                  icon="pi pi-copy"
                  severity="secondary"
                  text
                  rounded
                  @click="copyPassword(slotProps.data.password)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </Transition>
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

.generator-panel {
  background: var(--surface-ground);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.presets-section {
  margin-bottom: 1rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.option-item {
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.char-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 6px;
}

.char-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;

    code {
      background: var(--surface-ground);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: var(--primary-color);
    }
  }
}

.custom-chars {
  margin-bottom: 1rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.entropy-info {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-toolbar {
  background: transparent;
  border: none;
  padding: 0;
  margin-top: 1rem;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-center),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.results {
  margin-top: 1rem;
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

.password-table {
  margin-bottom: 1rem;
}

.password-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
}

// Transitions
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
