import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

export interface CopyOptions {
  /** Success message summary (default: 'Copied') */
  summary?: string
  /** Success message detail */
  detail?: string
  /** Toast duration in ms (default: 2000) */
  life?: number
}

type ToastSeverity = 'success' | 'error' | 'info' | 'warn'

const DEFAULT_COPY_OPTIONS = {
  summary: 'Copied',
  detail: 'Copied to clipboard',
  life: 2000,
} as const satisfies Required<CopyOptions>

const DEFAULT_TOAST_LIFE = {
  success: 2000,
  error: 3000,
  info: 2000,
  warn: 3000,
} as const satisfies Record<ToastSeverity, number>

/**
 * Pure function: Create toast message options
 */
const createToastMessage = (
  severity: ToastSeverity,
  summary: string,
  detail?: string,
  life?: number,
) => ({
  severity,
  summary,
  detail,
  life: life ?? DEFAULT_TOAST_LIFE[severity],
})

/**
 * Pure function: Merge copy options with defaults
 */
const mergeCopyOptions = (options: CopyOptions = {}): Required<CopyOptions> => ({
  summary: options.summary ?? DEFAULT_COPY_OPTIONS.summary,
  detail: options.detail ?? DEFAULT_COPY_OPTIONS.detail,
  life: options.life ?? DEFAULT_COPY_OPTIONS.life,
})

/**
 * Composable for clipboard operations with toast notifications
 * Combines @vueuse/core useClipboard with PrimeVue toast
 */
export const useClipboardToast = () => {
  const toast = useToast()
  const { copy: clipboardCopy, copied, isSupported } = useClipboard()

  const copy = async (text: string, options: CopyOptions = {}) => {
    const { summary, detail, life } = mergeCopyOptions(options)
    await clipboardCopy(text)
    toast.add(createToastMessage('success', summary, detail, life))
  }

  const copyWithMessage = async (text: string, message: string, life = 2000) => {
    await clipboardCopy(text)
    toast.add(createToastMessage('success', 'Copied', message, life))
  }

  const showSuccess = (summary: string, detail?: string, life?: number) => {
    toast.add(createToastMessage('success', summary, detail, life))
  }

  const showError = (summary: string, detail?: string, life?: number) => {
    toast.add(createToastMessage('error', summary, detail, life))
  }

  const showInfo = (summary: string, detail?: string, life?: number) => {
    toast.add(createToastMessage('info', summary, detail, life))
  }

  const showWarning = (summary: string, detail?: string, life?: number) => {
    toast.add(createToastMessage('warn', summary, detail, life))
  }

  return {
    copy,
    copyWithMessage,
    copied,
    isSupported,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    toast,
  }
}
