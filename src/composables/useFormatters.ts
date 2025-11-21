import { ref, type Ref } from 'vue'

interface UseFormattersReturn {
  formatJson: (input: string, indent?: number | string) => string
  minifyJson: (input: string) => string
  encodeUrl: (input: string) => string
  decodeUrl: (input: string) => string
  error: Ref<string | null>
}

const withErrorHandling =
  <T extends unknown[], R>(
    fn: (...args: T) => R,
    errorRef: Ref<string | null>,
    defaultErrorMessage: string,
  ) =>
  (...args: T): R => {
    try {
      errorRef.value = null
      return fn(...args)
    } catch (e) {
      errorRef.value = e instanceof Error ? e.message : defaultErrorMessage
      throw e
    }
  }

export const useFormatters = (): UseFormattersReturn => {
  const error = ref<string | null>(null)

  const formatJsonPure = (input: string, indent: number | string = 2): string =>
    JSON.stringify(JSON.parse(input), null, indent)

  const minifyJsonPure = (input: string): string => JSON.stringify(JSON.parse(input))

  const encodeUrlPure = (input: string): string => encodeURIComponent(input)

  const decodeUrlPure = (input: string): string => decodeURIComponent(input)

  const formatJson = withErrorHandling(formatJsonPure, error, 'Invalid JSON')
  const minifyJson = withErrorHandling(minifyJsonPure, error, 'Invalid JSON')
  const encodeUrl = withErrorHandling(encodeUrlPure, error, 'Encoding failed')
  const decodeUrl = withErrorHandling(decodeUrlPure, error, 'Decoding failed')

  return {
    formatJson,
    minifyJson,
    encodeUrl,
    decodeUrl,
    error,
  }
}
