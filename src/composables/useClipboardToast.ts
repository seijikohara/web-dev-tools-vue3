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

/**
 * Composable for clipboard operations with toast notifications
 * Combines @vueuse/core useClipboard with PrimeVue toast
 */
export const useClipboardToast = () => {
  const toast = useToast()
  const { copy: clipboardCopy, copied, isSupported } = useClipboard()

  /**
   * Copy text to clipboard and show success toast
   */
  const copy = async (text: string, options: CopyOptions = {}) => {
    const { summary = 'Copied', detail = 'Copied to clipboard', life = 2000 } = options

    await clipboardCopy(text)

    toast.add({
      severity: 'success',
      summary,
      detail,
      life,
    })
  }

  /**
   * Copy text and show custom message
   */
  const copyWithMessage = async (text: string, message: string, life = 2000) => {
    await clipboardCopy(text)

    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: message,
      life,
    })
  }

  /**
   * Show success toast
   */
  const showSuccess = (summary: string, detail?: string, life = 2000) => {
    toast.add({
      severity: 'success',
      summary,
      detail,
      life,
    })
  }

  /**
   * Show error toast
   */
  const showError = (summary: string, detail?: string, life = 3000) => {
    toast.add({
      severity: 'error',
      summary,
      detail,
      life,
    })
  }

  /**
   * Show info toast
   */
  const showInfo = (summary: string, detail?: string, life = 2000) => {
    toast.add({
      severity: 'info',
      summary,
      detail,
      life,
    })
  }

  /**
   * Show warning toast
   */
  const showWarning = (summary: string, detail?: string, life = 3000) => {
    toast.add({
      severity: 'warn',
      summary,
      detail,
      life,
    })
  }

  return {
    // Clipboard
    copy,
    copyWithMessage,
    copied,
    isSupported,

    // Toast helpers
    showSuccess,
    showError,
    showInfo,
    showWarning,
    toast,
  }
}
