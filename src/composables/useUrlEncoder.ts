import { ref, computed, watch } from 'vue'

// Types
export type EncodingMode = 'encodeURIComponent' | 'encodeURI'

export interface EncodingModeOption {
  label: string
  value: EncodingMode
  tooltip: string
}

export interface ParsedUrl {
  protocol: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  username: string
  password: string
}

export interface QueryParam {
  key: string
  value: string
  encodedKey: string
  encodedValue: string
}

export interface BuilderParam {
  id: number
  key: string
  value: string
}

export interface InputStats {
  chars: number
  bytes: number
}

export interface OutputStats {
  chars: number
  ratio: string
}

export interface EncodingExample {
  char: string
  encoded: string
  description: string
}

// Constants
export const ENCODING_MODE_OPTIONS: EncodingModeOption[] = [
  { label: 'Component', value: 'encodeURIComponent', tooltip: 'encodeURIComponent' },
  { label: 'URI', value: 'encodeURI', tooltip: 'encodeURI' },
]

export const SAMPLE_TEXT = 'Hello World! こんにちは 你好 🌍 #test?query=value&foo=bar'

export const SAMPLE_URL =
  'https://user:pass@example.com:8080/path/to/page?name=John%20Doe&age=30&city=Tokyo#section1'

export const ENCODING_EXAMPLES: EncodingExample[] = [
  { char: ' ', encoded: '%20 or +', description: 'Space' },
  { char: '!', encoded: '%21', description: 'Exclamation' },
  { char: '#', encoded: '%23', description: 'Hash' },
  { char: '$', encoded: '%24', description: 'Dollar' },
  { char: '&', encoded: '%26', description: 'Ampersand' },
  { char: "'", encoded: '%27', description: 'Single quote' },
  { char: '(', encoded: '%28', description: 'Open paren' },
  { char: ')', encoded: '%29', description: 'Close paren' },
  { char: '*', encoded: '%2A', description: 'Asterisk' },
  { char: '+', encoded: '%2B', description: 'Plus' },
  { char: ',', encoded: '%2C', description: 'Comma' },
  { char: '/', encoded: '%2F', description: 'Slash' },
  { char: ':', encoded: '%3A', description: 'Colon' },
  { char: ';', encoded: '%3B', description: 'Semicolon' },
  { char: '=', encoded: '%3D', description: 'Equals' },
  { char: '?', encoded: '%3F', description: 'Question' },
  { char: '@', encoded: '%40', description: 'At sign' },
  { char: '[', encoded: '%5B', description: 'Open bracket' },
  { char: ']', encoded: '%5D', description: 'Close bracket' },
]

// Pure functions
export const encodeUrl = (text: string, mode: EncodingMode): string =>
  mode === 'encodeURIComponent' ? encodeURIComponent(text) : encodeURI(text)

export const decodeUrl = (text: string, mode: EncodingMode): string =>
  mode === 'encodeURIComponent' ? decodeURIComponent(text) : decodeURI(text)

export const getInputStats = (text: string): InputStats | null => {
  if (!text) return null
  return {
    chars: text.length,
    bytes: new TextEncoder().encode(text).length,
  }
}

export const getOutputStats = (input: string, output: string): OutputStats | null => {
  if (!output) return null
  return {
    chars: output.length,
    ratio: input ? ((output.length / input.length) * 100).toFixed(0) : '0',
  }
}

export const parseUrl = (urlString: string): ParsedUrl | null => {
  if (!urlString.trim()) return null

  try {
    const url = new URL(urlString)
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      username: url.username,
      password: url.password,
    }
  } catch {
    return null
  }
}

export const validateUrl = (urlString: string): string => {
  if (!urlString.trim()) return ''
  try {
    new URL(urlString)
    return ''
  } catch {
    return 'Invalid URL format'
  }
}

export const extractQueryParams = (urlString: string): QueryParam[] => {
  if (!urlString.trim()) return []

  try {
    const url = new URL(urlString)
    return Array.from(url.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
      encodedKey: encodeURIComponent(key),
      encodedValue: encodeURIComponent(value),
    }))
  } catch {
    return []
  }
}

export const buildUrl = (baseUrl: string, params: BuilderParam[]): string => {
  try {
    const url = new URL(baseUrl)
    const queryString = params
      .filter(param => param.key.trim())
      .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
      .join('&')

    return queryString
      ? `${url.origin}${url.pathname}${url.search ? `${url.search}&` : '?'}${queryString}${url.hash}`
      : url.toString()
  } catch {
    return ''
  }
}

export const parseUrlForBuilder = (
  urlString: string,
  nextId: number,
): { baseUrl: string; params: BuilderParam[]; nextId: number } | null => {
  try {
    const url = new URL(urlString)
    const baseUrl = url.origin + url.pathname

    const searchParamsEntries = Array.from(url.searchParams.entries())
    const params: BuilderParam[] =
      searchParamsEntries.length > 0
        ? searchParamsEntries.map(([key, value], index) => ({
            id: nextId + index,
            key,
            value,
          }))
        : [{ id: nextId, key: '', value: '' }]

    const finalNextId = nextId + Math.max(searchParamsEntries.length, 1)

    return { baseUrl, params, nextId: finalNextId }
  } catch {
    return null
  }
}

// Composable
export const useUrlEncoder = () => {
  // Encode/Decode state
  const inputText = ref('')
  const outputText = ref('')
  const encodeError = ref('')
  const encodingMode = ref<EncodingMode>('encodeURIComponent')

  // Auto-encode when input changes
  watch([inputText, encodingMode], () => {
    encodeError.value = ''
    if (!inputText.value) {
      outputText.value = ''
      return
    }

    try {
      outputText.value = encodeUrl(inputText.value, encodingMode.value)
    } catch (error) {
      encodeError.value = error instanceof Error ? error.message : 'Encode failed'
      outputText.value = ''
    }
  })

  // Computed stats
  const inputStats = computed(() => getInputStats(inputText.value))
  const outputStats = computed(() => getOutputStats(inputText.value, outputText.value))

  // Encode/Decode actions
  const decodeOutput = (): boolean => {
    encodeError.value = ''
    if (!outputText.value) return false

    try {
      inputText.value = decodeUrl(outputText.value, encodingMode.value)
      return true
    } catch (error) {
      encodeError.value =
        error instanceof Error ? error.message : 'Decode failed - Invalid URL encoding'
      return false
    }
  }

  const loadSample = () => {
    inputText.value = SAMPLE_TEXT
  }

  const clearAll = () => {
    inputText.value = ''
    outputText.value = ''
    encodeError.value = ''
  }

  // URL Parser state
  const urlInput = ref('')

  // URL Parser computed
  const urlParseError = computed(() => validateUrl(urlInput.value))
  const parsedUrl = computed(() => (urlParseError.value ? null : parseUrl(urlInput.value)))
  const queryParams = computed(() => extractQueryParams(urlInput.value))

  // URL Parser actions
  const loadSampleUrl = () => {
    urlInput.value = SAMPLE_URL
  }

  // Query Builder state
  const builderBaseUrl = ref('https://example.com/path')
  const builderParams = ref<BuilderParam[]>([{ id: 1, key: '', value: '' }])
  const nextParamId = ref(2)

  // Query Builder computed
  const builtUrl = computed(() => buildUrl(builderBaseUrl.value, builderParams.value))

  // Query Builder actions
  const addParam = () => {
    builderParams.value.push({ id: nextParamId.value++, key: '', value: '' })
  }

  const removeParam = (id: number) => {
    builderParams.value = builderParams.value.filter(p => p.id !== id)
    if (builderParams.value.length === 0) {
      addParam()
    }
  }

  const loadUrlToBuilder = (): boolean => {
    if (!urlInput.value.trim()) return false

    const result = parseUrlForBuilder(urlInput.value, nextParamId.value)
    if (!result) return false

    builderBaseUrl.value = result.baseUrl
    builderParams.value = result.params
    nextParamId.value = result.nextId
    return true
  }

  const clearBuilder = () => {
    builderBaseUrl.value = 'https://example.com/path'
    builderParams.value = [{ id: 1, key: '', value: '' }]
    nextParamId.value = 2
  }

  return {
    // Encode/Decode state
    inputText,
    outputText,
    encodeError,
    encodingMode,

    // Encode/Decode computed
    inputStats,
    outputStats,

    // Encode/Decode actions
    decodeOutput,
    loadSample,
    clearAll,

    // URL Parser state
    urlInput,

    // URL Parser computed
    urlParseError,
    parsedUrl,
    queryParams,

    // URL Parser actions
    loadSampleUrl,

    // Query Builder state
    builderBaseUrl,
    builderParams,

    // Query Builder computed
    builtUrl,

    // Query Builder actions
    addParam,
    removeParam,
    loadUrlToBuilder,
    clearBuilder,
  }
}
