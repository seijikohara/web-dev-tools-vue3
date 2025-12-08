import { ref, computed } from 'vue'

// Helper: Split string into words
export const splitIntoWords = (str: string): string[] =>
  str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // XMLParser -> XML Parser
    .replace(/[-_./\\]+/g, ' ') // Replace separators with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .split(' ')
    .filter(Boolean)

// Case conversion functions
export const toCamelCase = (str: string): string =>
  splitIntoWords(str)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')

export const toPascalCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')

export const toSnakeCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toLowerCase())
    .join('_')

export const toScreamingSnakeCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toUpperCase())
    .join('_')

export const toKebabCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toLowerCase())
    .join('-')

export const toScreamingKebabCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toUpperCase())
    .join('-')

export const toTrainCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-')

export const toDotCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toLowerCase())
    .join('.')

export const toPathCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toLowerCase())
    .join('/')

export const toTitleCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

export const toSentenceCase = (str: string): string =>
  splitIntoWords(str)
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase(),
    )
    .join(' ')

export const toUpperCase = (str: string): string => str.toUpperCase()

export const toLowerCase = (str: string): string => str.toLowerCase()

export const toFlatCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toLowerCase())
    .join('')

export const toUpperFlatCase = (str: string): string =>
  splitIntoWords(str)
    .map(word => word.toUpperCase())
    .join('')

export const toAlternatingCase = (str: string): string =>
  Array.from(str)
    .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
    .join('')

export const toInverseCase = (str: string): string =>
  Array.from(str)
    .map(char => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()))
    .join('')

// Types
export interface CaseDefinition {
  name: string
  key: string
  converter: (str: string) => string
  example: string
  description: string
}

export interface ConversionResult extends CaseDefinition {
  result: string
}

export interface TextStats {
  chars: number
  words: number
}

// Case definitions
export const CASE_DEFINITIONS: CaseDefinition[] = [
  {
    name: 'camelCase',
    key: 'camel',
    converter: toCamelCase,
    example: 'myVariableName',
    description: 'First word lowercase, subsequent words capitalized',
  },
  {
    name: 'PascalCase',
    key: 'pascal',
    converter: toPascalCase,
    example: 'MyClassName',
    description: 'All words capitalized, no separator',
  },
  {
    name: 'snake_case',
    key: 'snake',
    converter: toSnakeCase,
    example: 'my_variable_name',
    description: 'All lowercase with underscores',
  },
  {
    name: 'SCREAMING_SNAKE_CASE',
    key: 'screaming_snake',
    converter: toScreamingSnakeCase,
    example: 'MY_CONSTANT_NAME',
    description: 'All uppercase with underscores',
  },
  {
    name: 'kebab-case',
    key: 'kebab',
    converter: toKebabCase,
    example: 'my-css-class',
    description: 'All lowercase with hyphens',
  },
  {
    name: 'SCREAMING-KEBAB-CASE',
    key: 'screaming_kebab',
    converter: toScreamingKebabCase,
    example: 'MY-HEADER-NAME',
    description: 'All uppercase with hyphens',
  },
  {
    name: 'Train-Case',
    key: 'train',
    converter: toTrainCase,
    example: 'My-Train-Case',
    description: 'Capitalized words with hyphens',
  },
  {
    name: 'dot.case',
    key: 'dot',
    converter: toDotCase,
    example: 'my.config.key',
    description: 'All lowercase with dots',
  },
  {
    name: 'path/case',
    key: 'path',
    converter: toPathCase,
    example: 'my/file/path',
    description: 'All lowercase with slashes',
  },
  {
    name: 'Title Case',
    key: 'title',
    converter: toTitleCase,
    example: 'My Title Here',
    description: 'All words capitalized with spaces',
  },
  {
    name: 'Sentence case',
    key: 'sentence',
    converter: toSentenceCase,
    example: 'My sentence here',
    description: 'First word capitalized with spaces',
  },
  {
    name: 'UPPERCASE',
    key: 'upper',
    converter: toUpperCase,
    example: 'UPPERCASE TEXT',
    description: 'All characters uppercase',
  },
  {
    name: 'lowercase',
    key: 'lower',
    converter: toLowerCase,
    example: 'lowercase text',
    description: 'All characters lowercase',
  },
  {
    name: 'flatcase',
    key: 'flat',
    converter: toFlatCase,
    example: 'myflatcase',
    description: 'All lowercase, no separator',
  },
  {
    name: 'UPPERFLATCASE',
    key: 'upper_flat',
    converter: toUpperFlatCase,
    example: 'MYUPPERFLATCASE',
    description: 'All uppercase, no separator',
  },
  {
    name: 'aLtErNaTiNg CaSe',
    key: 'alternating',
    converter: toAlternatingCase,
    example: 'aLtErNaTiNg',
    description: 'Alternating lower and upper case',
  },
  {
    name: 'iNVERSE cASE',
    key: 'inverse',
    converter: toInverseCase,
    example: 'iNVERSE',
    description: 'Swap case of each character',
  },
]

// Convert a string to a specific case by key
export const convertCase = (str: string, caseKey: string): string | null => {
  const definition = CASE_DEFINITIONS.find(def => def.key === caseKey)
  return definition ? definition.converter(str) : null
}

// Composable
export const useStringCaseConverter = () => {
  // State
  const inputText = ref('')

  // Computed
  const conversions = computed<ConversionResult[]>(() => {
    if (!inputText.value.trim()) return []

    return CASE_DEFINITIONS.map(def => ({
      ...def,
      result: def.converter(inputText.value),
    }))
  })

  const inputStats = computed<TextStats | null>(() => {
    if (!inputText.value) return null
    const words = splitIntoWords(inputText.value)
    return {
      chars: inputText.value.length,
      words: words.length,
    }
  })

  const hasInput = computed(() => inputText.value.length > 0)

  const hasResults = computed(() => conversions.value.length > 0)

  // Actions
  const loadSample = () => {
    inputText.value = 'hello world example'
  }

  const clear = () => {
    inputText.value = ''
  }

  const getConversionByKey = (key: string): ConversionResult | undefined =>
    conversions.value.find(c => c.key === key)

  return {
    // State
    inputText,

    // Computed
    conversions,
    inputStats,
    hasInput,
    hasResults,

    // Actions
    loadSample,
    clear,
    getConversionByKey,
  }
}
