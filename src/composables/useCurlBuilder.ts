import { ref, reactive, computed } from 'vue'

// Types
export interface Header {
  key: string
  value: string
  enabled: boolean
}

export interface QueryParam {
  key: string
  value: string
  enabled: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type BodyType = 'none' | 'json' | 'form' | 'raw'

export interface CurlOptions {
  followRedirects: boolean
  insecure: boolean
  verbose: boolean
  silent: boolean
  compressed: boolean
  timeout: number
  maxTime: number
  output: string
  proxy: string
  userAgent: string
  basicAuth: string
}

export interface MethodOption {
  label: string
  value: HttpMethod
}

export interface BodyTypeOption {
  label: string
  value: BodyType
}

export interface CommonHeader {
  label: string
  value: string
}

export interface ParseResult {
  headers: Header[]
  method: HttpMethod
  url: string
  body: string
}

// Constants
export const METHOD_OPTIONS: MethodOption[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' },
]

export const BODY_TYPE_OPTIONS: BodyTypeOption[] = [
  { label: 'None', value: 'none' },
  { label: 'JSON', value: 'json' },
  { label: 'Form Data', value: 'form' },
  { label: 'Raw', value: 'raw' },
]

export const COMMON_HEADERS: CommonHeader[] = [
  { label: 'Accept', value: 'Accept' },
  { label: 'Accept-Language', value: 'Accept-Language' },
  { label: 'Authorization', value: 'Authorization' },
  { label: 'Cache-Control', value: 'Cache-Control' },
  { label: 'Content-Type', value: 'Content-Type' },
  { label: 'Cookie', value: 'Cookie' },
  { label: 'Origin', value: 'Origin' },
  { label: 'Referer', value: 'Referer' },
  { label: 'User-Agent', value: 'User-Agent' },
  { label: 'X-API-Key', value: 'X-API-Key' },
  { label: 'X-Requested-With', value: 'X-Requested-With' },
]

export const DEFAULT_OPTIONS: CurlOptions = {
  followRedirects: true,
  insecure: false,
  verbose: false,
  silent: false,
  compressed: false,
  timeout: 0,
  maxTime: 0,
  output: '',
  proxy: '',
  userAgent: '',
  basicAuth: '',
}

export const SAMPLE_REQUEST = {
  method: 'POST' as HttpMethod,
  url: 'https://api.example.com/users',
  headers: [
    { key: 'Authorization', value: 'Bearer your-token-here', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true },
  ],
  queryParams: [{ key: 'version', value: '2', enabled: true }],
  body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }, null, 2),
  bodyType: 'json' as BodyType,
}

// Pure functions
export const createEmptyHeader = (): Header => ({
  key: '',
  value: '',
  enabled: true,
})

export const createEmptyQueryParam = (): QueryParam => ({
  key: '',
  value: '',
  enabled: true,
})

export const escapeShell = (str: string): string => {
  if (!str) return "''"
  if (!/[^a-zA-Z0-9_\-.,/:@]/.test(str)) return str
  return `'${str.replace(/'/g, "'\\''")}'`
}

export const buildUrlWithParams = (baseUrl: string, params: QueryParam[]): string => {
  if (!baseUrl) return ''

  const enabledParams = params.filter(p => p.enabled && p.key)
  if (enabledParams.length === 0) return baseUrl

  const queryString = enabledParams
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&')

  return baseUrl.includes('?') ? `${baseUrl}&${queryString}` : `${baseUrl}?${queryString}`
}

// Build option flags from CurlOptions
const buildOptionFlags = (options: CurlOptions): string[] =>
  [
    { condition: options.followRedirects, flag: '-L' },
    { condition: options.insecure, flag: '-k' },
    { condition: options.verbose, flag: '-v' },
    { condition: options.silent, flag: '-s' },
    { condition: options.compressed, flag: '--compressed' },
    { condition: options.timeout > 0, flag: `--connect-timeout ${options.timeout}` },
    { condition: options.maxTime > 0, flag: `-m ${options.maxTime}` },
    { condition: !!options.output, flag: `-o ${escapeShell(options.output)}` },
    { condition: !!options.proxy, flag: `-x ${escapeShell(options.proxy)}` },
    { condition: !!options.userAgent, flag: `-A ${escapeShell(options.userAgent)}` },
    { condition: !!options.basicAuth, flag: `-u ${escapeShell(options.basicAuth)}` },
  ]
    .filter(({ condition }) => condition)
    .map(({ flag }) => flag)

// Build header flags
const buildHeaderFlags = (headers: Header[]): string[] =>
  headers
    .filter(h => h.enabled && h.key)
    .map(h => `-H ${escapeShell(`${h.key}: ${h.value}`)}`)

// Get Content-Type header if needed
const getContentTypeHeader = (
  bodyType: BodyType,
  body: string,
  headers: Header[],
): string | null => {
  if (!body) return null

  const hasContentType = headers
    .filter(h => h.enabled && h.key)
    .some(h => h.key.toLowerCase() === 'content-type')

  if (hasContentType) return null

  const contentTypeMap = {
    json: 'application/json',
    form: 'application/x-www-form-urlencoded',
  } as const

  const contentType = contentTypeMap[bodyType as keyof typeof contentTypeMap]
  return contentType ? `-H 'Content-Type: ${contentType}'` : null
}

export const generateCurlCommand = (
  method: HttpMethod,
  url: string,
  headers: Header[],
  queryParams: QueryParam[],
  body: string,
  bodyType: BodyType,
  options: CurlOptions,
): string =>
  [
    'curl',
    ...(method !== 'GET' ? [`-X ${method}`] : []),
    ...buildOptionFlags(options),
    ...buildHeaderFlags(headers),
    ...(getContentTypeHeader(bodyType, body, headers) ? [getContentTypeHeader(bodyType, body, headers)!] : []),
    ...(body && bodyType !== 'none' ? [`-d ${escapeShell(body)}`] : []),
    ...(url ? [escapeShell(buildUrlWithParams(url, queryParams))] : []),
  ].join(` \\
  `)

export const parseCurlString = (input: string): ParseResult => {
  const tokens = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []

  const cleanValue = (val: string): string => {
    if (!val) return ''
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      return val.slice(1, -1)
    }
    return val
  }

  const processTokens = (tokens: string[], index: number, state: ParseResult): ParseResult => {
    if (index >= tokens.length) return state

    const token = tokens[index]
    const nextToken = tokens[index + 1]

    if (token === '-X' || token === '--request') {
      const methodValue = cleanValue(nextToken ?? '') as HttpMethod
      return processTokens(tokens, index + 2, { ...state, method: methodValue })
    }

    if (token === '-H' || token === '--header') {
      const headerValue = cleanValue(nextToken ?? '')
      const colonIndex = headerValue.indexOf(':')
      if (colonIndex > 0) {
        const key = headerValue.slice(0, colonIndex).trim()
        const value = headerValue.slice(colonIndex + 1).trim()
        return processTokens(tokens, index + 2, {
          ...state,
          headers: [...state.headers, { key, value, enabled: true }],
        })
      }
      return processTokens(tokens, index + 2, state)
    }

    if (token === '-d' || token === '--data' || token === '--data-raw') {
      return processTokens(tokens, index + 2, { ...state, body: cleanValue(nextToken ?? '') })
    }

    if (token?.startsWith('http://') || token?.startsWith('https://')) {
      return processTokens(tokens, index + 1, { ...state, url: cleanValue(token) })
    }

    if (!token?.startsWith('-') && !token?.startsWith('curl') && index === tokens.length - 1) {
      return processTokens(tokens, index + 1, { ...state, url: cleanValue(token ?? '') })
    }

    return processTokens(tokens, index + 1, state)
  }

  return processTokens(tokens, 0, { headers: [], method: 'GET', url: '', body: '' })
}

// Composable
export const useCurlBuilder = () => {
  // State
  const method = ref<HttpMethod>('GET')
  const url = ref('')
  const headers = ref<Header[]>([createEmptyHeader()])
  const queryParams = ref<QueryParam[]>([createEmptyQueryParam()])
  const body = ref('')
  const bodyType = ref<BodyType>('none')
  const parsedInput = ref('')

  // Options
  const options = reactive<CurlOptions>({ ...DEFAULT_OPTIONS })

  // Header management
  const addHeader = () => {
    headers.value.push(createEmptyHeader())
  }

  const removeHeader = (index: number) => {
    headers.value.splice(index, 1)
    if (headers.value.length === 0) {
      addHeader()
    }
  }

  // Query param management
  const addQueryParam = () => {
    queryParams.value.push(createEmptyQueryParam())
  }

  const removeQueryParam = (index: number) => {
    queryParams.value.splice(index, 1)
    if (queryParams.value.length === 0) {
      addQueryParam()
    }
  }

  // Computed
  const curlCommand = computed(() =>
    generateCurlCommand(
      method.value,
      url.value,
      headers.value,
      queryParams.value,
      body.value,
      bodyType.value,
      options,
    ),
  )

  const enabledHeadersCount = computed(() => headers.value.filter(h => h.enabled && h.key).length)

  const enabledParamsCount = computed(
    () => queryParams.value.filter(p => p.enabled && p.key).length,
  )

  // Actions
  const parseCurlCommand = (): ParseResult => {
    const input = parsedInput.value.trim()
    if (!input) {
      return { headers: [], method: 'GET', url: '', body: '' }
    }

    // Reset state
    method.value = 'GET'
    headers.value = [createEmptyHeader()]
    queryParams.value = [createEmptyQueryParam()]
    body.value = ''
    bodyType.value = 'none'

    const result = parseCurlString(input)

    method.value = result.method
    url.value = result.url
    if (result.headers.length > 0) {
      headers.value = result.headers
    }
    if (result.body) {
      body.value = result.body
      bodyType.value = result.body.startsWith('{') ? 'json' : 'raw'
    }

    return result
  }

  const loadSample = () => {
    method.value = SAMPLE_REQUEST.method
    url.value = SAMPLE_REQUEST.url
    headers.value = [...SAMPLE_REQUEST.headers]
    queryParams.value = [...SAMPLE_REQUEST.queryParams]
    body.value = SAMPLE_REQUEST.body
    bodyType.value = SAMPLE_REQUEST.bodyType
  }

  const resetAll = () => {
    method.value = 'GET'
    url.value = ''
    headers.value = [createEmptyHeader()]
    queryParams.value = [createEmptyQueryParam()]
    body.value = ''
    bodyType.value = 'none'
    Object.assign(options, DEFAULT_OPTIONS)
  }

  return {
    // State
    method,
    url,
    headers,
    queryParams,
    body,
    bodyType,
    options,
    parsedInput,

    // Computed
    curlCommand,
    enabledHeadersCount,
    enabledParamsCount,

    // Actions
    addHeader,
    removeHeader,
    addQueryParam,
    removeQueryParam,
    parseCurlCommand,
    loadSample,
    resetAll,
  }
}
