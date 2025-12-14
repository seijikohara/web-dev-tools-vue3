<script setup lang="ts">
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Message from 'primevue/message'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'

import { useBase64Encoder, ENCODING_MODE_OPTIONS } from '@/composables/useBase64Encoder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy } = useClipboardToast()

const {
  inputText,
  outputText,
  encodeError,
  encodingMode,
  inputStats,
  outputStats,
  loadSample,
  clearAll,
} = useBase64Encoder()

const copyInput = () => {
  void copy(inputText.value, { detail: 'Input copied to clipboard' })
}

const copyOutput = () => {
  void copy(outputText.value, { detail: 'Output copied to clipboard' })
}
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="cog" label="Encoding Options" />
    </template>
    <div class="options-content">
      <div class="option-item">
        <label>
          <i class="pi pi-code"></i>
          Mode
        </label>
        <SelectButton
          v-model="encodingMode"
          :options="ENCODING_MODE_OPTIONS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
      </div>

      <Divider layout="vertical" />

      <div class="method-info">
        <Tag
          v-if="encodingMode === 'encode'"
          value="Text → Base64"
          severity="info"
          icon="pi pi-lock"
        />
        <Tag v-else value="Base64 → Text" severity="success" icon="pi pi-unlock" />
        <span class="info-text">
          {{
            encodingMode === 'encode'
              ? 'Convert plain text to Base64 encoding (UTF-8 safe)'
              : 'Decode Base64 back to plain text'
          }}
        </span>
      </div>
    </div>
  </Panel>

  <Transition name="fade-slide">
    <Message v-if="encodeError" severity="error" :closable="false" class="error-message">
      <i class="pi pi-times-circle"></i>
      {{ encodeError }}
    </Message>
  </Transition>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-edit"></i>
        <span>{{ encodingMode === 'encode' ? 'Input (Plain Text)' : 'Input (Base64)' }}</span>
        <Tag
          v-if="inputStats"
          :value="`${inputStats.chars} chars / ${inputStats.bytes} bytes`"
          severity="secondary"
        />
      </div>
      <CodeEditor
        v-model="inputText"
        mode="plain_text"
        height="clamp(250px, calc(100vh - 550px), 500px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            v-tooltip.top="'Load Sample'"
            icon="pi pi-file"
            label="Sample"
            severity="info"
            text
            @click="loadSample"
          />
        </template>
        <template #end>
          <Button
            v-tooltip.top="'Copy'"
            icon="pi pi-copy"
            severity="secondary"
            text
            rounded
            :disabled="!inputText"
            @click="copyInput"
          />
          <Button
            v-tooltip.top="'Clear'"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :disabled="!inputText"
            @click="clearAll"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-lock"></i>
        <span>{{ encodingMode === 'encode' ? 'Output (Base64)' : 'Output (Plain Text)' }}</span>
        <Tag
          v-if="outputStats"
          :value="`${outputStats.chars} chars (${outputStats.ratio}%)`"
          severity="info"
        />
      </div>
      <CodeEditor
        v-model="outputText"
        mode="plain_text"
        height="clamp(250px, calc(100vh - 550px), 500px)"
        :options="{ readOnly: true }"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            icon="pi pi-copy"
            label="Copy"
            severity="secondary"
            :disabled="!outputText"
            @click="copyOutput"
          />
        </template>
      </Toolbar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/_tool-common.scss';

.options-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.options-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.option-item {
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

.method-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  .info-text {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.error-message {
  margin: 1rem 0;

  i {
    margin-right: 0.5rem;
  }
}
</style>
