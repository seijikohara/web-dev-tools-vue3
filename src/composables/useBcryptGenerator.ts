import { ref, computed, reactive, watch, onUnmounted, getCurrentInstance } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import BcryptWorker from '@/workers/bcrypt.worker?worker'
import type { BcryptWorkerMessage, BcryptWorkerResponse } from '@/types/workers'

// Types
export interface RoundInfo {
  time: string
  security: string
  severity: string
}

export interface PasswordStrength {
  label: string
  severity: string
}

export interface GenerateState {
  password: string
  rounds: number
}

export interface VerifyState {
  password: string
  hash: string
}

export interface BcryptCallbacks {
  onError?: (message: string) => void
  onCancelled?: () => void
  onHashComplete?: (hash: string, computeTime: number) => void
  onVerifyComplete?: (result: boolean) => void
}

// Constants
export const ROUND_TIME_ESTIMATES: Record<number, RoundInfo> = {
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

export const DEFAULT_ROUND_INFO: RoundInfo = {
  time: 'unknown',
  security: 'Unknown',
  severity: 'secondary',
}

export const MIN_ROUNDS = 4
export const MAX_ROUNDS = 20
export const DEFAULT_ROUNDS = 10
export const HIGH_COST_THRESHOLD = 12

// Pure functions
export const getRoundInfo = (rounds: number): RoundInfo =>
  ROUND_TIME_ESTIMATES[rounds] ?? DEFAULT_ROUND_INFO

export const calculatePasswordStrength = (password: string): PasswordStrength | null => {
  if (!password) return null

  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  if (score <= 1) return { label: 'Weak', severity: 'danger' }
  if (score <= 2) return { label: 'Fair', severity: 'warn' }
  if (score <= 3) return { label: 'Good', severity: 'info' }
  return { label: 'Strong', severity: 'success' }
}

export const formatElapsedTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export const isHighCostOperation = (rounds: number): boolean => rounds >= HIGH_COST_THRESHOLD

// Worker management class (pure, no Vue reactivity)
export class BcryptWorkerManager {
  private worker: Worker | null = null
  private currentRequestId = 0
  private callbacks: BcryptCallbacks = {}

  setCallbacks(callbacks: BcryptCallbacks): void {
    this.callbacks = callbacks
  }

  private initWorker(): void {
    if (this.worker) return

    this.worker = new BcryptWorker()
    this.worker.onmessage = (event: MessageEvent<BcryptWorkerResponse>) => {
      this.handleResponse(event.data)
    }
    this.worker.onerror = (error: ErrorEvent) => {
      console.error('Worker error:', error)
      this.callbacks.onError?.('An error occurred during computation')
    }
  }

  private handleResponse(data: BcryptWorkerResponse): void {
    if (data.id !== this.currentRequestId) return

    if (data.type === 'hash') {
      this.callbacks.onHashComplete?.(data.result, data.computeTime)
    } else if (data.type === 'verify') {
      this.callbacks.onVerifyComplete?.(data.result)
    } else {
      this.callbacks.onError?.(data.error)
    }
  }

  hash(password: string, rounds: number): number {
    this.initWorker()
    this.currentRequestId++

    const message: BcryptWorkerMessage = {
      type: 'hash',
      password,
      rounds,
      id: this.currentRequestId,
    }
    this.worker?.postMessage(message)

    return this.currentRequestId
  }

  verify(password: string, hash: string): number {
    this.initWorker()
    this.currentRequestId++

    const message: BcryptWorkerMessage = {
      type: 'verify',
      password,
      hash,
      id: this.currentRequestId,
    }
    this.worker?.postMessage(message)

    return this.currentRequestId
  }

  cancel(): void {
    this.currentRequestId++
    this.terminate()
    this.callbacks.onCancelled?.()
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}

// Composable - Core logic only (no UI state like overlay)
export const useBcryptGenerator = () => {
  // Worker manager
  const workerManager = new BcryptWorkerManager()

  // Generate state
  const generateState = reactive<GenerateState>({
    password: '',
    rounds: DEFAULT_ROUNDS,
  })
  const hashedValue = ref('')
  const isComputing = ref(false)
  const computeTime = ref<number | null>(null)

  // Verify state
  const verifyState = reactive<VerifyState>({
    password: '',
    hash: '',
  })
  const verifyResult = ref<boolean | null>(null)
  const isVerifying = ref(false)

  // External callbacks (set by View) - using ref for mutable callback storage
  const externalCallbacks = ref<{
    onError: ((message: string) => void) | null
    onCancelled: (() => void) | null
    onComputeStart: ((isHighCost: boolean) => void) | null
    onComputeEnd: (() => void) | null
  }>({
    onError: null,
    onCancelled: null,
    onComputeStart: null,
    onComputeEnd: null,
  })

  // Set up worker callbacks
  workerManager.setCallbacks({
    onError: (message: string) => {
      isComputing.value = false
      isVerifying.value = false
      externalCallbacks.value.onComputeEnd?.()
      externalCallbacks.value.onError?.(message)
    },
    onCancelled: () => {
      isComputing.value = false
      isVerifying.value = false
      externalCallbacks.value.onComputeEnd?.()
      externalCallbacks.value.onCancelled?.()
    },
    onHashComplete: (hash: string, time: number) => {
      hashedValue.value = hash
      computeTime.value = time
      isComputing.value = false
      externalCallbacks.value.onComputeEnd?.()
    },
    onVerifyComplete: (result: boolean) => {
      verifyResult.value = result
      isVerifying.value = false
      externalCallbacks.value.onComputeEnd?.()
    },
  })

  // Only register onUnmounted if in a component context
  if (getCurrentInstance()) {
    onUnmounted(() => {
      workerManager.terminate()
    })
  }

  // Hash generation
  const computeHashInternal = () => {
    if (!generateState.password) {
      hashedValue.value = ''
      computeTime.value = null
      return
    }

    isComputing.value = true
    const highCost = isHighCostOperation(generateState.rounds)
    externalCallbacks.value.onComputeStart?.(highCost)

    workerManager.hash(generateState.password, generateState.rounds)
  }

  const computeHash = useDebounceFn(computeHashInternal, 500)

  // Password verification
  const verifyPassword = () => {
    if (!verifyState.password || !verifyState.hash) {
      verifyResult.value = null
      return
    }

    isVerifying.value = true
    externalCallbacks.value.onComputeStart?.(true) // Verify is always potentially slow

    workerManager.verify(verifyState.password, verifyState.hash)
  }

  // Cancel computation
  const cancelComputation = () => {
    workerManager.cancel()
  }

  // Watchers for auto-computation
  watch(() => [generateState.password, generateState.rounds], computeHash, { deep: true })

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

  // Computed
  const roundInfo = computed(() => getRoundInfo(generateState.rounds))
  const passwordStrength = computed(() => calculatePasswordStrength(generateState.password))

  // Callback setters for View integration
  const setOnError = (callback: (message: string) => void) => {
    externalCallbacks.value.onError = callback
  }

  const setOnCancelled = (callback: () => void) => {
    externalCallbacks.value.onCancelled = callback
  }

  const setOnComputeStart = (callback: (isHighCost: boolean) => void) => {
    externalCallbacks.value.onComputeStart = callback
  }

  const setOnComputeEnd = (callback: () => void) => {
    externalCallbacks.value.onComputeEnd = callback
  }

  return {
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
    computeHash,
    verifyPassword,
    cancelComputation,

    // Callback setters
    setOnError,
    setOnCancelled,
    setOnComputeStart,
    setOnComputeEnd,
  }
}

// UI state composable - for overlay and elapsed time display
export const useBcryptOverlay = () => {
  const showOverlay = ref(false)
  const elapsedTime = ref(0)
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null)

  const startTimer = () => {
    elapsedTime.value = 0
    intervalId.value = setInterval(() => {
      elapsedTime.value += 100
    }, 100)
  }

  const stopTimer = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  const show = () => {
    showOverlay.value = true
    startTimer()
  }

  const hide = () => {
    showOverlay.value = false
    stopTimer()
  }

  const formattedElapsedTime = computed(() => formatElapsedTime(elapsedTime.value))

  // Only register onUnmounted if in a component context
  if (getCurrentInstance()) {
    onUnmounted(() => {
      stopTimer()
    })
  }

  return {
    showOverlay,
    elapsedTime,
    formattedElapsedTime,
    show,
    hide,
  }
}
