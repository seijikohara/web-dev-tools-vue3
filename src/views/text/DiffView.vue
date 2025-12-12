<script setup lang="ts">
import { useClipboardToast } from '@/composables/useClipboardToast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import CodeEditor from '@/components/editors/CodeEditor.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import SelectButton from 'primevue/selectbutton'

import { useDiffCalculator, VIEW_MODE_OPTIONS } from '@/composables/useDiffCalculator'

const { copy } = useClipboardToast()

// Use composable
const {
  originalText,
  modifiedText,
  viewMode,
  ignoreWhitespace,
  ignoreCase,
  diffResult,
  stats,
  hasChanges,
  hasDiff,
  splitView,
  diffAsText,
  originalLineCount,
  modifiedLineCount,
  clear: clearAll,
  loadSample,
} = useDiffCalculator()

// UI actions with toast notifications
const copyDiff = () => {
  void copy(diffAsText.value, { detail: 'Diff copied to clipboard' })
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
                :options="VIEW_MODE_OPTIONS"
                option-label="label"
                option-value="value"
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
                <ToggleSwitch v-model="ignoreWhitespace" input-id="ignoreWs" />
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
                <ToggleSwitch v-model="ignoreCase" input-id="ignoreCase" />
                <label for="ignoreCase">
                  <Tag value="Aa" :severity="ignoreCase ? 'warn' : 'secondary'" />
                  <span>Ignore case</span>
                </label>
              </div>
            </div>
          </div>
        </Panel>

        <!-- Input Section -->
        <div class="editor-grid-2col">
          <div class="editor-panel">
            <div class="panel-label">
              <i class="pi pi-file"></i>
              <span>Original</span>
              <Tag
                v-if="originalText"
                :value="`${originalLineCount} lines`"
                severity="secondary"
              />
            </div>
            <CodeEditor v-model="originalText" mode="plain_text" height="clamp(300px, calc(100vh - 520px), 600px)" />
          </div>

          <div class="editor-panel">
            <div class="panel-label">
              <i class="pi pi-file-edit"></i>
              <span>Modified</span>
              <Tag
                v-if="modifiedText"
                :value="`${modifiedLineCount} lines`"
                severity="secondary"
              />
            </div>
            <CodeEditor v-model="modifiedText" mode="plain_text" height="clamp(300px, calc(100vh - 520px), 600px)" />
          </div>
        </div>

        <!-- Results Section -->
        <Transition name="fade-slide">
          <div v-if="hasDiff" class="results">
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
                  <Tag
                    :value="`-${stats.removed} deletions`"
                    severity="danger"
                    icon="pi pi-minus"
                  />
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
        </Transition>

        <!-- Empty State -->
        <Transition name="fade">
          <div v-if="!hasDiff" class="empty-state">
            <i class="pi pi-arrows-alt"></i>
            <span>Enter text in both panels to compare</span>
            <Button
              label="Load Sample"
              icon="pi pi-file-import"
              severity="secondary"
              @click="loadSample"
            />
          </div>
        </Transition>
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

.editor-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 0;

  i {
    color: var(--primary-color);
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
