import { ref, type Ref } from 'vue'

interface UseFormattersReturn {
  formatJson: (input: string, indent?: number | string) => string
  minifyJson: (input: string) => string
  encodeUrl: (input: string) => string
  decodeUrl: (input: string) => string
  error: Ref<string | null>
}

/**
 * Composable for various text formatting operations
 */
export const useFormatters = (): UseFormattersReturn => {
  const error = ref<string | null>(null)

  const formatJson = (input: string, indent: number | string = 2): string => {
    try {
      error.value = null
      const parsed = JSON.parse(input)
      return JSON.stringify(parsed, null, indent)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Invalid JSON'
      throw e
    }
  }

  const minifyJson = (input: string): string => {
    try {
      error.value = null
      const parsed = JSON.parse(input)
      return JSON.stringify(parsed)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Invalid JSON'
      throw e
    }
  }

  const encodeUrl = (input: string): string => {
    try {
      error.value = null
      return encodeURIComponent(input)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Encoding failed'
      throw e
    }
  }

  const decodeUrl = (input: string): string => {
    try {
      error.value = null
      return decodeURIComponent(input)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Decoding failed'
      throw e
    }
  }

  return {
    formatJson,
    minifyJson,
    encodeUrl,
    decodeUrl,
    error,
  }
}
