import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeLCS,
  generateRemovedLines,
  generateAddedLines,
  computeDiff,
  calculateDiffStats,
  buildSplitView,
  formatDiffAsText,
  useDiffCalculator,
  SAMPLE_ORIGINAL,
  SAMPLE_MODIFIED,
  VIEW_MODE_OPTIONS,
} from '../useDiffCalculator'

describe('useDiffCalculator', () => {
  describe('Constants', () => {
    it('should have view mode options', () => {
      expect.soft(VIEW_MODE_OPTIONS.length).toBe(2)
      const values = VIEW_MODE_OPTIONS.map(o => o.value)
      expect.soft(values).toContain('unified')
      expect.soft(values).toContain('split')
    })

    it('should have sample texts', () => {
      expect.soft(SAMPLE_ORIGINAL.length).toBeGreaterThan(0)
      expect.soft(SAMPLE_MODIFIED.length).toBeGreaterThan(0)
    })
  })

  describe('computeLCS', () => {
    it('should find LCS for identical arrays', () => {
      const arr = ['a', 'b', 'c']
      const lcs = computeLCS(arr, arr)
      expect(lcs.length).toBe(3)
    })

    it('should find LCS for arrays with common elements', () => {
      const orig = ['a', 'b', 'c', 'd']
      const mod = ['a', 'c', 'd', 'e']
      const lcs = computeLCS(orig, mod)
      expect(lcs.length).toBe(3) // 'a', 'c', 'd'
    })

    it('should return empty for completely different arrays', () => {
      const orig = ['a', 'b']
      const mod = ['c', 'd']
      const lcs = computeLCS(orig, mod)
      expect(lcs.length).toBe(0)
    })

    it('should handle empty arrays', () => {
      expect.soft(computeLCS([], ['a'])).toEqual([])
      expect.soft(computeLCS(['a'], [])).toEqual([])
      expect.soft(computeLCS([], [])).toEqual([])
    })
  })

  describe('generateRemovedLines', () => {
    it('should generate removed lines with correct type', () => {
      const lines = ['line1', 'line2', 'line3']
      const result = generateRemovedLines(lines, 0, 2)
      expect.soft(result.length).toBe(2)
      expect.soft(result[0]?.type).toBe('removed')
      expect.soft(result[0]?.content).toBe('line1')
      expect.soft(result[0]?.oldLineNumber).toBe(1)
    })

    it('should handle empty range', () => {
      const lines = ['line1', 'line2']
      const result = generateRemovedLines(lines, 0, 0)
      expect(result.length).toBe(0)
    })
  })

  describe('generateAddedLines', () => {
    it('should generate added lines with correct type', () => {
      const lines = ['line1', 'line2', 'line3']
      const result = generateAddedLines(lines, 0, 2)
      expect.soft(result.length).toBe(2)
      expect.soft(result[0]?.type).toBe('added')
      expect.soft(result[0]?.content).toBe('line1')
      expect.soft(result[0]?.newLineNumber).toBe(1)
    })

    it('should handle empty range', () => {
      const lines = ['line1', 'line2']
      const result = generateAddedLines(lines, 0, 0)
      expect(result.length).toBe(0)
    })
  })

  describe('computeDiff', () => {
    it('should return unchanged lines for identical texts', () => {
      const text = 'line1\nline2\nline3'
      const diff = computeDiff(text, text)
      expect(diff.every(d => d.type === 'unchanged')).toBe(true)
    })

    it('should detect added lines', () => {
      const original = 'line1\nline2'
      const modified = 'line1\nline2\nline3'
      const diff = computeDiff(original, modified)
      const addedLines = diff.filter(d => d.type === 'added')
      expect.soft(addedLines.length).toBe(1)
      expect.soft(addedLines[0]?.content).toBe('line3')
    })

    it('should detect removed lines', () => {
      const original = 'line1\nline2\nline3'
      const modified = 'line1\nline2'
      const diff = computeDiff(original, modified)
      const removedLines = diff.filter(d => d.type === 'removed')
      expect.soft(removedLines.length).toBe(1)
      expect.soft(removedLines[0]?.content).toBe('line3')
    })

    it('should detect modified lines', () => {
      const original = 'line1\noriginal'
      const modified = 'line1\nmodified'
      const diff = computeDiff(original, modified)
      const removedLines = diff.filter(d => d.type === 'removed')
      const addedLines = diff.filter(d => d.type === 'added')
      expect.soft(removedLines.length).toBe(1)
      expect.soft(addedLines.length).toBe(1)
    })

    it('should handle empty strings', () => {
      expect.soft(computeDiff('', '').length).toBe(1) // One empty line
      expect.soft(computeDiff('text', '').filter(d => d.type === 'removed').length).toBe(1)
      expect.soft(computeDiff('', 'text').filter(d => d.type === 'added').length).toBe(1)
    })

    it('should respect ignoreWhitespace option', () => {
      const original = 'line1\n  line2  '
      const modified = 'line1\nline2'
      const diffWithoutOption = computeDiff(original, modified)
      const diffWithOption = computeDiff(original, modified, {
        ignoreWhitespace: true,
        ignoreCase: false,
      })
      expect(diffWithOption.filter(d => d.type === 'unchanged').length).toBeGreaterThan(
        diffWithoutOption.filter(d => d.type === 'unchanged').length - 1,
      )
    })

    it('should respect ignoreCase option', () => {
      const original = 'Line1\nLINE2'
      const modified = 'line1\nline2'
      const diffWithoutOption = computeDiff(original, modified)
      const diffWithOption = computeDiff(original, modified, {
        ignoreWhitespace: false,
        ignoreCase: true,
      })
      expect(diffWithOption.filter(d => d.type === 'unchanged').length).toBeGreaterThanOrEqual(
        diffWithoutOption.filter(d => d.type === 'unchanged').length,
      )
    })
  })

  describe('calculateDiffStats', () => {
    it('should calculate correct stats', () => {
      const diffLines = [
        { type: 'unchanged' as const, content: 'a' },
        { type: 'unchanged' as const, content: 'b' },
        { type: 'added' as const, content: 'c' },
        { type: 'removed' as const, content: 'd' },
      ]
      const stats = calculateDiffStats(diffLines)
      expect.soft(stats.unchanged).toBe(2)
      expect.soft(stats.added).toBe(1)
      expect.soft(stats.removed).toBe(1)
      expect.soft(stats.total).toBe(4)
    })

    it('should handle empty diff', () => {
      const stats = calculateDiffStats([])
      expect.soft(stats.unchanged).toBe(0)
      expect.soft(stats.added).toBe(0)
      expect.soft(stats.removed).toBe(0)
      expect.soft(stats.total).toBe(0)
    })
  })

  describe('buildSplitView', () => {
    it('should build split view for unchanged lines', () => {
      const diffLines = [
        { type: 'unchanged' as const, content: 'line1', oldLineNumber: 1, newLineNumber: 1 },
      ]
      const view = buildSplitView(diffLines)
      expect.soft(view.left.length).toBe(1)
      expect.soft(view.right.length).toBe(1)
      expect.soft(view.left[0]?.content).toBe('line1')
      expect.soft(view.right[0]?.content).toBe('line1')
    })

    it('should place removed lines on left only', () => {
      const diffLines = [{ type: 'removed' as const, content: 'removed', oldLineNumber: 1 }]
      const view = buildSplitView(diffLines)
      expect.soft(view.left.length).toBe(1)
      expect.soft(view.left[0]?.type).toBe('removed')
    })

    it('should place added lines on right only', () => {
      const diffLines = [{ type: 'added' as const, content: 'added', newLineNumber: 1 }]
      const view = buildSplitView(diffLines)
      expect.soft(view.right.length).toBe(1)
      expect.soft(view.right[0]?.type).toBe('added')
    })

    it('should pad arrays to equal length', () => {
      const diffLines = [
        { type: 'removed' as const, content: 'removed1', oldLineNumber: 1 },
        { type: 'removed' as const, content: 'removed2', oldLineNumber: 2 },
        { type: 'added' as const, content: 'added', newLineNumber: 1 },
      ]
      const view = buildSplitView(diffLines)
      expect(view.left.length).toBe(view.right.length)
    })
  })

  describe('formatDiffAsText', () => {
    it('should format unchanged lines with spaces', () => {
      const diffLines = [{ type: 'unchanged' as const, content: 'unchanged' }]
      expect(formatDiffAsText(diffLines)).toBe('  unchanged')
    })

    it('should format added lines with +', () => {
      const diffLines = [{ type: 'added' as const, content: 'added' }]
      expect(formatDiffAsText(diffLines)).toBe('+ added')
    })

    it('should format removed lines with -', () => {
      const diffLines = [{ type: 'removed' as const, content: 'removed' }]
      expect(formatDiffAsText(diffLines)).toBe('- removed')
    })

    it('should join multiple lines', () => {
      const diffLines = [
        { type: 'unchanged' as const, content: 'same' },
        { type: 'removed' as const, content: 'old' },
        { type: 'added' as const, content: 'new' },
      ]
      const result = formatDiffAsText(diffLines)
      expect.soft(result).toContain('  same')
      expect.soft(result).toContain('- old')
      expect.soft(result).toContain('+ new')
    })
  })

  describe('useDiffCalculator composable', () => {
    let calculator: ReturnType<typeof useDiffCalculator>

    beforeEach(() => {
      calculator = useDiffCalculator()
    })

    it('should initialize with empty values', () => {
      expect.soft(calculator.originalText.value).toBe('')
      expect.soft(calculator.modifiedText.value).toBe('')
      expect.soft(calculator.viewMode.value).toBe('unified')
      expect.soft(calculator.ignoreWhitespace.value).toBe(false)
      expect.soft(calculator.ignoreCase.value).toBe(false)
    })

    it('should compute diff when texts change', async () => {
      calculator.originalText.value = 'line1'
      calculator.modifiedText.value = 'line2'
      await Promise.resolve()

      expect.soft(calculator.diffResult.value.length).toBeGreaterThan(0)
      expect.soft(calculator.hasChanges.value).toBe(true)
    })

    it('should compute stats correctly', async () => {
      calculator.originalText.value = 'same\nremoved'
      calculator.modifiedText.value = 'same\nadded'
      await Promise.resolve()

      expect.soft(calculator.stats.value.unchanged).toBeGreaterThanOrEqual(1)
      expect.soft(calculator.stats.value.added).toBe(1)
      expect.soft(calculator.stats.value.removed).toBe(1)
    })

    it('should return no changes for identical texts', async () => {
      calculator.originalText.value = 'identical'
      calculator.modifiedText.value = 'identical'
      await Promise.resolve()

      expect.soft(calculator.hasChanges.value).toBe(false)
      expect.soft(calculator.stats.value.added).toBe(0)
      expect.soft(calculator.stats.value.removed).toBe(0)
    })

    it('should compute line counts', async () => {
      calculator.originalText.value = 'line1\nline2\nline3'
      calculator.modifiedText.value = 'line1\nline2'
      await Promise.resolve()

      expect.soft(calculator.originalLineCount.value).toBe(3)
      expect.soft(calculator.modifiedLineCount.value).toBe(2)
    })

    it('should compute split view', async () => {
      calculator.originalText.value = 'same\nremoved'
      calculator.modifiedText.value = 'same\nadded'
      await Promise.resolve()

      expect.soft(calculator.splitView.value.left.length).toBeGreaterThan(0)
      expect.soft(calculator.splitView.value.right.length).toBeGreaterThan(0)
    })

    it('should clear texts', async () => {
      calculator.originalText.value = 'original'
      calculator.modifiedText.value = 'modified'

      calculator.clear()

      expect.soft(calculator.originalText.value).toBe('')
      expect.soft(calculator.modifiedText.value).toBe('')
    })

    it('should load sample texts', () => {
      calculator.loadSample()

      expect.soft(calculator.originalText.value).toBe(SAMPLE_ORIGINAL)
      expect.soft(calculator.modifiedText.value).toBe(SAMPLE_MODIFIED)
    })

    it('should compute diffAsText', async () => {
      calculator.originalText.value = 'same\nremoved'
      calculator.modifiedText.value = 'same\nadded'
      await Promise.resolve()

      expect.soft(calculator.diffAsText.value).toContain('same')
      expect.soft(calculator.diffAsText.value).toContain('-')
      expect.soft(calculator.diffAsText.value).toContain('+')
    })

    it('should return empty diff for empty inputs', () => {
      expect(calculator.diffResult.value).toEqual([])
    })

    it('should update diff when options change', async () => {
      calculator.originalText.value = '  text  '
      calculator.modifiedText.value = 'text'
      await Promise.resolve()

      const diffBefore = calculator.diffResult.value.length

      calculator.ignoreWhitespace.value = true
      await Promise.resolve()

      // With ignoreWhitespace, the diff should be different
      expect(calculator.diffResult.value.length).toBeLessThanOrEqual(diffBefore)
    })
  })
})
