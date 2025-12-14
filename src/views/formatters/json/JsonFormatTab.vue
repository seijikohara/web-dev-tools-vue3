<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useJsonFormatter } from '@/composables/useJsonFormatter'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess, showError, showInfo } = useClipboardToast()

const {
  state,
  validationResult,
  jsonStats,
  indentTypeOptions,
  quoteStyleOptions,
  formatJson,
  minifyJson,
  resetOptions,
  clearAll,
  loadSample,
} = useJsonFormatter()

const onClickFormat = () => {
  const result = formatJson()
  if (result.success) {
    showSuccess('Formatted', 'JSON formatted successfully')
  } else {
    showError('Error', result.error ?? 'Failed to format JSON')
  }
}

const onClickMinify = () => {
  const result = minifyJson()
  if (result.success) {
    showSuccess('Minified', 'JSON minified successfully')
  } else {
    showError('Error', result.error ?? 'Failed to minify JSON')
  }
}

const onResetOptions = () => {
  resetOptions()
  showInfo('Reset', 'Options reset to defaults')
}
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="cog">Options</PanelHeader>
    </template>

    <div class="options-grid-auto">
      <!-- Indentation -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-align-left"></i>
          Indentation
        </div>
        <div class="option-item">
          <label for="indentSize">Indent Size</label>
          <InputNumber
            id="indentSize"
            v-model="state.indentSize"
            :min="0"
            :max="8"
            show-buttons
            button-layout="horizontal"
          />
        </div>
        <div class="option-item">
          <label for="indentType">Indent Type</label>
          <Select
            id="indentType"
            v-model="state.indentType"
            :options="indentTypeOptions"
            option-label="label"
            option-value="value"
          />
        </div>
      </div>

      <!-- Basic Options -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-sliders-h"></i>
          Basic
        </div>
        <div class="option-item">
          <label for="quoteStyle">Quote Style</label>
          <Select
            id="quoteStyle"
            v-model="state.quoteStyle"
            :options="quoteStyleOptions"
            option-label="label"
            option-value="value"
            placeholder="Quotes"
          />
        </div>
        <div class="option-item">
          <label for="maxDepth">Max Depth (0 = unlimited)</label>
          <InputNumber
            id="maxDepth"
            v-model="state.maxDepth"
            :min="0"
            :max="100"
            show-buttons
            button-layout="horizontal"
          />
        </div>
      </div>

      <!-- Key & Value Processing -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-filter"></i>
          Key & Value Processing
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.sortKeys" input-id="sortKeys" />
          <label for="sortKeys">Sort keys alphabetically</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeNulls" input-id="removeNulls" />
          <label for="removeNulls">Remove null values</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeEmptyStrings" input-id="removeEmptyStrings" />
          <label for="removeEmptyStrings">Remove empty strings</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeEmptyArrays" input-id="removeEmptyArrays" />
          <label for="removeEmptyArrays">Remove empty arrays</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeEmptyObjects" input-id="removeEmptyObjects" />
          <label for="removeEmptyObjects">Remove empty objects</label>
        </div>
      </div>

      <!-- Formatting Style -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-palette"></i>
          Formatting Style
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.colonSpacing" input-id="colonSpacing" />
          <label for="colonSpacing">Space after colon</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.arrayBracketSpacing" input-id="arrayBracketSpacing" />
          <label for="arrayBracketSpacing">Space inside array brackets</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.objectBracketSpacing" input-id="objectBracketSpacing" />
          <label for="objectBracketSpacing">Space inside object braces</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.compactArrays" input-id="compactArrays" />
          <label for="compactArrays">Compact primitive arrays</label>
        </div>
      </div>

      <!-- Advanced -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-cog"></i>
          Advanced
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.escapeUnicode" input-id="escapeUnicode" />
          <label for="escapeUnicode">Escape Unicode characters</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.trailingComma" input-id="trailingComma" />
          <label for="trailingComma">Add trailing commas (non-standard)</label>
        </div>
      </div>
    </div>

    <div class="options-actions">
      <Button
        label="Reset to Defaults"
        icon="pi pi-refresh"
        severity="secondary"
        text
        size="small"
        @click="onResetOptions"
      />
    </div>
  </Panel>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-import"></i>
        <span>Input</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="json"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="Format"
            icon="pi pi-check"
            :disabled="!state.input"
            @click="onClickFormat"
          />
          <Button
            label="Minify"
            icon="pi pi-compress"
            severity="secondary"
            :disabled="!state.input"
            @click="onClickMinify"
          />
        </template>
        <template #end>
          <Button
            v-tooltip.top="'Load Sample'"
            icon="pi pi-file"
            severity="info"
            text
            @click="loadSample"
          />
          <Button
            v-tooltip.top="'Clear'"
            icon="pi pi-trash"
            severity="danger"
            text
            :disabled="!state.input && !state.output"
            @click="clearAll"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-export"></i>
        <span>Output</span>
      </div>
      <CodeEditor
        v-model="state.output"
        mode="json"
        height="clamp(300px, calc(100vh - 520px), 600px)"
        :options="{ readOnly: true }"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <CopyButton
            :value="state.output"
            label="Copy"
            tooltip="Output copied to clipboard"
            :disabled="!state.output"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <!-- Validation Result & Stats -->
  <div v-if="validationResult" class="validation-section">
    <SectionDivider icon="check-square">Validation Result</SectionDivider>

    <div class="validation-content">
      <Tag
        :value="validationResult.valid ? 'Valid JSON' : 'Invalid JSON'"
        :severity="validationResult.valid ? 'success' : 'danger'"
        :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        class="validation-tag"
      />

      <div v-if="jsonStats && validationResult.valid" class="stats-display">
        <Tag :value="`${jsonStats.keys} keys`" severity="info" icon="pi pi-key" />
        <Tag :value="`${jsonStats.values} values`" severity="secondary" />
        <Tag :value="`Depth: ${jsonStats.depth}`" severity="secondary" />
        <Tag :value="jsonStats.size" severity="secondary" icon="pi pi-file" />
      </div>
    </div>

    <Message
      v-if="!validationResult.valid && validationResult.error !== 'Empty input'"
      severity="error"
      :closable="false"
      class="error-message"
    >
      <i class="pi pi-times-circle"></i>
      {{ validationResult.error }}
      <Tag v-if="validationResult.path" :value="validationResult.path" severity="warn" />
    </Message>
  </div>
</template>

<style lang="scss" scoped>
.options-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.options-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.validation-section {
  margin-top: 1.5rem;
}

.validation-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.validation-tag {
  font-size: 0.95rem;
}

.error-message {
  margin-top: 1rem;

  i {
    margin-right: 0.5rem;
  }
}
</style>
