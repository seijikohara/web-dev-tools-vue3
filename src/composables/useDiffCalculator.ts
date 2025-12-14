import { ref, computed } from 'vue'

// Types
export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'header'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface LCSItem {
  origIdx: number
  modIdx: number
}

export interface DiffStats {
  added: number
  removed: number
  unchanged: number
  total: number
}

export interface SplitView {
  left: (DiffLine | null)[]
  right: (DiffLine | null)[]
}

export interface DiffOptions {
  ignoreWhitespace: boolean
  ignoreCase: boolean
}

// Pure functions

// Compute LCS using dynamic programming
export const computeLCS = (orig: string[], mod: string[]): LCSItem[] => {
  const m = orig.length
  const n = mod.length

  // Early return for empty arrays
  if (m === 0 || n === 0) return []

  // Create DP table
  const dp = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))

  // Fill DP table using method chaining
  Array.from({ length: m }, (_, i) => i + 1).forEach(i => {
    Array.from({ length: n }, (_, j) => j + 1).forEach(j => {
      const dpRow = dp[i]
      if (!dpRow) return

      const origChar = orig[i - 1]
      const modChar = mod[j - 1]

      dpRow[j] =
        origChar === modChar
          ? (dp[i - 1]?.[j - 1] ?? 0) + 1
          : Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0)
    })
  })

  // Backtrack using recursive function with early returns
  const backtrack = (i: number, j: number): LCSItem[] => {
    // Early return for base case
    if (i <= 0 || j <= 0) return []

    const origChar = orig[i - 1]
    const modChar = mod[j - 1]

    // Early return for matching characters
    if (origChar === modChar) {
      return [...backtrack(i - 1, j - 1), { origIdx: i - 1, modIdx: j - 1 }]
    }

    // Choose the direction with larger value
    const prevRow = dp[i - 1]?.[j] ?? 0
    const prevCol = dp[i]?.[j - 1] ?? 0

    return prevRow > prevCol ? backtrack(i - 1, j) : backtrack(i, j - 1)
  }

  return backtrack(m, n)
}

// Generate range of DiffLines for removed lines
export const generateRemovedLines = (
  lines: string[],
  startIdx: number,
  endIdx: number,
): DiffLine[] =>
  Array.from({ length: endIdx - startIdx }, (_, i) => ({
    type: 'removed' as const,
    content: lines[startIdx + i] ?? '',
    oldLineNumber: startIdx + i + 1,
  }))

// Generate range of DiffLines for added lines
export const generateAddedLines = (lines: string[], startIdx: number, endIdx: number): DiffLine[] =>
  Array.from({ length: endIdx - startIdx }, (_, i) => ({
    type: 'added' as const,
    content: lines[startIdx + i] ?? '',
    newLineNumber: startIdx + i + 1,
  }))

// Process lines with options (pure function)
const processLines = (lines: string[], options: DiffOptions): string[] => {
  const trimmed = options.ignoreWhitespace ? lines.map(l => l.trim()) : lines
  return options.ignoreCase ? trimmed.map(l => l.toLowerCase()) : trimmed
}

// Main diff algorithm (Myers-like approach using LCS)
export const computeDiff = (
  original: string,
  modified: string,
  options: DiffOptions = { ignoreWhitespace: false, ignoreCase: false },
): DiffLine[] => {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')

  // Process lines for comparison
  const processedOrigLines = processLines(originalLines, options)
  const processedModLines = processLines(modifiedLines, options)

  // LCS-based diff
  const lcs = computeLCS(processedOrigLines, processedModLines)

  // Early return for empty LCS
  if (lcs.length === 0) {
    return [
      ...generateRemovedLines(originalLines, 0, originalLines.length),
      ...generateAddedLines(modifiedLines, 0, modifiedLines.length),
    ]
  }

  // Define accumulator type for reduce
  interface DiffAccumulator {
    result: DiffLine[]
    origIdx: number
    modIdx: number
  }

  // Process LCS items using reduce to build diff result
  const { result, origIdx, modIdx } = lcs.reduce<DiffAccumulator>(
    (acc, item) => {
      const removedLines = generateRemovedLines(originalLines, acc.origIdx, item.origIdx)
      const addedLines = generateAddedLines(modifiedLines, acc.modIdx, item.modIdx)
      const unchangedLine = {
        type: 'unchanged',
        content: originalLines[item.origIdx] ?? '',
        oldLineNumber: item.origIdx + 1,
        newLineNumber: item.modIdx + 1,
      } satisfies DiffLine

      return {
        result: [...acc.result, ...removedLines, ...addedLines, unchangedLine],
        origIdx: item.origIdx + 1,
        modIdx: item.modIdx + 1,
      }
    },
    { result: [], origIdx: 0, modIdx: 0 },
  )

  // Add remaining lines after last LCS item
  const remainingRemoved = generateRemovedLines(originalLines, origIdx, originalLines.length)
  const remainingAdded = generateAddedLines(modifiedLines, modIdx, modifiedLines.length)

  return [...result, ...remainingRemoved, ...remainingAdded]
}

// Calculate diff statistics using reduce (single pass instead of multiple filters)
export const calculateDiffStats = (diffLines: DiffLine[]): DiffStats => {
  // Early return for empty diff
  if (diffLines.length === 0) {
    return { added: 0, removed: 0, unchanged: 0, total: 0 }
  }

  const stats = diffLines.reduce(
    (acc, line) => {
      switch (line.type) {
        case 'added':
          return { ...acc, added: acc.added + 1 }
        case 'removed':
          return { ...acc, removed: acc.removed + 1 }
        case 'unchanged':
          return { ...acc, unchanged: acc.unchanged + 1 }
        default:
          return acc
      }
    },
    { added: 0, removed: 0, unchanged: 0 },
  )

  return {
    ...stats,
    total: stats.added + stats.removed + stats.unchanged,
  }
}

// Create padding array (pure helper function)
const createPadding = (length: number): null[] => Array.from({ length }, () => null)

// Build split view data structure
export const buildSplitView = (diffLines: DiffLine[]): SplitView => {
  // Early return for empty diff
  if (diffLines.length === 0) {
    return { left: [], right: [] }
  }

  const { left, right } = diffLines.reduce<{
    left: (DiffLine | null)[]
    right: (DiffLine | null)[]
  }>(
    (acc, line) => {
      // Early return pattern using switch
      switch (line.type) {
        case 'unchanged': {
          const leftPadding = createPadding(Math.max(0, acc.right.length - acc.left.length))
          const rightPadding = createPadding(Math.max(0, acc.left.length - acc.right.length))

          return {
            left: [...acc.left, ...leftPadding, line],
            right: [...acc.right, ...rightPadding, line],
          }
        }

        case 'removed':
          return { ...acc, left: [...acc.left, line] }

        case 'added':
          return { ...acc, right: [...acc.right, line] }

        default:
          return acc
      }
    },
    { left: [], right: [] },
  )

  // Pad to equal length
  const maxLength = Math.max(left.length, right.length)

  return {
    left: [...left, ...createPadding(maxLength - left.length)],
    right: [...right, ...createPadding(maxLength - right.length)],
  }
}

// Format diff as text for copying (using switch for early return pattern)
export const formatDiffAsText = (diffLines: DiffLine[]): string => {
  // Early return for empty diff
  if (diffLines.length === 0) return ''

  return diffLines
    .map(line => {
      switch (line.type) {
        case 'added':
          return `+ ${line.content}`
        case 'removed':
          return `- ${line.content}`
        default:
          return `  ${line.content}`
      }
    })
    .join('\n')
}

// Sample texts for demo
export const SAMPLE_ORIGINAL = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const message = "Welcome";
greet(message);`

export const SAMPLE_MODIFIED = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return true;
}

const message = "Welcome";
const customGreeting = "Hi";
greet(message, customGreeting);`

// View mode options
export const VIEW_MODE_OPTIONS = [
  { label: 'Unified', value: 'unified', icon: 'pi pi-list' },
  { label: 'Split', value: 'split', icon: 'pi pi-table' },
]

export type ViewMode = 'unified' | 'split'

// Composable
export const useDiffCalculator = () => {
  // State
  const originalText = ref('')
  const modifiedText = ref('')
  const viewMode = ref<ViewMode>('unified')
  const ignoreWhitespace = ref(false)
  const ignoreCase = ref(false)

  // Computed
  const options = computed(
    () =>
      ({
        ignoreWhitespace: ignoreWhitespace.value,
        ignoreCase: ignoreCase.value,
      }) satisfies DiffOptions,
  )

  const diffResult = computed(() => {
    // Early return for empty inputs
    if (!originalText.value && !modifiedText.value) return []
    return computeDiff(originalText.value, modifiedText.value, options.value)
  })

  const stats = computed(() => calculateDiffStats(diffResult.value))

  const hasChanges = computed(() => stats.value.added > 0 || stats.value.removed > 0)

  const hasDiff = computed(() => diffResult.value.length > 0)

  const splitView = computed(() => buildSplitView(diffResult.value))

  const diffAsText = computed(() => formatDiffAsText(diffResult.value))

  const originalLineCount = computed(() => originalText.value.split('\n').length)

  const modifiedLineCount = computed(() => modifiedText.value.split('\n').length)

  // Actions
  const clear = () => {
    originalText.value = ''
    modifiedText.value = ''
  }

  const loadSample = () => {
    originalText.value = SAMPLE_ORIGINAL
    modifiedText.value = SAMPLE_MODIFIED
  }

  return {
    // State
    originalText,
    modifiedText,
    viewMode,
    ignoreWhitespace,
    ignoreCase,

    // Computed
    diffResult,
    stats,
    hasChanges,
    hasDiff,
    splitView,
    diffAsText,
    originalLineCount,
    modifiedLineCount,

    // Actions
    clear,
    loadSample,
  }
}
