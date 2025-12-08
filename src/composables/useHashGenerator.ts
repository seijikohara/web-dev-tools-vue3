import { ref, computed } from 'vue'
import type CryptoJS from 'crypto-js'
import * as CryptoJSLib from 'crypto-js'

// Types
export type HashMethod = 'md5' | 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512'

export interface HashInfo {
  bits: number
  color: string
}

export interface HashResult {
  method: string
  value: string
  bits: number
  severity: string
}

export interface TextStats {
  chars: number
  bytes: number
}

// Hash function type
type HashFunction = (message: string | CryptoJS.lib.WordArray) => CryptoJS.lib.WordArray

// Constants
export const HASH_FUNCTIONS: Record<HashMethod, HashFunction> = {
  md5: CryptoJSLib.MD5,
  sha1: CryptoJSLib.SHA1,
  sha224: CryptoJSLib.SHA224,
  sha256: CryptoJSLib.SHA256,
  sha384: CryptoJSLib.SHA384,
  sha512: CryptoJSLib.SHA512,
}

export const HASH_INFO: Record<HashMethod, HashInfo> = {
  md5: { bits: 128, color: 'secondary' },
  sha1: { bits: 160, color: 'warn' },
  sha224: { bits: 224, color: 'info' },
  sha256: { bits: 256, color: 'success' },
  sha384: { bits: 384, color: 'info' },
  sha512: { bits: 512, color: 'contrast' },
}

export const HASH_METHODS = Object.keys(HASH_FUNCTIONS) as HashMethod[]

// Pure functions
export const computeHash = (method: HashMethod, value: string): string =>
  HASH_FUNCTIONS[method](value).toString()

export const computeHashFromWordArray = (
  method: HashMethod,
  wordArray: CryptoJS.lib.WordArray,
): string => HASH_FUNCTIONS[method](wordArray).toString()

export const computeAllHashes = (value: string): HashResult[] =>
  HASH_METHODS.map(method => ({
    method: method.toUpperCase(),
    value: computeHash(method, value),
    bits: HASH_INFO[method].bits,
    severity: HASH_INFO[method].color,
  }))

export const computeAllHashesFromWordArray = (wordArray: CryptoJS.lib.WordArray): HashResult[] =>
  HASH_METHODS.map(method => ({
    method: method.toUpperCase(),
    value: computeHashFromWordArray(method, wordArray),
    bits: HASH_INFO[method].bits,
    severity: HASH_INFO[method].color,
  }))

export const compareHashes = (hash1: string, hash2: string): boolean => {
  if (!hash1 || !hash2) return false
  return hash1.toLowerCase().trim() === hash2.toLowerCase().trim()
}

export const getTextStats = (text: string): TextStats => ({
  chars: text.length,
  bytes: new Blob([text]).size,
})

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unit = sizes[i] ?? 'GB'
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${unit}`
}

export const fileToWordArray = async (file: File): Promise<CryptoJS.lib.WordArray> => {
  const arrayBuffer = await file.arrayBuffer()
  return CryptoJSLib.lib.WordArray.create(arrayBuffer as unknown as number[])
}

// Composable
export const useHashGenerator = () => {
  // Text Hash state
  const text = ref('')

  // Text Hash computed
  const hashedValues = computed(() => computeAllHashes(text.value))
  const textStats = computed(() => getTextStats(text.value))

  // File Hash state
  const fileHashedValues = ref<HashResult[]>([])
  const fileName = ref('')
  const fileSize = ref(0)
  const isProcessingFile = ref(false)

  // File Hash computed
  const hasFile = computed(() => fileName.value.length > 0)

  // File Hash actions
  const processFile = async (file: File): Promise<HashResult[]> => {
    const wordArray = await fileToWordArray(file)
    return computeAllHashesFromWordArray(wordArray)
  }

  const setFileInfo = (file: File, hashes: HashResult[]) => {
    fileName.value = file.name
    fileSize.value = file.size
    fileHashedValues.value = hashes
  }

  const clearFile = () => {
    fileName.value = ''
    fileSize.value = 0
    fileHashedValues.value = []
  }

  // Compare state
  const compareHash = ref('')
  const compareInput = ref('')

  // Compare computed
  const compareResult = computed(() => {
    if (!compareHash.value || !compareInput.value) return null
    return compareHashes(compareHash.value, compareInput.value)
  })

  return {
    // Text Hash state
    text,

    // Text Hash computed
    hashedValues,
    textStats,

    // File Hash state
    fileHashedValues,
    fileName,
    fileSize,
    isProcessingFile,

    // File Hash computed
    hasFile,

    // File Hash actions
    processFile,
    setFileInfo,
    clearFile,

    // Compare state
    compareHash,
    compareInput,

    // Compare computed
    compareResult,
  }
}
