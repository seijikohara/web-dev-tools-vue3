import { ref, computed } from 'vue'
import { useRegexVisualizer } from './useRegexVisualizer'

// Types
export interface Match {
  index: number
  match: string
  groups: string[]
  start: number
  end: number
}

export interface CommonPattern {
  name: string
  pattern: string
  icon: string
}

export interface RegexFlags {
  global: boolean
  caseInsensitive: boolean
  multiline: boolean
  dotAll: boolean
  unicode: boolean
}

// Constants
export const COMMON_PATTERNS: CommonPattern[] = [
  {
    name: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    icon: 'pi pi-envelope',
  },
  {
    name: 'URL',
    pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+",
    icon: 'pi pi-link',
  },
  {
    name: 'IPv4',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    icon: 'pi pi-globe',
  },
  {
    name: 'Phone (US)',
    pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    icon: 'pi pi-phone',
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    icon: 'pi pi-calendar',
  },
  {
    name: 'Time (HH:MM:SS)',
    pattern: '\\d{2}:\\d{2}:\\d{2}',
    icon: 'pi pi-clock',
  },
  {
    name: 'Hex Color',
    pattern: '#[0-9A-Fa-f]{6}\\b|#[0-9A-Fa-f]{3}\\b',
    icon: 'pi pi-palette',
  },
  {
    name: 'UUID',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    icon: 'pi pi-id-card',
  },
]

export const SAMPLE_DATA = {
  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  testString: `Contact us at:
support@example.com
sales@company.org
invalid.email@
john.doe+tag@subdomain.domain.co.uk
not-an-email
admin@localhost`,
}

// Pure functions
export const buildFlagsString = (flags: RegexFlags): string => {
  const parts: string[] = []
  if (flags.global) parts.push('g')
  if (flags.caseInsensitive) parts.push('i')
  if (flags.multiline) parts.push('m')
  if (flags.dotAll) parts.push('s')
  if (flags.unicode) parts.push('u')
  return parts.join('')
}

export const validateRegex = (pattern: string, flags: string): string => {
  if (!pattern) return ''
  try {
    new RegExp(pattern, flags)
    return ''
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid regular expression'
  }
}

export const findMatches = (pattern: string, testString: string, flags: string): Match[] => {
  if (!pattern || !testString) return []

  try {
    const re = new RegExp(pattern, flags)
    const isGlobal = flags.includes('g')

    if (isGlobal) {
      return [...testString.matchAll(re)].map((match, index) => {
        const matchedText = match[0]
        const matchIndex = match.index
        return {
          index,
          match: matchedText,
          groups: match.slice(1),
          start: matchIndex,
          end: matchIndex + matchedText.length,
        }
      })
    }

    const match = re.exec(testString)
    if (match) {
      return [
        {
          index: 0,
          match: match[0],
          groups: match.slice(1),
          start: match.index,
          end: match.index + match[0].length,
        },
      ]
    }

    return []
  } catch {
    return []
  }
}

export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const highlightMatches = (pattern: string, testString: string, flags: string): string => {
  if (!pattern || !testString) {
    return escapeHtml(testString)
  }

  try {
    const re = new RegExp(pattern, flags)
    return testString.replace(re, match => `<mark class="highlight">${escapeHtml(match)}</mark>`)
  } catch {
    return escapeHtml(testString)
  }
}

export const replaceMatches = (
  pattern: string,
  testString: string,
  replacement: string,
  flags: string,
): string => {
  if (!pattern || !testString) return ''
  try {
    const re = new RegExp(pattern, flags)
    return testString.replace(re, replacement)
  } catch {
    return ''
  }
}

export const formatFullPattern = (pattern: string, flags: string): string => {
  return `/${pattern}/${flags}`
}

// Composable
export const useRegexTester = () => {
  // State
  const pattern = ref('')
  const testString = ref('')
  const replacement = ref('')

  // Flags
  const flagGlobal = ref(true)
  const flagCaseInsensitive = ref(false)
  const flagMultiline = ref(false)
  const flagDotAll = ref(false)
  const flagUnicode = ref(false)

  // Visualizer state
  const showAst = ref(false)

  // Computed flags string
  const flags = computed(() =>
    buildFlagsString({
      global: flagGlobal.value,
      caseInsensitive: flagCaseInsensitive.value,
      multiline: flagMultiline.value,
      dotAll: flagDotAll.value,
      unicode: flagUnicode.value,
    }),
  )

  // Use regex visualizer
  const { svgDiagram, astJson, parseError: visualizerError } = useRegexVisualizer(pattern, flags)

  // Computed
  const regexError = computed(() => validateRegex(pattern.value, flags.value))

  const matches = computed((): Match[] => {
    if (regexError.value) return []
    return findMatches(pattern.value, testString.value, flags.value)
  })

  const highlightedText = computed(() => {
    if (matches.value.length === 0) {
      return escapeHtml(testString.value)
    }
    return highlightMatches(pattern.value, testString.value, flags.value)
  })

  const replacedText = computed(() =>
    replaceMatches(pattern.value, testString.value, replacement.value, flags.value),
  )

  const fullPattern = computed(() => formatFullPattern(pattern.value, flags.value))

  // Actions
  const usePattern = (p: string) => {
    pattern.value = p
  }

  const loadSampleData = () => {
    pattern.value = SAMPLE_DATA.pattern
    testString.value = SAMPLE_DATA.testString
  }

  const clearAll = () => {
    pattern.value = ''
    testString.value = ''
    replacement.value = ''
  }

  return {
    // State
    pattern,
    testString,
    replacement,

    // Flags
    flagGlobal,
    flagCaseInsensitive,
    flagMultiline,
    flagDotAll,
    flagUnicode,
    flags,

    // Visualizer
    showAst,
    svgDiagram,
    astJson,
    visualizerError,

    // Computed
    regexError,
    matches,
    highlightedText,
    replacedText,
    fullPattern,

    // Actions
    usePattern,
    loadSampleData,
    clearAll,
  }
}
