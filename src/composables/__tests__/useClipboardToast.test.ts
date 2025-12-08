import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useClipboardToast } from '../useClipboardToast'

// Mock @vueuse/core useClipboard
vi.mock('@vueuse/core', () => ({
  useClipboard: vi.fn(() => ({
    copy: vi.fn().mockResolvedValue(undefined),
    copied: { value: false },
    isSupported: { value: true },
  })),
}))

// Mock PrimeVue useToast
const mockToastAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: mockToastAdd,
  })),
}))

describe('useClipboardToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('copy function', () => {
    it('should copy text to clipboard and show success toast with default options', async () => {
      const { copy } = useClipboardToast()
      const { useClipboard } = await import('@vueuse/core')
      const mockCopy = vi.mocked(useClipboard).mock.results[0]?.value.copy

      await copy('Hello World')

      expect(mockCopy).toHaveBeenCalledWith('Hello World')
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied to clipboard',
        life: 2000,
      })
    })

    it('should copy text with custom summary', async () => {
      const { copy } = useClipboardToast()

      await copy('Test text', { summary: 'Success!' })

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success!',
        detail: 'Copied to clipboard',
        life: 2000,
      })
    })

    it('should copy text with custom detail', async () => {
      const { copy } = useClipboardToast()

      await copy('Test text', { detail: 'Custom message' })

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Copied',
        detail: 'Custom message',
        life: 2000,
      })
    })

    it('should copy text with custom life duration', async () => {
      const { copy } = useClipboardToast()

      await copy('Test text', { life: 5000 })

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied to clipboard',
        life: 5000,
      })
    })

    it('should copy text with all custom options', async () => {
      const { copy } = useClipboardToast()

      await copy('Test text', {
        summary: 'Done',
        detail: 'Text copied successfully',
        life: 3000,
      })

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Done',
        detail: 'Text copied successfully',
        life: 3000,
      })
    })
  })

  describe('copyWithMessage function', () => {
    it('should copy text and show custom message with default life', async () => {
      const { copyWithMessage } = useClipboardToast()
      const { useClipboard } = await import('@vueuse/core')
      const mockCopy = vi.mocked(useClipboard).mock.results[0]?.value.copy

      await copyWithMessage('Test text', 'Custom success message')

      expect(mockCopy).toHaveBeenCalledWith('Test text')
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Copied',
        detail: 'Custom success message',
        life: 2000,
      })
    })

    it('should copy text and show custom message with custom life', async () => {
      const { copyWithMessage } = useClipboardToast()

      await copyWithMessage('Test text', 'Custom success message', 4000)

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Copied',
        detail: 'Custom success message',
        life: 4000,
      })
    })
  })

  describe('showSuccess', () => {
    it('should show success toast with summary only', () => {
      const { showSuccess } = useClipboardToast()

      showSuccess('Success')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: undefined,
        life: 2000,
      })
    })

    it('should show success toast with summary and detail', () => {
      const { showSuccess } = useClipboardToast()

      showSuccess('Success', 'Operation completed')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed',
        life: 2000,
      })
    })

    it('should show success toast with custom life', () => {
      const { showSuccess } = useClipboardToast()

      showSuccess('Success', 'Operation completed', 5000)

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed',
        life: 5000,
      })
    })
  })

  describe('showError', () => {
    it('should show error toast with summary only', () => {
      const { showError } = useClipboardToast()

      showError('Error occurred')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error occurred',
        detail: undefined,
        life: 3000,
      })
    })

    it('should show error toast with summary and detail', () => {
      const { showError } = useClipboardToast()

      showError('Error', 'Something went wrong')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong',
        life: 3000,
      })
    })

    it('should show error toast with custom life', () => {
      const { showError } = useClipboardToast()

      showError('Error', 'Something went wrong', 5000)

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong',
        life: 5000,
      })
    })
  })

  describe('showInfo', () => {
    it('should show info toast with summary only', () => {
      const { showInfo } = useClipboardToast()

      showInfo('Information')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Information',
        detail: undefined,
        life: 2000,
      })
    })

    it('should show info toast with summary and detail', () => {
      const { showInfo } = useClipboardToast()

      showInfo('Info', 'Please note this')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: 'Please note this',
        life: 2000,
      })
    })

    it('should show info toast with custom life', () => {
      const { showInfo } = useClipboardToast()

      showInfo('Info', 'Please note this', 4000)

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: 'Please note this',
        life: 4000,
      })
    })
  })

  describe('showWarning', () => {
    it('should show warning toast with summary only', () => {
      const { showWarning } = useClipboardToast()

      showWarning('Warning')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: undefined,
        life: 3000,
      })
    })

    it('should show warning toast with summary and detail', () => {
      const { showWarning } = useClipboardToast()

      showWarning('Warning', 'Please be careful')

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please be careful',
        life: 3000,
      })
    })

    it('should show warning toast with custom life', () => {
      const { showWarning } = useClipboardToast()

      showWarning('Warning', 'Please be careful', 5000)

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please be careful',
        life: 5000,
      })
    })
  })

  describe('exported values', () => {
    it('should export copied and isSupported from useClipboard', () => {
      const { copied, isSupported } = useClipboardToast()

      expect(copied).toBeDefined()
      expect(isSupported).toBeDefined()
    })

    it('should export toast instance', () => {
      const { toast } = useClipboardToast()

      expect(toast).toBeDefined()
      expect(toast.add).toBe(mockToastAdd)
    })
  })
})
