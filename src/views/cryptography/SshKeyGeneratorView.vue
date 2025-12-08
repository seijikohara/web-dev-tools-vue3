<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import Textarea from 'primevue/textarea'

import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showSuccess, showError } = useClipboardToast()

// Key algorithm types
type KeyAlgorithm = 'ed25519' | 'ecdsa-p256' | 'ecdsa-p384' | 'rsa-2048' | 'rsa-3072' | 'rsa-4096'

interface KeyAlgorithmOption {
  value: KeyAlgorithm
  label: string
  description: string
  security: string
  severity: 'success' | 'info' | 'warn' | 'danger'
}

const ALGORITHM_OPTIONS: KeyAlgorithmOption[] = [
  {
    value: 'ed25519',
    label: 'Ed25519',
    description: 'Modern, fast, and secure. Recommended for most use cases.',
    security: 'Very Strong',
    severity: 'success',
  },
  {
    value: 'ecdsa-p256',
    label: 'ECDSA P-256',
    description: 'Elliptic curve with NIST P-256 curve.',
    security: 'Strong',
    severity: 'success',
  },
  {
    value: 'ecdsa-p384',
    label: 'ECDSA P-384',
    description: 'Elliptic curve with NIST P-384 curve.',
    security: 'Very Strong',
    severity: 'success',
  },
  {
    value: 'rsa-2048',
    label: 'RSA 2048-bit',
    description: 'Traditional RSA with 2048-bit key.',
    security: 'Good',
    severity: 'info',
  },
  {
    value: 'rsa-3072',
    label: 'RSA 3072-bit',
    description: 'RSA with 3072-bit key for enhanced security.',
    security: 'Strong',
    severity: 'success',
  },
  {
    value: 'rsa-4096',
    label: 'RSA 4096-bit',
    description: 'RSA with 4096-bit key for maximum compatibility.',
    security: 'Very Strong',
    severity: 'success',
  },
]

// State
const state = reactive({
  algorithm: 'ed25519' as KeyAlgorithm,
  comment: '',
})

const generatedKeys = ref<{ publicKey: string; privateKey: string } | null>(null)
const isGenerating = ref(false)
const error = ref<string | null>(null)

// Default algorithm option
const DEFAULT_ALGORITHM: KeyAlgorithmOption = {
  value: 'ed25519',
  label: 'Ed25519',
  description: 'Modern, fast, and secure. Recommended for most use cases.',
  security: 'Very Strong',
  severity: 'success',
}

// Get selected algorithm info
const selectedAlgorithm = computed((): KeyAlgorithmOption => {
  return ALGORITHM_OPTIONS.find(opt => opt.value === state.algorithm) ?? DEFAULT_ALGORITHM
})

// Generate ssh-keygen command
const sshKeygenCommand = computed((): string => {
  const comment = state.comment || 'your_email@example.com'
  const filename = `~/.ssh/id_${state.algorithm.replace('-', '_')}`

  switch (state.algorithm) {
    case 'ed25519':
      return `ssh-keygen -t ed25519 -C "${comment}" -f ${filename}`
    case 'ecdsa-p256':
      return `ssh-keygen -t ecdsa -b 256 -C "${comment}" -f ${filename.replace('ecdsa_p256', 'ecdsa')}`
    case 'ecdsa-p384':
      return `ssh-keygen -t ecdsa -b 384 -C "${comment}" -f ${filename.replace('ecdsa_p384', 'ecdsa')}`
    case 'rsa-2048':
      return `ssh-keygen -t rsa -b 2048 -C "${comment}" -f ${filename.replace('rsa_2048', 'rsa')}`
    case 'rsa-3072':
      return `ssh-keygen -t rsa -b 3072 -C "${comment}" -f ${filename.replace('rsa_3072', 'rsa')}`
    case 'rsa-4096':
      return `ssh-keygen -t rsa -b 4096 -C "${comment}" -f ${filename.replace('rsa_4096', 'rsa')}`
    default:
      return `ssh-keygen -t ed25519 -C "${comment}"`
  }
})

// Copy ssh-keygen command
const copySshKeygenCommand = () => {
  void copy(sshKeygenCommand.value, { detail: 'ssh-keygen command copied to clipboard' })
}

// Convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

// Generate key pair based on algorithm
const generateKeyPair = async (algorithm: string): Promise<CryptoKeyPair> => {
  switch (algorithm) {
    case 'ed25519':
      try {
        return await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
      } catch {
        throw new Error('Ed25519 is not supported in this browser. Please try ECDSA or RSA.')
      }

    case 'ecdsa-p256':
      return await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
        'sign',
        'verify',
      ])

    case 'ecdsa-p384':
      return await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, [
        'sign',
        'verify',
      ])

    case 'rsa-2048':
      return await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      )

    case 'rsa-3072':
      return await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 3072,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      )

    case 'rsa-4096':
      return await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      )

    default:
      throw new Error('Unsupported algorithm')
  }
}

// Generate SSH key pair
const generateKeys = async () => {
  isGenerating.value = true
  error.value = null
  generatedKeys.value = null

  try {
    const keyPair = await generateKeyPair(state.algorithm)

    // Export keys
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer)
    const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer)

    // Format as PEM
    const formatPem = (base64: string, type: 'PUBLIC' | 'PRIVATE'): string => {
      const lines = base64.match(/.{1,64}/g) ?? []
      return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`
    }

    // Format public key in OpenSSH format
    const formatOpenSshPublicKey = (base64: string): string => {
      const keyType = getOpenSshKeyType()
      const comment = state.comment || 'generated@web-dev-tools'
      return `${keyType} ${base64} ${comment}`
    }

    const getOpenSshKeyType = (): string => {
      switch (state.algorithm) {
        case 'ed25519':
          return 'ssh-ed25519'
        case 'ecdsa-p256':
          return 'ecdsa-sha2-nistp256'
        case 'ecdsa-p384':
          return 'ecdsa-sha2-nistp384'
        case 'rsa-2048':
        case 'rsa-3072':
        case 'rsa-4096':
          return 'ssh-rsa'
        default:
          return 'ssh-rsa'
      }
    }

    generatedKeys.value = {
      publicKey: formatOpenSshPublicKey(publicKeyBase64),
      privateKey: formatPem(privateKeyBase64, 'PRIVATE'),
    }

    showSuccess('Generated', 'SSH key pair generated successfully')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to generate keys'
    showError('Error', error.value)
  } finally {
    isGenerating.value = false
  }
}

// Copy functions
const copyPublicKey = () => {
  if (generatedKeys.value?.publicKey) {
    void copy(generatedKeys.value.publicKey, { detail: 'Public key copied to clipboard' })
  }
}

const copyPrivateKey = () => {
  if (generatedKeys.value?.privateKey) {
    void copy(generatedKeys.value.privateKey, { detail: 'Private key copied to clipboard' })
  }
}

// Download functions
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadPublicKey = () => {
  if (generatedKeys.value?.publicKey) {
    const filename = `id_${state.algorithm.replace('-', '_')}.pub`
    downloadFile(generatedKeys.value.publicKey, filename)
    showSuccess('Downloaded', `Public key saved as ${filename}`)
  }
}

const downloadPrivateKey = () => {
  if (generatedKeys.value?.privateKey) {
    const filename = `id_${state.algorithm.replace('-', '_')}`
    downloadFile(generatedKeys.value.privateKey, filename)
    showSuccess('Downloaded', `Private key saved as ${filename}`)
  }
}

// Clear generated keys
const clearKeys = () => {
  generatedKeys.value = null
  error.value = null
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-key"></i>
        <span>SSH Key Generator</span>
      </div>
    </template>
    <template #subtitle> Generate SSH key pairs using Web Crypto API </template>
    <template #content>
      <div class="generator-panel">
        <!-- Algorithm Selection -->
        <div class="field">
          <label for="algorithm">
            <i class="pi pi-cog"></i>
            Algorithm
          </label>
          <Select
            id="algorithm"
            v-model="state.algorithm"
            :options="ALGORITHM_OPTIONS"
            option-value="value"
            option-label="label"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="algorithm-option">
                <div class="algorithm-header">
                  <span class="algorithm-label">{{ slotProps.option.label }}</span>
                  <Tag :value="slotProps.option.security" :severity="slotProps.option.severity" />
                </div>
                <span class="algorithm-description">{{ slotProps.option.description }}</span>
              </div>
            </template>
          </Select>
          <div class="algorithm-info">
            <Tag :value="selectedAlgorithm.security" :severity="selectedAlgorithm.severity" />
            <span class="algorithm-desc">{{ selectedAlgorithm.description }}</span>
          </div>
        </div>

        <!-- Comment -->
        <div class="field">
          <label for="comment">
            <i class="pi pi-comment"></i>
            Comment (optional)
          </label>
          <InputText
            id="comment"
            v-model="state.comment"
            class="w-full"
            placeholder="e.g., user@hostname or your email"
          />
          <small class="hint-text">
            <i class="pi pi-info-circle"></i>
            A comment to identify this key (usually email or user@host)
          </small>
        </div>

        <!-- Generate Button -->
        <div class="action-section">
          <Button
            label="Generate Key Pair"
            icon="pi pi-bolt"
            :loading="isGenerating"
            :disabled="isGenerating"
            @click="generateKeys"
          />
          <Button
            v-if="generatedKeys"
            label="Clear"
            icon="pi pi-trash"
            severity="secondary"
            @click="clearKeys"
          />
        </div>

        <!-- Error Message -->
        <Message v-if="error" severity="error" :closable="false" class="error-message">
          <div class="message-content">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
        </Message>

        <!-- Browser Compatibility Warning -->
        <Message severity="info" :closable="false" class="info-message">
          <div class="message-content">
            <i class="pi pi-info-circle"></i>
            <span
              >Keys are generated entirely in your browser using Web Crypto API. No data is sent to
              any server.</span
            >
          </div>
        </Message>

        <!-- Equivalent Command -->
        <Divider align="left">
          <span class="divider-text">
            <i class="pi pi-terminal"></i>
            Equivalent Command (Recommended)
          </span>
        </Divider>

        <div class="command-section">
          <Message severity="warn" :closable="false" class="command-notice">
            <div class="message-content">
              <i class="pi pi-info-circle"></i>
              <span>For production use, we recommend using the native ssh-keygen command:</span>
            </div>
          </Message>
          <div class="command-container">
            <code class="command-code">{{ sshKeygenCommand }}</code>
            <Button
              icon="pi pi-copy"
              severity="secondary"
              text
              rounded
              v-tooltip.top="'Copy command'"
              @click="copySshKeygenCommand"
            />
          </div>
        </div>
      </div>

      <!-- Generated Keys -->
      <Transition name="fade-slide">
        <div v-if="generatedKeys" class="keys-section">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-lock-open"></i>
              Public Key
            </span>
          </Divider>

          <div class="key-container">
            <Textarea
              :model-value="generatedKeys.publicKey"
              readonly
              auto-resize
              rows="3"
              class="key-textarea"
            />
            <div class="key-actions">
              <Tag value="Add to authorized_keys" severity="secondary" />
              <Button icon="pi pi-copy" label="Copy" severity="secondary" @click="copyPublicKey" />
              <Button
                icon="pi pi-download"
                label="Download"
                severity="secondary"
                @click="downloadPublicKey"
              />
            </div>
          </div>

          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-lock"></i>
              Private Key
            </span>
          </Divider>

          <div class="key-container">
            <Message severity="warn" :closable="false" class="warning-message">
              <div class="message-content">
                <i class="pi pi-exclamation-triangle"></i>
                <span>Keep this private key secure! Never share it with anyone.</span>
              </div>
            </Message>
            <Textarea
              :model-value="generatedKeys.privateKey"
              readonly
              auto-resize
              rows="5"
              class="key-textarea private-key"
            />
            <div class="key-actions">
              <Tag value="Keep secure - never share!" severity="warn" />
              <Button icon="pi pi-copy" label="Copy" severity="secondary" @click="copyPrivateKey" />
              <Button
                icon="pi pi-download"
                label="Download"
                severity="secondary"
                @click="downloadPrivateKey"
              />
            </div>
          </div>

          <!-- Usage Instructions -->
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-book"></i>
              Usage Instructions
            </span>
          </Divider>

          <div class="usage-instructions">
            <div class="instruction-item">
              <Tag value="1" severity="info" rounded />
              <span
                >Save the private key to
                <code>~/.ssh/id_{{ state.algorithm.replace('-', '_') }}</code></span
              >
            </div>
            <div class="instruction-item">
              <Tag value="2" severity="info" rounded />
              <span
                >Set permissions:
                <code>chmod 600 ~/.ssh/id_{{ state.algorithm.replace('-', '_') }}</code></span
              >
            </div>
            <div class="instruction-item">
              <Tag value="3" severity="info" rounded />
              <span
                >Copy the public key to the remote server's
                <code>~/.ssh/authorized_keys</code></span
              >
            </div>
            <div class="instruction-item">
              <Tag value="4" severity="info" rounded />
              <span
                >Or use:
                <code
                  >ssh-copy-id -i ~/.ssh/id_{{ state.algorithm.replace('-', '_') }}.pub
                  user@host</code
                ></span
              >
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="isGenerating" class="loading-state">
        <ProgressSpinner style="width: 40px; height: 40px" stroke-width="4" />
        <span>Generating key pair...</span>
      </div>
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

.algorithm-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem 0;
}

.algorithm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.algorithm-label {
  font-weight: 600;
}

.algorithm-description {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.algorithm-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.algorithm-desc {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
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

.action-section {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message,
.info-message,
.warning-message {
  margin-top: 1rem;
}

.command-section {
  margin-top: 1rem;
}

.command-notice {
  margin-bottom: 0.75rem;
}

.command-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
}

.command-code {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  word-break: break-all;
}

.keys-section {
  margin-top: 1.5rem;
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

.key-container {
  margin-bottom: 1.5rem;
}

.key-textarea {
  width: 100%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.private-key {
  color: var(--orange-500);
}

.key-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.usage-instructions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  code {
    background: var(--surface-card);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--primary-color);
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-color-secondary);
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
