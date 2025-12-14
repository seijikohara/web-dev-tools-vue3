<script setup lang="ts">
import { toRef } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useXmlFormatter, useXmlQuery } from '@/composables/useXmlFormatter'

const { state } = useXmlFormatter()
const inputRef = toRef(state, 'input')
const { xpathQuery, xpathResults, xpathError, xpathExamples, executeXPath, applyXPathExample } =
  useXmlQuery(inputRef)
</script>

<template>
  <Panel toggleable class="query-panel">
    <template #header>
      <PanelHeader icon="search">XPath Expression</PanelHeader>
    </template>

    <div class="query-input">
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-code"></i>
        </InputGroupAddon>
        <InputText
          v-model="xpathQuery"
          placeholder="e.g., //element[@attribute='value']"
          @keyup.enter="executeXPath"
        />
        <Button
          label="Query"
          icon="pi pi-play"
          :disabled="!xpathQuery || !state.input"
          @click="executeXPath"
        />
      </InputGroup>
      <small class="hint-text">
        <i class="pi pi-info-circle"></i>
        Supports XPath 1.0 expressions
      </small>
    </div>

    <div class="common-queries">
      <span class="query-label">Common queries:</span>
      <Button
        v-for="example in xpathExamples"
        :key="example.query"
        :label="example.name"
        severity="secondary"
        text
        @click="applyXPathExample(example.query)"
      />
    </div>
  </Panel>

  <Message v-if="xpathError" severity="warn" :closable="false" class="query-error">
    <i class="pi pi-exclamation-triangle"></i>
    {{ xpathError }}
  </Message>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file"></i>
        <span>Source XML</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="xml"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-check-square"></i>
        <span>Results</span>
        <Tag
          v-if="xpathResults.length > 0"
          :value="`${xpathResults.length} found`"
          severity="success"
          icon="pi pi-check"
        />
      </div>
      <div class="results-list">
        <div v-if="xpathResults.length === 0" class="no-results">
          <i class="pi pi-info-circle"></i>
          <span>No results. Enter an XPath expression and click Query.</span>
        </div>
        <div v-for="(result, index) in xpathResults" :key="index" class="result-item">
          <Tag :value="index + 1" severity="secondary" />
          <code class="result-content">{{ result }}</code>
        </div>
      </div>
      <Toolbar v-if="xpathResults.length > 0" class="editor-toolbar">
        <template #start>
          <CopyButton
            :value="xpathResults.join('\n')"
            label="Copy All"
            tooltip="XPath results copied to clipboard"
          />
        </template>
      </Toolbar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.query-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.query-input {
  margin-bottom: 1rem;
}

.common-queries {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .query-label {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }
}

.query-error {
  margin-bottom: 1rem;

  i {
    margin-right: 0.5rem;
  }
}

.results-list {
  height: 350px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-ground);
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-color-secondary);

  i {
    font-size: 1.5rem;
    color: var(--primary-color);
  }
}

.result-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  align-items: flex-start;

  &:last-child {
    border-bottom: none;
  }

  .result-content {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-break: break-all;
    flex: 1;
  }
}
</style>
