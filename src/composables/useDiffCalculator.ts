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

  // Create DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))

  // Fill DP table
  Array.from({ length: m }, (_, idx) => idx + 1).forEach(i => {
    Array.from({ length: n }, (_, idx) => idx + 1).forEach(j => {
      const dpRow = dp[i]
      if (!dpRow) return
      if (orig[i - 1] === mod[j - 1]) {
        dpRow[j] = (dp[i - 1]?.[j - 1] ?? 0) + 1
      } else {
        dpRow[j] = Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0)
      }
    })
  })

  // Backtrack using recursive function
  const backtrack = (i: number, j: number): LCSItem[] => {
    if (i <= 0 || j <= 0) return []

    if (orig[i - 1] === mod[j - 1]) {
      return [...backtrack(i - 1, j - 1), { origIdx: i - 1, modIdx: j - 1 }]
    }

    return (dp[i - 1]?.[j] ?? 0) > (dp[i]?.[j - 1] ?? 0) ? backtrack(i - 1, j) : backtrack(i, j - 1)
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

// Main diff algorithm (Myers-like approach using LCS)
export const computeDiff = (
  original: string,
  modified: string,
  options: DiffOptions = { ignoreWhitespace: false, ignoreCase: false },
): DiffLine[] => {
  const rawOrigLines = original.split('\n')
  const rawModLines = modified.split('\n')

  const origLines = options.ignoreWhitespace ? rawOrigLines.map(l => l.trim()) : rawOrigLines
  const modLines = options.ignoreWhitespace ? rawModLines.map(l => l.trim()) : rawModLines

  const processedOrigLines = options.ignoreCase ? origLines.map(l => l.toLowerCase()) : origLines
  const processedModLines = options.ignoreCase ? modLines.map(l => l.toLowerCase()) : modLines

  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')

  // LCS-based diff
  const lcs = computeLCS(processedOrigLines, processedModLines)

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
      const unchangedLine: DiffLine = {
        type: 'unchanged',
        content: originalLines[item.origIdx] ?? '',
        oldLineNumber: item.origIdx + 1,
        newLineNumber: item.modIdx + 1,
      }

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

// Calculate diff statistics
export const calculateDiffStats = (diffLines: DiffLine[]): DiffStats => {
  const added = diffLines.filter(d => d.type === 'added').length
  const removed = diffLines.filter(d => d.type === 'removed').length
  const unchanged = diffLines.filter(d => d.type === 'unchanged').length
  return { added, removed, unchanged, total: added + removed + unchanged }
}

// Build split view data structure
export const buildSplitView = (diffLines: DiffLine[]): SplitView => {
  const { left, right } = diffLines.reduce(
    (acc, line) => {
      if (line.type === 'unchanged') {
        const leftPadding = Array.from<null>({
          length: Math.max(0, acc.right.length - acc.left.length),
        }).fill(null)
        const rightPadding = Array.from<null>({
          length: Math.max(0, acc.left.length - acc.right.length),
        }).fill(null)

        return {
          left: [...acc.left, ...leftPadding, line],
          right: [...acc.right, ...rightPadding, line],
        }
      }

      if (line.type === 'removed') {
        return { left: [...acc.left, line], right: acc.right }
      }

      if (line.type === 'added') {
        return { left: acc.left, right: [...acc.right, line] }
      }

      return acc
    },
    { left: [] as (DiffLine | null)[], right: [] as (DiffLine | null)[] },
  )

  // Pad to equal length
  const maxLength = Math.max(left.length, right.length)
  const finalLeftPadding = Array.from<null>({ length: maxLength - left.length }).fill(null)
  const finalRightPadding = Array.from<null>({ length: maxLength - right.length }).fill(null)

  return {
    left: [...left, ...finalLeftPadding],
    right: [...right, ...finalRightPadding],
  }
}

// Format diff as text for copying
export const formatDiffAsText = (diffLines: DiffLine[]): string =>
  diffLines
    .map(line => {
      if (line.type === 'added') return `+ ${line.content}`
      if (line.type === 'removed') return `- ${line.content}`
      return `  ${line.content}`
    })
    .join('\n')

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
  const options = computed<DiffOptions>(() => ({
    ignoreWhitespace: ignoreWhitespace.value,
    ignoreCase: ignoreCase.value,
  }))

  const diffResult = computed(() => {
    if (!originalText.value && !modifiedText.value) return []
    return computeDiff(originalText.value, modifiedText.value, options.value)
  })

  const stats = computed(() => calculateDiffStats(diffResult.value))

  const hasChanges = computed(() => stats.value.added > 0 || stats.value.removed > 0)

  const hasDiff = computed(() => diffResult.value.length > 0)

  const splitView = computed(() => buildSplitView(diffResult.value))

  const diffAsText = computed(() => formatDiffAsText(diffResult.value))

  const originalLineCount = computed(() =>
    originalText.value ? originalText.value.split('\n').length : 0,
  )

  const modifiedLineCount = computed(() =>
    modifiedText.value ? modifiedText.value.split('\n').length : 0,
  )

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
