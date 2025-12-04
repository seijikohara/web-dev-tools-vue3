<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import CodeEditor from '@/components/CodeEditor.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import SelectButton from 'primevue/selectbutton'

const toast = useToast()
const { copy } = useClipboard()

// State
const originalText = ref('')
const modifiedText = ref('')
const viewMode = ref<'unified' | 'split'>('unified')
const ignoreWhitespace = ref(false)
const ignoreCase = ref(false)

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'header'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

interface LCSItem {
  origIdx: number
  modIdx: number
}

// Compute LCS using functional approach
const computeLCS = (orig: string[], mod: string[]): LCSItem[] => {
  const m = orig.length
  const n = mod.length

  // Create DP table using reduce
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => {
      if (i === 0 || j === 0) return 0
      if (orig[i - 1] === mod[j - 1]) {
        // Need to access previously computed values - build iteratively
        return 0 // Will be filled below
      }
      return 0
    }),
  )

  // Fill DP table iteratively using forEach
  Array.from({ length: m }, (_, idx) => idx + 1).forEach(i => {
    Array.from({ length: n }, (_, idx) => idx + 1).forEach(j => {
      if (orig[i - 1] === mod[j - 1]) {
        dp[i]![j] = (dp[i - 1]?.[j - 1] ?? 0) + 1
      } else {
        dp[i]![j] = Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0)
      }
    })
  })

  // Backtrack using recursive function instead of while loop
  const backtrack = (i: number, j: number): LCSItem[] => {
    if (i <= 0 || j <= 0) return []

    if (orig[i - 1] === mod[j - 1]) {
      return [...backtrack(i - 1, j - 1), { origIdx: i - 1, modIdx: j - 1 }]
    }

    return (dp[i - 1]?.[j] ?? 0) > (dp[i]?.[j - 1] ?? 0) ? backtrack(i - 1, j) : backtrack(i, j - 1)
  }

  return backtrack(m, n)
}

// Generate range of DiffLines for removed/added sections
const generateRemovedLines = (lines: string[], startIdx: number, endIdx: number): DiffLine[] =>
  Array.from({ length: endIdx - startIdx }, (_, i) => ({
    type: 'removed' as const,
    content: lines[startIdx + i] ?? '',
    oldLineNumber: startIdx + i + 1,
  }))

const generateAddedLines = (lines: string[], startIdx: number, endIdx: number): DiffLine[] =>
  Array.from({ length: endIdx - startIdx }, (_, i) => ({
    type: 'added' as const,
    content: lines[startIdx + i] ?? '',
    newLineNumber: startIdx + i + 1,
  }))

// Simple diff algorithm (Myers-like approach)
const computeDiff = (original: string, modified: string): DiffLine[] => {
  const rawOrigLines = original.split('\n')
  const rawModLines = modified.split('\n')

  const origLines = ignoreWhitespace.value ? rawOrigLines.map(l => l.trim()) : rawOrigLines
  const modLines = ignoreWhitespace.value ? rawModLines.map(l => l.trim()) : rawModLines

  const processedOrigLines = ignoreCase.value ? origLines.map(l => l.toLowerCase()) : origLines
  const processedModLines = ignoreCase.value ? modLines.map(l => l.toLowerCase()) : modLines

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
      // Generate removed lines (original lines before this LCS item)
      const removedLines = generateRemovedLines(originalLines, acc.origIdx, item.origIdx)
      // Generate added lines (modified lines before this LCS item)
      const addedLines = generateAddedLines(modifiedLines, acc.modIdx, item.modIdx)
      // Unchanged line at LCS position
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

const diffResult = computed(() => {
  if (!originalText.value && !modifiedText.value) return []
  return computeDiff(originalText.value, modifiedText.value)
})

const stats = computed(() => {
  const added = diffResult.value.filter(d => d.type === 'added').length
  const removed = diffResult.value.filter(d => d.type === 'removed').length
  const unchanged = diffResult.value.filter(d => d.type === 'unchanged').length
  return { added, removed, unchanged, total: added + removed + unchanged }
})

const hasChanges = computed(() => stats.value.added > 0 || stats.value.removed > 0)

// Split view data
const splitView = computed(() => {
  // Build split view using reduce
  const { left, right } = diffResult.value.reduce(
    (acc, line) => {
      if (line.type === 'unchanged') {
        // Pad to align using Array.from
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

  // Pad to equal length using Array.from
  const maxLength = Math.max(left.length, right.length)
  const finalLeftPadding = Array.from<null>({ length: maxLength - left.length }).fill(null)
  const finalRightPadding = Array.from<null>({ length: maxLength - right.length }).fill(null)

  return {
    left: [...left, ...finalLeftPadding],
    right: [...right, ...finalRightPadding],
  }
})

const viewModeOptions = [
  { label: 'Unified', value: 'unified', icon: 'pi pi-list' },
  { label: 'Split', value: 'split', icon: 'pi pi-table' },
]

const copyDiff = () => {
  const diffText = diffResult.value
    .map(line => {
      if (line.type === 'added') return `+ ${line.content}`
      if (line.type === 'removed') return `- ${line.content}`
      return `  ${line.content}`
    })
    .join('\n')

  copy(diffText)
  toast.add({
    severity: 'success',
    summary: 'Copied',
    detail: 'Diff copied to clipboard',
    life: 2000,
  })
}

const swapTexts = () => {
  const temp = originalText.value
  originalText.value = modifiedText.value
  modifiedText.value = temp
}

const clearAll = () => {
  originalText.value = ''
  modifiedText.value = ''
}

// Sample texts for demo
const loadSample = () => {
  originalText.value = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const message = "Welcome";
greet(message);`

  modifiedText.value = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return true;
}

const message = "Welcome";
const customGreeting = "Hi";
greet(message, customGreeting);`
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-arrows-alt"></i>
        <span>Diff Viewer</span>
      </div>
    </template>
    <template #subtitle> Compare two texts and visualize differences </template>
    <template #content>
      <div class="diff-container">
        <!-- Options Panel -->
        <Panel toggleable class="options-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-cog"></i>
              <span>Options</span>
            </div>
          </template>
          <template #icons>
            <Button
              v-tooltip.top="'Load Sample'"
              icon="pi pi-file-import"
              severity="secondary"
              text
              rounded
              @click="loadSample"
            />
            <Button
              v-tooltip.top="'Clear All'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="!originalText && !modifiedText"
              @click="clearAll"
            />
          </template>

          <div class="options-content">
            <div class="option-group">
              <label>
                <i class="pi pi-eye"></i>
                View Mode
              </label>
              <SelectButton
                v-model="viewMode"
                :options="viewModeOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="slotProps">
                  <div class="view-mode-option">
                    <i :class="slotProps.option.icon"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </SelectButton>
            </div>

            <Divider layout="vertical" class="vertical-divider" />

            <div class="toggle-options">
              <div class="toggle-option">
                <ToggleSwitch v-model="ignoreWhitespace" inputId="ignoreWs" />
                <label for="ignoreWs">
                  <Tag
                    value="Whitespace"
                    :severity="ignoreWhitespace ? 'warn' : 'secondary'"
                    icon="pi pi-minus"
                  />
                  <span>Ignore whitespace</span>
                </label>
              </div>
              <div class="toggle-option">
                <ToggleSwitch v-model="ignoreCase" inputId="ignoreCase" />
                <label for="ignoreCase">
                  <Tag value="Aa" :severity="ignoreCase ? 'warn' : 'secondary'" />
                  <span>Ignore case</span>
                </label>
              </div>
            </div>
          </div>
        </Panel>

        <!-- Input Section -->
        <div class="input-section">
          <Panel class="input-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-file"></i>
                <span>Original</span>
                <Tag
                  v-if="originalText"
                  :value="`${originalText.split('\n').length} lines`"
                  severity="secondary"
                />
              </div>
            </template>
            <CodeEditor v-model="originalText" mode="plain_text" height="250px" />
          </Panel>

          <div class="swap-button-container">
            <Button
              v-tooltip.top="'Swap texts'"
              icon="pi pi-arrows-h"
              severity="secondary"
              rounded
              @click="swapTexts"
            />
          </div>

          <Panel class="input-panel">
            <template #header>
              <div class="panel-header">
                <i class="pi pi-file-edit"></i>
                <span>Modified</span>
                <Tag
                  v-if="modifiedText"
                  :value="`${modifiedText.split('\n').length} lines`"
                  severity="secondary"
                />
              </div>
            </template>
            <CodeEditor v-model="modifiedText" mode="plain_text" height="250px" />
          </Panel>
        </div>

        <!-- Results Section -->
        <div v-if="diffResult.length > 0" class="results">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-chart-bar"></i>
              Comparison Results
            </span>
          </Divider>

          <Toolbar class="stats-toolbar">
            <template #start>
              <div class="stats-tags">
                <Tag :value="`+${stats.added} additions`" severity="success" icon="pi pi-plus" />
                <Tag :value="`-${stats.removed} deletions`" severity="danger" icon="pi pi-minus" />
                <Tag
                  :value="`${stats.unchanged} unchanged`"
                  severity="secondary"
                  icon="pi pi-check"
                />
              </div>
            </template>
            <template #end>
              <Button
                icon="pi pi-copy"
                label="Copy Diff"
                severity="secondary"
                :disabled="!hasChanges"
                @click="copyDiff"
              />
            </template>
          </Toolbar>

          <Message v-if="!hasChanges" severity="info" :closable="false">
            <div class="message-content">
              <i class="pi pi-check-circle"></i>
              <span>No differences found between the two texts.</span>
            </div>
          </Message>

          <!-- Unified View -->
          <div v-if="viewMode === 'unified' && hasChanges" class="diff-output unified">
            <div
              v-for="(line, index) in diffResult"
              :key="index"
              class="diff-line"
              :class="{
                'line-added': line.type === 'added',
                'line-removed': line.type === 'removed',
                'line-unchanged': line.type === 'unchanged',
              }"
            >
              <span class="line-number old">{{ line.oldLineNumber || '' }}</span>
              <span class="line-number new">{{ line.newLineNumber || '' }}</span>
              <span class="line-prefix">{{
                line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '
              }}</span>
              <span class="line-content">{{ line.content }}</span>
            </div>
          </div>

          <!-- Split View -->
          <div v-if="viewMode === 'split' && hasChanges" class="diff-output split">
            <div class="split-panel">
              <div class="panel-title">
                <i class="pi pi-file"></i>
                <span>Original</span>
              </div>
              <div class="split-content">
                <div
                  v-for="(line, index) in splitView.left"
                  :key="'left-' + index"
                  class="diff-line"
                  :class="{
                    'line-removed': line?.type === 'removed',
                    'line-unchanged': line?.type === 'unchanged',
                    'line-empty': !line,
                  }"
                >
                  <span class="line-number">{{ line?.oldLineNumber || '' }}</span>
                  <span class="line-content">{{ line?.content ?? '' }}</span>
                </div>
              </div>
            </div>
            <div class="split-panel">
              <div class="panel-title">
                <i class="pi pi-file-edit"></i>
                <span>Modified</span>
              </div>
              <div class="split-content">
                <div
                  v-for="(line, index) in splitView.right"
                  :key="'right-' + index"
                  class="diff-line"
                  :class="{
                    'line-added': line?.type === 'added',
                    'line-unchanged': line?.type === 'unchanged',
                    'line-empty': !line,
                  }"
                >
                  <span class="line-number">{{ line?.newLineNumber || '' }}</span>
                  <span class="line-content">{{ line?.content ?? '' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="pi pi-arrows-alt"></i>
          <span>Enter text in both panels to compare</span>
          <Button
            label="Load Sample"
            icon="pi pi-file-import"
            severity="secondary"
            @click="loadSample"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.diff-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.options-panel {
  margin-bottom: 0.5rem;
}

.options-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;

    i {
      color: var(--primary-color);
    }
  }
}

.view-mode-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vertical-divider {
  height: 60px;

  @media (max-width: 768px) {
    display: none;
  }
}

.toggle-options {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
}

.input-section {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.input-panel {
  min-width: 0;
}

.swap-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 3rem;

  @media (max-width: 768px) {
    padding-top: 0;
    order: -1;
  }
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-color);
  }
}

.results {
  margin-top: 1rem;
}

.stats-toolbar {
  background: var(--surface-ground);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.stats-tags {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.diff-output {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;

  &.unified {
    max-height: 500px;
    overflow-y: auto;
  }

  &.split {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
}

.split-panel {
  border-right: 1px solid var(--surface-border);

  &:last-child {
    border-right: none;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--surface-ground);
    font-weight: 600;
    border-bottom: 1px solid var(--surface-border);

    i {
      color: var(--primary-color);
    }
  }

  .split-content {
    max-height: 400px;
    overflow-y: auto;
  }
}

.diff-line {
  display: flex;
  line-height: 1.5;
  min-height: 1.5em;

  &.line-added {
    background-color: rgba(34, 197, 94, 0.15);
  }

  &.line-removed {
    background-color: rgba(239, 68, 68, 0.15);
  }

  &.line-unchanged {
    background-color: transparent;
  }

  &.line-empty {
    background-color: var(--surface-ground);
  }

  .line-number {
    min-width: 40px;
    padding: 0 0.5rem;
    text-align: right;
    color: var(--text-color-secondary);
    background-color: var(--surface-ground);
    border-right: 1px solid var(--surface-border);
    user-select: none;

    &.old,
    &.new {
      min-width: 35px;
    }
  }

  .line-prefix {
    width: 20px;
    text-align: center;
    font-weight: 600;
    user-select: none;

    .line-added & {
      color: #22c55e;
    }

    .line-removed & {
      color: #ef4444;
    }
  }

  .line-content {
    flex: 1;
    padding: 0 0.5rem;
    white-space: pre;
    overflow-x: auto;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: var(--surface-ground);
  border-radius: 8px;
  color: var(--text-color-secondary);

  i {
    font-size: 2.5rem;
    color: var(--primary-color);
  }
}
</style>
