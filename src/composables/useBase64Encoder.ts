import { ref, computed, watch } from 'vue'

// Types
export type EncodingMode = 'encode' | 'decode'

export interface EncodingModeOption {
  label: string
  value: EncodingMode
  icon: string
}

export interface InputStats {
  chars: number
  bytes: number
}

export interface OutputStats {
  chars: number
  ratio: string
}

export interface Base64InputStats {
  chars: number
  valid: boolean
}

export interface FileInfo {
  name: string
  mimeType: string
  size: number
  base64: string
}

// Constants
export const ENCODING_MODE_OPTIONS: EncodingModeOption[] = [
  { label: 'Encode', value: 'encode', icon: 'pi pi-lock' },
  { label: 'Decode', value: 'decode', icon: 'pi pi-unlock' },
]

export const SAMPLE_TEXT = 'Hello World! こんにちは 你好 🌍'

// Pure functions
export const encodeToBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return globalThis.btoa(binary)
}

export const decodeFromBase64 = (base64: string): string => {
  const binary = globalThis.atob(base64)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export const getInputStats = (text: string): InputStats | null => {
  if (!text) return null
  return {
    chars: text.length,
    bytes: new TextEncoder().encode(text).length,
  }
}

export const getOutputStats = (input: string, output: string): OutputStats | null => {
  if (!output) return null
  const inputBytes = input ? new TextEncoder().encode(input).length : 0
  const outputBytes = output.length
  return {
    chars: output.length,
    ratio: inputBytes > 0 ? ((outputBytes / inputBytes) * 100).toFixed(0) : '0',
  }
}

export const getBase64InputStats = (base64: string): Base64InputStats | null => {
  if (!base64) return null
  return {
    chars: base64.length,
    valid: /^[A-Za-z0-9+/]*={0,2}$/.test(base64.trim()),
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unit = sizes[i] ?? 'GB'
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${unit}`
}

export const createDataUrl = (base64: string, mimeType: string): string => {
  if (!base64 || !mimeType) return ''
  return `data:${mimeType};base64,${base64}`
}

export const isImageMimeType = (mimeType: string): boolean => mimeType.startsWith('image/')

export const base64ToBlob = (base64: string): Blob => {
  const byteCharacters = globalThis.atob(base64.trim())
  const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0))
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray])
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Composable
export const useBase64Encoder = () => {
  // Text encode/decode state
  const inputText = ref('')
  const outputText = ref('')
  const encodeError = ref('')
  const encodingMode = ref<EncodingMode>('encode')

  // Auto-encode/decode when input changes
  watch([inputText, encodingMode], () => {
    encodeError.value = ''
    if (!inputText.value) {
      outputText.value = ''
      return
    }

    try {
      outputText.value =
        encodingMode.value === 'encode'
          ? encodeToBase64(inputText.value)
          : decodeFromBase64(inputText.value)
    } catch {
      encodeError.value =
        encodingMode.value === 'encode' ? 'Failed to encode text' : 'Invalid Base64 string'
      outputText.value = ''
    }
  })

  // Computed stats
  const inputStats = computed(() => getInputStats(inputText.value))
  const outputStats = computed(() => getOutputStats(inputText.value, outputText.value))

  // Text actions
  const loadSample = () => {
    inputText.value = SAMPLE_TEXT
    encodingMode.value = 'encode'
  }

  const clearAll = () => {
    inputText.value = ''
    outputText.value = ''
    encodeError.value = ''
  }

  // File state
  const fileBase64 = ref('')
  const fileName = ref('')
  const fileMimeType = ref('')
  const fileSize = ref(0)
  const isProcessingFile = ref(false)

  // File computed
  const dataUrl = computed(() => createDataUrl(fileBase64.value, fileMimeType.value))
  const isImage = computed(() => isImageMimeType(fileMimeType.value))

  // File actions
  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1] ?? result)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const setFileInfo = (file: File, base64: string) => {
    fileName.value = file.name
    fileMimeType.value = file.type
    fileSize.value = file.size
    fileBase64.value = base64
  }

  const clearFile = () => {
    fileBase64.value = ''
    fileName.value = ''
    fileMimeType.value = ''
    fileSize.value = 0
  }

  // Decode to file state
  const base64Input = ref('')
  const decodedFileName = ref('decoded-file')
  const decodeError = ref('')

  // Decode computed
  const base64InputStats = computed(() => getBase64InputStats(base64Input.value))

  // Decode actions
  const downloadDecodedFile = (): boolean => {
    decodeError.value = ''
    try {
      const blob = base64ToBlob(base64Input.value)
      downloadBlob(blob, decodedFileName.value)
      return true
    } catch {
      decodeError.value = 'Invalid Base64 string'
      return false
    }
  }

  const clearBase64Input = () => {
    base64Input.value = ''
    decodeError.value = ''
  }

  return {
    // Text encode/decode state
    inputText,
    outputText,
    encodeError,
    encodingMode,

    // Text computed
    inputStats,
    outputStats,

    // Text actions
    loadSample,
    clearAll,

    // File state
    fileBase64,
    fileName,
    fileMimeType,
    fileSize,
    isProcessingFile,

    // File computed
    dataUrl,
    isImage,

    // File actions
    processFile,
    setFileInfo,
    clearFile,

    // Decode to file state
    base64Input,
    decodedFileName,
    decodeError,

    // Decode computed
    base64InputStats,

    // Decode actions
    downloadDecodedFile,
    clearBase64Input,
  }
}
