<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useUrlEncoder } from '@/composables/useUrlEncoder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy } = useClipboardToast()

const { builderBaseUrl, builderParams, builtUrl, addParam, removeParam, clearBuilder } =
  useUrlEncoder()

const copyBuiltUrl = () => {
  void copy(builtUrl.value, { detail: 'Built URL copied to clipboard' })
}
</script>

<template>
  <Panel toggleable class="builder-panel">
    <template #header>
      <PanelHeader icon="cog">URL Builder</PanelHeader>
    </template>

    <div class="builder-content">
      <div class="field">
        <label for="baseUrl">
          <i class="pi pi-globe"></i>
          Base URL
        </label>
        <InputGroup>
          <InputGroupAddon>
            <i class="pi pi-link"></i>
          </InputGroupAddon>
          <InputText
            id="baseUrl"
            v-model="builderBaseUrl"
            placeholder="https://example.com/api/endpoint"
          />
        </InputGroup>
      </div>

      <SectionDivider icon="filter">
        Query Parameters
        <Tag :value="`${builderParams.filter(p => p.key).length} params`" severity="secondary" />
      </SectionDivider>

      <div class="params-list">
        <div v-for="param in builderParams" :key="param.id" class="param-row">
          <InputGroup>
            <InputText v-model="param.key" placeholder="Key" class="param-key-input" />
            <InputGroupAddon>=</InputGroupAddon>
            <InputText v-model="param.value" placeholder="Value" class="param-value-input" />
            <Button icon="pi pi-trash" severity="danger" text @click="removeParam(param.id)" />
          </InputGroup>
        </div>
      </div>

      <Button label="Add Parameter" icon="pi pi-plus" severity="secondary" text @click="addParam" />
    </div>
  </Panel>

  <div v-if="builtUrl" class="built-url-section">
    <SectionDivider icon="check-circle"> Generated URL </SectionDivider>

    <CodeEditor
      :model-value="builtUrl"
      mode="plain_text"
      height="clamp(80px, calc(100vh - 650px), 150px)"
      :options="{ readOnly: true }"
    />

    <Toolbar class="action-toolbar">
      <template #start>
        <Button label="Copy URL" icon="pi pi-copy" @click="copyBuiltUrl" />
      </template>
      <template #end>
        <Button
          v-tooltip.top="'Clear Builder'"
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          @click="clearBuilder"
        />
      </template>
    </Toolbar>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.builder-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.builder-content {
  .field {
    margin-bottom: 1rem;

    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;

      i {
        color: var(--primary-color);
      }
    }
  }
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.param-row {
  .param-key-input {
    max-width: 200px;
  }

  .param-value-input {
    flex: 1;
  }
}

.built-url-section {
  margin-top: 1rem;
}
</style>
