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
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'

import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showSuccess, showError } = useClipboardToast()

// Key algorithm types
type KeyAlgorithm =
  | 'rsa-2048'
  | 'rsa-3072'
  | 'rsa-4096'
  | 'ecdsa-p256'
  | 'ecdsa-p384'
  | 'ecdh-p256'
  | 'ecdh-p384'

interface KeyAlgorithmOption {
  value: KeyAlgorithm
  label: string
  description: string
  security: string
  severity: 'success' | 'info' | 'warn' | 'danger'
  usage: string
}

const ALGORITHM_OPTIONS: KeyAlgorithmOption[] = [
  {
    value: 'rsa-4096',
    label: 'RSA 4096-bit',
    description: 'Traditional RSA, widely compatible.',
    security: 'Very Strong',
    severity: 'success',
    usage: 'Sign & Encrypt',
  },
  {
    value: 'rsa-3072',
    label: 'RSA 3072-bit',
    description: 'RSA with 3072-bit key.',
    security: 'Strong',
    severity: 'success',
    usage: 'Sign & Encrypt',
  },
  {
    value: 'rsa-2048',
    label: 'RSA 2048-bit',
    description: 'RSA with 2048-bit key.',
    security: 'Good',
    severity: 'info',
    usage: 'Sign & Encrypt',
  },
  {
    value: 'ecdsa-p256',
    label: 'ECDSA P-256',
    description: 'Elliptic curve for signing.',
    security: 'Strong',
    severity: 'success',
    usage: 'Sign Only',
  },
  {
    value: 'ecdsa-p384',
    label: 'ECDSA P-384',
    description: 'Elliptic curve P-384 for signing.',
    security: 'Very Strong',
    severity: 'success',
    usage: 'Sign Only',
  },
  {
    value: 'ecdh-p256',
    label: 'ECDH P-256',
    description: 'Elliptic curve for key exchange.',
    security: 'Strong',
    severity: 'success',
    usage: 'Encrypt Only',
  },
  {
    value: 'ecdh-p384',
    label: 'ECDH P-384',
    description: 'Elliptic curve P-384 for key exchange.',
    security: 'Very Strong',
    severity: 'success',
    usage: 'Encrypt Only',
  },
]

// State
const state = reactive({
  algorithm: 'rsa-4096' as KeyAlgorithm,
  name: '',
  email: '',
  comment: '',
})

const generatedKeys = ref<{ publicKey: string; privateKey: string; fingerprint: string } | null>(
  null,
)
const isGenerating = ref(false)
const error = ref<string | null>(null)

// Default algorithm option
const DEFAULT_ALGORITHM: KeyAlgorithmOption = {
  value: 'rsa-4096',
  label: 'RSA 4096-bit',
  description: 'Traditional RSA, widely compatible.',
  security: 'Very Strong',
  severity: 'success',
  usage: 'Sign & Encrypt',
}

// Get selected algorithm info
const selectedAlgorithm = computed((): KeyAlgorithmOption => {
  return ALGORITHM_OPTIONS.find(opt => opt.value === state.algorithm) ?? DEFAULT_ALGORITHM
})

// Validation
const isValid = computed(() => {
  return (
    state.name.trim().length > 0 &&
    state.email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)
  )
})

// User ID string
const userId = computed(() => {
  const parts = [state.name.trim()]
  if (state.comment.trim()) {
    parts.push(`(${state.comment.trim()})`)
  }
  parts.push(`<${state.email.trim()}>`)
  return parts.join(' ')
})

// Generate GPG command
const gpgCommand = computed((): string => {
  // gpg --full-generate-key allows interactive key generation
  return `gpg --full-generate-key`
})

// Generate detailed GPG batch command
const gpgBatchCommand = computed((): string => {
  const keyType = getGpgKeyType()
  const keyLength = getGpgKeyLength()
  const name = state.name.trim() || 'Your Name'
  const email = state.email.trim() || 'your@email.com'
  const comment = state.comment.trim()

  const batchContent = `%echo Generating GPG key
Key-Type: ${keyType}
Key-Length: ${keyLength}
Name-Real: ${name}${comment ? `\nName-Comment: ${comment}` : ''}
Name-Email: ${email}
Expire-Date: 0
%commit
%echo Done`

  return `cat << 'EOF' | gpg --batch --gen-key
${batchContent}
EOF`
})

const getGpgKeyType = (): string => {
  switch (state.algorithm) {
    case 'rsa-2048':
    case 'rsa-3072':
    case 'rsa-4096':
      return 'RSA'
    case 'ecdsa-p256':
    case 'ecdsa-p384':
      return 'ECDSA'
    case 'ecdh-p256':
    case 'ecdh-p384':
      return 'ECDH'
    default:
      return 'RSA'
  }
}

const getGpgKeyLength = (): number => {
  switch (state.algorithm) {
    case 'rsa-2048':
      return 2048
    case 'rsa-3072':
      return 3072
    case 'rsa-4096':
      return 4096
    case 'ecdsa-p256':
    case 'ecdh-p256':
      return 256
    case 'ecdsa-p384':
    case 'ecdh-p384':
      return 384
    default:
      return 4096
  }
}

// Copy GPG command
const copyGpgCommand = () => {
  void copy(gpgCommand.value, { detail: 'GPG command copied to clipboard' })
}

// Copy GPG batch command
const copyGpgBatchCommand = () => {
  void copy(gpgBatchCommand.value, { detail: 'GPG batch command copied to clipboard' })
}

// Convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

// Generate fingerprint from public key
const generateFingerprint = async (publicKeyBuffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  // Format as GPG-style fingerprint (uppercase, space separated every 4 chars)
  return (
    hashHex
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join(' ') ?? hashHex.toUpperCase()
  )
}

// Generate key pair based on algorithm
const generateGpgKeyPair = async (algorithm: string): Promise<CryptoKeyPair> => {
  switch (algorithm) {
    case 'rsa-2048':
      return await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
      )

    case 'rsa-3072':
      return await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 3072,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
      )

    case 'rsa-4096':
      return await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
      )

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

    case 'ecdh-p256':
      return await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
        'deriveKey',
        'deriveBits',
      ])

    case 'ecdh-p384':
      return await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-384' }, true, [
        'deriveKey',
        'deriveBits',
      ])

    default:
      throw new Error('Unsupported algorithm')
  }
}

// Generate GPG-like key pair
const generateKeys = async () => {
  if (!isValid.value) {
    showError('Validation Error', 'Please enter a valid name and email address')
    return
  }

  isGenerating.value = true
  error.value = null
  generatedKeys.value = null

  try {
    const keyPair = await generateGpgKeyPair(state.algorithm)

    // Export keys
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer)
    const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer)

    // Generate fingerprint
    const fingerprint = await generateFingerprint(publicKeyBuffer)

    // Format as PEM (GPG-like armor format)
    const formatArmoredKey = (base64: string, type: 'PUBLIC' | 'PRIVATE'): string => {
      const lines = base64.match(/.{1,64}/g) ?? []
      const header = type === 'PUBLIC' ? 'PGP PUBLIC KEY BLOCK' : 'PGP PRIVATE KEY BLOCK'
      return `-----BEGIN ${header}-----
Version: Web-Dev-Tools GPG Key Generator v1.0
Comment: User-ID: ${userId.value}
Comment: Algorithm: ${selectedAlgorithm.value.label}

${lines.join('\n')}
-----END ${header}-----`
    }

    generatedKeys.value = {
      publicKey: formatArmoredKey(publicKeyBase64, 'PUBLIC'),
      privateKey: formatArmoredKey(privateKeyBase64, 'PRIVATE'),
      fingerprint,
    }

    showSuccess('Generated', 'GPG key pair generated successfully')
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

const copyFingerprint = () => {
  if (generatedKeys.value?.fingerprint) {
    void copy(generatedKeys.value.fingerprint, { detail: 'Fingerprint copied to clipboard' })
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
    const filename = `${state.email.replace('@', '_at_')}_public.asc`
    downloadFile(generatedKeys.value.publicKey, filename)
    showSuccess('Downloaded', `Public key saved as ${filename}`)
  }
}

const downloadPrivateKey = () => {
  if (generatedKeys.value?.privateKey) {
    const filename = `${state.email.replace('@', '_at_')}_private.asc`
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
        <i class="pi pi-shield"></i>
        <span>GPG Key Generator</span>
      </div>
    </template>
    <template #subtitle> Generate GPG/PGP key pairs for encryption and signing </template>
    <template #content>
      <div class="generator-panel">
        <!-- User Information -->
        <div class="section-header">
          <i class="pi pi-user"></i>
          <span>User Information</span>
        </div>

        <div class="field">
          <label for="name">
            <i class="pi pi-user"></i>
            Full Name <span class="required">*</span>
          </label>
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-user"></i>
            </InputGroupAddon>
            <InputText id="name" v-model="state.name" class="w-full" placeholder="John Doe" />
          </InputGroup>
        </div>

        <div class="field">
          <label for="email">
            <i class="pi pi-envelope"></i>
            Email Address <span class="required">*</span>
          </label>
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-envelope"></i>
            </InputGroupAddon>
            <InputText
              id="email"
              v-model="state.email"
              type="email"
              class="w-full"
              placeholder="john@example.com"
            />
          </InputGroup>
        </div>

        <div class="field">
          <label for="comment">
            <i class="pi pi-comment"></i>
            Comment (optional)
          </label>
          <InputText
            id="comment"
            v-model="state.comment"
            class="w-full"
            placeholder="e.g., Work Key, Personal Key"
          />
        </div>

        <!-- User ID Preview -->
        <div v-if="state.name || state.email" class="user-id-preview">
          <Tag value="User ID" severity="secondary" />
          <code>{{ userId || '(Enter name and email)' }}</code>
        </div>

        <Divider />

        <!-- Algorithm Selection -->
        <div class="section-header">
          <i class="pi pi-cog"></i>
          <span>Key Settings</span>
        </div>

        <div class="field">
          <label for="algorithm">
            <i class="pi pi-sliders-h"></i>
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
                  <div class="algorithm-tags">
                    <Tag :value="slotProps.option.usage" severity="info" />
                    <Tag :value="slotProps.option.security" :severity="slotProps.option.severity" />
                  </div>
                </div>
                <span class="algorithm-description">{{ slotProps.option.description }}</span>
              </div>
            </template>
          </Select>
          <div class="algorithm-info">
            <Tag :value="selectedAlgorithm.usage" severity="info" />
            <Tag :value="selectedAlgorithm.security" :severity="selectedAlgorithm.severity" />
            <span class="algorithm-desc">{{ selectedAlgorithm.description }}</span>
          </div>
        </div>

        <!-- Generate Button -->
        <div class="action-section">
          <Button
            label="Generate Key Pair"
            icon="pi pi-bolt"
            :loading="isGenerating"
            :disabled="isGenerating || !isValid"
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

        <!-- Validation Message -->
        <Message v-if="!isValid && (state.name || state.email)" severity="warn" :closable="false">
          <div class="message-content">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Please enter a valid name and email address</span>
          </div>
        </Message>

        <!-- Error Message -->
        <Message v-if="error" severity="error" :closable="false" class="error-message">
          <div class="message-content">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
        </Message>

        <!-- Info Message -->
        <Message severity="info" :closable="false" class="info-message">
          <div class="message-content">
            <i class="pi pi-info-circle"></i>
            <span>Keys are generated entirely in your browser. No data is sent to any server.</span>
          </div>
        </Message>

        <!-- Equivalent Commands -->
        <Divider align="left">
          <span class="divider-text">
            <i class="pi pi-terminal"></i>
            Equivalent Commands (Recommended)
          </span>
        </Divider>

        <div class="command-section">
          <Message severity="warn" :closable="false" class="command-notice">
            <div class="message-content">
              <i class="pi pi-info-circle"></i>
              <span>For production use, we recommend using the native GPG command:</span>
            </div>
          </Message>

          <div class="command-group">
            <div class="command-label">
              <Tag value="Interactive" severity="info" />
              <span>Simple interactive key generation</span>
            </div>
            <div class="command-container">
              <code class="command-code">{{ gpgCommand }}</code>
              <Button
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                v-tooltip.top="'Copy command'"
                @click="copyGpgCommand"
              />
            </div>
          </div>

          <div class="command-group">
            <div class="command-label">
              <Tag value="Batch" severity="secondary" />
              <span>Non-interactive batch mode (with current settings)</span>
            </div>
            <div class="command-container batch-command">
              <code class="command-code">{{ gpgBatchCommand }}</code>
              <Button
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                v-tooltip.top="'Copy command'"
                @click="copyGpgBatchCommand"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Generated Keys -->
      <Transition name="fade-slide">
        <div v-if="generatedKeys" class="keys-section">
          <!-- Fingerprint -->
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-id-card"></i>
              Key Fingerprint
            </span>
          </Divider>

          <div class="fingerprint-container">
            <code class="fingerprint">{{ generatedKeys.fingerprint }}</code>
            <Button icon="pi pi-copy" severity="secondary" text rounded @click="copyFingerprint" />
          </div>

          <!-- Public Key -->
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
              rows="8"
              class="key-textarea"
            />
            <div class="key-actions">
              <Tag value="Share this key to receive encrypted messages" severity="secondary" />
              <Button icon="pi pi-copy" label="Copy" severity="secondary" @click="copyPublicKey" />
              <Button
                icon="pi pi-download"
                label="Download"
                severity="secondary"
                @click="downloadPublicKey"
              />
            </div>
          </div>

          <!-- Private Key -->
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
              rows="10"
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
              <span>Import the private key: <code>gpg --import private.asc</code></span>
            </div>
            <div class="instruction-item">
              <Tag value="2" severity="info" rounded />
              <span>Import the public key: <code>gpg --import public.asc</code></span>
            </div>
            <div class="instruction-item">
              <Tag value="3" severity="info" rounded />
              <span>List your keys: <code>gpg --list-keys</code></span>
            </div>
            <div class="instruction-item">
              <Tag value="4" severity="info" rounded />
              <span>Sign a file: <code>gpg --sign file.txt</code></span>
            </div>
            <div class="instruction-item">
              <Tag value="5" severity="info" rounded />
              <span
                >Encrypt for recipient:
                <code>gpg --encrypt --recipient email@example.com file.txt</code></span
              >
            </div>
          </div>

          <!-- Note about Web Crypto -->
          <Message severity="info" :closable="false" class="note-message">
            <div class="message-content">
              <i class="pi pi-info-circle"></i>
              <span>
                Note: These keys are generated using Web Crypto API and may not be directly
                compatible with GPG/PGP software. For full GPG compatibility, consider using the
                command line: <code>gpg --full-generate-key</code>
              </span>
            </div>
          </Message>
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

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);

  i {
    color: var(--primary-color);
  }
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

    .required {
      color: var(--red-500);
    }
  }
}

.user-id-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-card);
  border-radius: 6px;
  margin-bottom: 1rem;

  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    color: var(--primary-color);
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

.algorithm-tags {
  display: flex;
  gap: 0.25rem;
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
  flex-wrap: wrap;
}

.algorithm-desc {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
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
  flex-wrap: wrap;

  code {
    background: var(--surface-ground);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
}

.error-message,
.info-message,
.warning-message,
.note-message {
  margin-top: 1rem;
}

.command-section {
  margin-top: 1rem;
}

.command-notice {
  margin-bottom: 0.75rem;
}

.command-group {
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.command-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.command-container {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;

  &.batch-command {
    .command-code {
      white-space: pre-wrap;
    }
  }
}

.command-code {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
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

.fingerprint-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.fingerprint {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  word-break: break-all;
}

.key-container {
  margin-bottom: 1.5rem;
}

.key-textarea {
  width: 100%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
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
  margin-bottom: 1rem;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

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
