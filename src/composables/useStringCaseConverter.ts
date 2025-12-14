import { ref, computed } from 'vue'

// Pure helper functions
const capitalizeWord = (word: string): string =>
  `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`

const isEvenIndex = (index: number): boolean => index % 2 === 0

const isUpperCase = (char: string): boolean => char === char.toUpperCase()

// Helper: Split string into words
export const splitIntoWords = (str: string): string[] => {
  if (!str) return []

  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // XMLParser -> XML Parser
    .replace(/[-_./\\]+/g, ' ') // Replace separators with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .split(' ')
    .filter(Boolean)
}

// Word transformation functions (pure)
const transformWordsAndJoin = (
  words: readonly string[],
  transform: (word: string, index: number) => string,
  separator: string,
): string => words.map(transform).join(separator)

// Case conversion functions
export const toCamelCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(
    words,
    (word, index) => (index === 0 ? word.toLowerCase() : capitalizeWord(word)),
    '',
  )
}

export const toPascalCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, capitalizeWord, '')
}

export const toSnakeCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toLowerCase(), '_')
}

export const toScreamingSnakeCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toUpperCase(), '_')
}

export const toKebabCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toLowerCase(), '-')
}

export const toScreamingKebabCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toUpperCase(), '-')
}

export const toTrainCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, capitalizeWord, '-')
}

export const toDotCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toLowerCase(), '.')
}

export const toPathCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toLowerCase(), '/')
}

export const toTitleCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, capitalizeWord, ' ')
}

export const toSentenceCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(
    words,
    (word, index) => (index === 0 ? capitalizeWord(word) : word.toLowerCase()),
    ' ',
  )
}

export const toUpperCase = (str: string): string => str.toUpperCase()

export const toLowerCase = (str: string): string => str.toLowerCase()

export const toFlatCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toLowerCase(), '')
}

export const toUpperFlatCase = (str: string): string => {
  const words = splitIntoWords(str)
  if (words.length === 0) return ''

  return transformWordsAndJoin(words, word => word.toUpperCase(), '')
}

export const toAlternatingCase = (str: string): string =>
  Array.from(str)
    .map((char, index) => (isEvenIndex(index) ? char.toLowerCase() : char.toUpperCase()))
    .join('')

export const toInverseCase = (str: string): string =>
  Array.from(str)
    .map(char => (isUpperCase(char) ? char.toLowerCase() : char.toUpperCase()))
    .join('')

// Types
export interface CaseDefinition {
  readonly name: string
  readonly key: string
  readonly converter: (str: string) => string
  readonly example: string
  readonly description: string
}

export interface ConversionResult extends CaseDefinition {
  readonly result: string
}

export interface TextStats {
  readonly chars: number
  readonly words: number
}

// Case definitions
export const CASE_DEFINITIONS = [
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
] as const satisfies readonly CaseDefinition[]

// Convert a string to a specific case by key
export const convertCase = (str: string, caseKey: string): string | null => {
  if (!str || !caseKey) return null

  const definition = CASE_DEFINITIONS.find(def => def.key === caseKey)
  return definition?.converter(str) ?? null
}

// Pure helper for creating conversion result
const createConversionResult = (def: CaseDefinition, input: string): ConversionResult => ({
  ...def,
  result: def.converter(input),
})

// Pure helper for calculating text stats
const calculateTextStats = (text: string): TextStats => {
  const words = splitIntoWords(text)
  return {
    chars: text.length,
    words: words.length,
  }
}

// Composable
export const useStringCaseConverter = () => {
  // State
  const inputText = ref('')

  // Computed
  const conversions = computed<readonly ConversionResult[]>(() => {
    const trimmedInput = inputText.value.trim()
    if (!trimmedInput) return []

    return CASE_DEFINITIONS.map(def => createConversionResult(def, inputText.value))
  })

  const inputStats = computed<TextStats | null>(() => {
    if (!inputText.value) return null
    return calculateTextStats(inputText.value)
  })

  const hasInput = computed(() => inputText.value.length > 0)

  const hasResults = computed(() => conversions.value.length > 0)

  // Actions
  const loadSample = (): void => {
    inputText.value = 'hello world example'
  }

  const clear = (): void => {
    inputText.value = ''
  }

  const getConversionByKey = (key: string): ConversionResult | undefined => {
    if (!key) return undefined
    return conversions.value.find(c => c.key === key)
  }

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
