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

import { useXmlFormatter } from '@/composables/useXmlFormatter'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess, showError, showInfo } = useClipboardToast()

const {
  state,
  validationResult,
  xmlStats,
  indentTypeOptions,
  lineSeparatorOptions,
  formatXml,
  minifyXml,
  resetOptions,
  clearAll,
  loadSample,
} = useXmlFormatter()

const onClickFormat = () => {
  const result = formatXml()
  if (result.success) {
    showSuccess('Formatted', 'XML formatted successfully')
  } else {
    showError('Error', result.error ?? 'Failed to format XML')
  }
}

const onClickMinify = () => {
  const result = minifyXml()
  if (result.success) {
    showSuccess('Minified', 'XML minified successfully')
  } else {
    showError('Error', result.error ?? 'Failed to minify XML')
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
          <label for="lineSeparator">Line Separator</label>
          <Select
            id="lineSeparator"
            v-model="state.lineSeparator"
            :options="lineSeparatorOptions"
            option-label="label"
            option-value="value"
            placeholder="Line ending"
          />
        </div>
        <div class="option-item">
          <label for="maxLineWidth">Max Line Width (0 = unlimited)</label>
          <InputNumber
            id="maxLineWidth"
            v-model="state.maxLineWidth"
            :min="0"
            :max="500"
            show-buttons
            button-layout="horizontal"
          />
        </div>
      </div>

      <!-- Content Handling -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-align-justify"></i>
          Content Handling
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.collapseContent" input-id="collapseContent" />
          <label for="collapseContent">Collapse text content</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.preserveWhitespace" input-id="preserveWhitespace" />
          <label for="preserveWhitespace">Preserve whitespace</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.stripComments" input-id="stripComments" />
          <label for="stripComments">Strip comments</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.excludeComments" input-id="excludeComments" />
          <label for="excludeComments">Exclude comments from output</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.stripCDATA" input-id="stripCDATA" />
          <label for="stripCDATA">Strip CDATA sections</label>
        </div>
      </div>

      <!-- Element & Tag Options -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-tags"></i>
          Elements & Tags
        </div>
        <div class="toggle-option">
          <ToggleSwitch
            v-model="state.whiteSpaceAtEndOfSelfclosingTag"
            input-id="selfClosingSpace"
          />
          <label for="selfClosingSpace">Space before self-closing /&gt;</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.forceSelfClosingEmptyTag" input-id="forceSelfClosing" />
          <label for="forceSelfClosing">Force self-closing empty tags</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.enforceEmptyTags" input-id="enforceEmptyTags" />
          <label for="enforceEmptyTags">Enforce explicit closing tags</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.removeEmptyElements" input-id="removeEmptyElements" />
          <label for="removeEmptyElements">Remove empty elements</label>
        </div>
      </div>

      <!-- Attribute Options -->
      <div class="options-section">
        <div class="section-title">
          <i class="pi pi-list"></i>
          Attributes
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.sortAttributes" input-id="sortAttributes" />
          <label for="sortAttributes">Sort attributes alphabetically</label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch v-model="state.normalizeAttributeValues" input-id="normalizeAttributes" />
          <label for="normalizeAttributes">Normalize attribute whitespace</label>
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
        mode="xml"
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
        mode="xml"
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
        :value="validationResult.valid ? 'Valid XML' : 'Invalid XML'"
        :severity="validationResult.valid ? 'success' : 'danger'"
        :icon="validationResult.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        class="validation-tag"
      />

      <div v-if="xmlStats && validationResult.valid" class="stats-display">
        <Tag :value="`${xmlStats.elements} elements`" severity="info" icon="pi pi-box" />
        <Tag :value="`${xmlStats.attributes} attributes`" severity="secondary" />
        <Tag :value="`Depth: ${xmlStats.depth}`" severity="secondary" />
        <Tag :value="xmlStats.size" severity="secondary" icon="pi pi-file" />
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
