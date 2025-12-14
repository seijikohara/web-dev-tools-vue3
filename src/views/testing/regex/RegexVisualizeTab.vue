<script setup lang="ts">
import Message from 'primevue/message'
import Toolbar from 'primevue/toolbar'
import ToggleSwitch from 'primevue/toggleswitch'
import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

interface Props {
  pattern: string
  showAst: boolean
  svgDiagram: string | null
  astJson: string | null
  visualizerError: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:showAst': [value: boolean]
}>()
</script>

<template>
  <div class="visualize-section">
    <div v-if="!pattern" class="empty-state">
      <i class="pi pi-sitemap"></i>
      <span>Enter a pattern to see visualization</span>
    </div>

    <div v-else-if="visualizerError" class="error-state">
      <Message severity="error" :closable="false">
        <div class="message-content">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ visualizerError }}</span>
        </div>
      </Message>
    </div>

    <div v-else class="visualization-content">
      <Toolbar class="editor-toolbar">
        <template #start>
          <span class="viz-title">
            <i class="pi pi-sitemap"></i>
            Railroad Diagram
          </span>
        </template>
        <template #end>
          <div class="viz-actions">
            <ToggleSwitch
              :model-value="showAst"
              input-id="showAst"
              @update:model-value="emit('update:showAst', $event)"
            />
            <label for="showAst">Show AST</label>
          </div>
        </template>
      </Toolbar>

      <div class="diagram-container">
        <div v-if="svgDiagram" class="svg-wrapper" v-html="svgDiagram"></div>
      </div>

      <div v-if="showAst && astJson" class="ast-section">
        <SectionDivider icon="code">Abstract Syntax Tree (AST)</SectionDivider>
        <CodeEditor
          :model-value="astJson"
          mode="json"
          height="300px"
          :options="{ readOnly: true }"
        />
      </div>

      <SectionDivider icon="palette">Legend</SectionDivider>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-box legend-char"></span>
          <span>Character</span>
        </div>
        <div class="legend-item">
          <span class="legend-box legend-meta"></span>
          <span>Meta Character</span>
        </div>
        <div class="legend-item">
          <span class="legend-box legend-charclass"></span>
          <span>Character Class</span>
        </div>
        <div class="legend-item">
          <span class="legend-box legend-group"></span>
          <span>Group</span>
        </div>
        <div class="legend-item">
          <span class="legend-box legend-quantifier"></span>
          <span>Quantifier</span>
        </div>
        <div class="legend-item">
          <span class="legend-box legend-assertion"></span>
          <span>Assertion</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.visualize-section {
  padding: 0.5rem 0;
}

.error-state {
  padding: 1rem 0;
}

.visualization-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.viz-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;

  i {
    color: var(--primary-color);
  }
}

.viz-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    cursor: pointer;
  }
}

.diagram-container {
  background: #fafafa;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow-x: auto;
  min-height: 150px;
}

.svg-wrapper {
  display: flex;
  justify-content: center;
  padding: 1rem;

  :deep(svg) {
    max-width: 100%;
    height: auto;
  }
}

.ast-section {
  margin-top: 1rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.legend-box {
  display: inline-block;
  width: 24px;
  height: 16px;
  border-radius: 4px;
  border-width: 2px;
  border-style: solid;
}

.legend-char {
  background: #e8f5e9;
  border-color: #4caf50;
}

.legend-meta {
  background: #fff9c4;
  border-color: #ffc107;
}

.legend-charclass {
  background: #e3f2fd;
  border-color: #2196f3;
}

.legend-group {
  background: #fff3e0;
  border-color: #ff9800;
}

.legend-quantifier {
  background: #fce4ec;
  border-color: #e91e63;
}

.legend-assertion {
  background: #f3e5f5;
  border-color: #9c27b0;
}
</style>
