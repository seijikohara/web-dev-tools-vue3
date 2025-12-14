import { ref, type Ref } from 'vue'

interface UseFormattersReturn {
  formatJson: (input: string, indent?: number | string) => string
  minifyJson: (input: string) => string
  encodeUrl: (input: string) => string
  decodeUrl: (input: string) => string
  error: Ref<string | null>
}

/**
 * Pure function: Format JSON with specified indentation
 */
const formatJsonPure = (input: string, indent: number | string = 2): string =>
  JSON.stringify(JSON.parse(input), null, indent)

/**
 * Pure function: Minify JSON by removing whitespace
 */
const minifyJsonPure = (input: string): string => JSON.stringify(JSON.parse(input))

/**
 * Pure function: Encode URL component
 */
const encodeUrlPure = (input: string): string => encodeURIComponent(input)

/**
 * Pure function: Decode URL component
 */
const decodeUrlPure = (input: string): string => decodeURIComponent(input)

/**
 * Pure function: Convert error to string message
 */
const toErrorMessage = (e: unknown, defaultMessage: string): string =>
  e instanceof Error ? e.message : defaultMessage

/**
 * Higher-order function: Wrap function with error handling
 */
const withErrorHandling =
  <T extends unknown[], R>(
    fn: (...args: T) => R,
    errorRef: Ref<string | null>,
    defaultErrorMessage: string,
  ) =>
  (...args: T): R => {
    errorRef.value = null
    try {
      return fn(...args)
    } catch (e) {
      errorRef.value = toErrorMessage(e, defaultErrorMessage)
      throw e
    }
  }

/**
 * Composable for common formatting operations
 */
export const useFormatters = (): UseFormattersReturn => {
  const error = ref<string | null>(null)

  return {
    formatJson: withErrorHandling(formatJsonPure, error, 'Invalid JSON'),
    minifyJson: withErrorHandling(minifyJsonPure, error, 'Invalid JSON'),
    encodeUrl: withErrorHandling(encodeUrlPure, error, 'Encoding failed'),
    decodeUrl: withErrorHandling(decodeUrlPure, error, 'Decoding failed'),
    error,
  }
}
