<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

interface Props {
  pattern: string
  flagGlobal: boolean
  flagCaseInsensitive: boolean
  flagMultiline: boolean
  flagDotAll: boolean
  flagUnicode: boolean
  flags: string
  regexError: string
  fullPattern: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:pattern': [value: string]
  'update:flagGlobal': [value: boolean]
  'update:flagCaseInsensitive': [value: boolean]
  'update:flagMultiline': [value: boolean]
  'update:flagDotAll': [value: boolean]
  'update:flagUnicode': [value: boolean]
  loadSample: []
  clearAll: []
}>()
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="sliders-h">
        <span>Pattern & Flags</span>
        <Tag
          v-if="pattern"
          :value="regexError ? 'Invalid' : 'Valid'"
          :severity="regexError ? 'danger' : 'success'"
        />
      </PanelHeader>
    </template>
    <template #icons>
      <Button
        v-tooltip.top="'Load Sample'"
        icon="pi pi-file-import"
        severity="secondary"
        text
        rounded
        @click="emit('loadSample')"
      />
      <Button
        v-tooltip.top="'Clear All'"
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        @click="emit('clearAll')"
      />
    </template>

    <div class="pattern-section">
      <div class="option-item">
        <label for="pattern">
          <i class="pi pi-code"></i>
          Regular Expression
        </label>
        <InputGroup>
          <InputGroupAddon class="pattern-delimiter">/</InputGroupAddon>
          <InputText
            id="pattern"
            :model-value="pattern"
            class="pattern-field"
            placeholder="Enter regex pattern"
            @update:model-value="emit('update:pattern', $event ?? '')"
          />
          <InputGroupAddon class="pattern-delimiter">/{{ flags }}</InputGroupAddon>
          <InputGroupAddon>
            <CopyButton :value="fullPattern" tooltip="Copy Pattern" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <SectionDivider icon="flag">Flags</SectionDivider>

      <div class="flags-row">
        <div class="toggle-option">
          <ToggleSwitch
            :model-value="flagGlobal"
            input-id="flagG"
            @update:model-value="emit('update:flagGlobal', $event)"
          />
          <label for="flagG">
            <Tag value="g" :severity="flagGlobal ? 'success' : 'secondary'" />
            <span>Global</span>
          </label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch
            :model-value="flagCaseInsensitive"
            input-id="flagI"
            @update:model-value="emit('update:flagCaseInsensitive', $event)"
          />
          <label for="flagI">
            <Tag value="i" :severity="flagCaseInsensitive ? 'success' : 'secondary'" />
            <span>Case Insensitive</span>
          </label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch
            :model-value="flagMultiline"
            input-id="flagM"
            @update:model-value="emit('update:flagMultiline', $event)"
          />
          <label for="flagM">
            <Tag value="m" :severity="flagMultiline ? 'success' : 'secondary'" />
            <span>Multiline</span>
          </label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch
            :model-value="flagDotAll"
            input-id="flagS"
            @update:model-value="emit('update:flagDotAll', $event)"
          />
          <label for="flagS">
            <Tag value="s" :severity="flagDotAll ? 'success' : 'secondary'" />
            <span>Dot All</span>
          </label>
        </div>
        <div class="toggle-option">
          <ToggleSwitch
            :model-value="flagUnicode"
            input-id="flagU"
            @update:model-value="emit('update:flagUnicode', $event)"
          />
          <label for="flagU">
            <Tag value="u" :severity="flagUnicode ? 'success' : 'secondary'" />
            <span>Unicode</span>
          </label>
        </div>
      </div>

      <Message v-if="regexError" severity="error" :closable="false">
        <div class="message-content">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ regexError }}</span>
        </div>
      </Message>
    </div>
  </Panel>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.pattern-section {
  padding: 0.5rem 0;
}

.pattern-delimiter {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
  background: transparent;
}

.pattern-field {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.flags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  margin-bottom: 1rem;

  .toggle-option {
    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;

      span {
        font-size: 0.9rem;
      }
    }
  }
}
</style>
