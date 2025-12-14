<script setup lang="ts">
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import Message from 'primevue/message'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'

import { useBase64Encoder } from '@/composables/useBase64Encoder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess } = useClipboardToast()

const {
  base64Input,
  decodedFileName,
  decodeError,
  base64InputStats,
  downloadDecodedFile,
  clearBase64Input,
} = useBase64Encoder()

const handleDownload = () => {
  const success = downloadDecodedFile()
  if (success) {
    showSuccess('Downloaded', 'File downloaded successfully')
  }
}
</script>

<template>
  <Panel toggleable class="decode-panel">
    <template #header>
      <PanelHeader icon="download" label="Decode Base64 to File">
        <Tag
          v-if="base64InputStats"
          :value="base64InputStats.valid ? 'Valid Base64' : 'Invalid'"
          :severity="base64InputStats.valid ? 'success' : 'danger'"
          :icon="base64InputStats.valid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
        />
      </PanelHeader>
    </template>

    <div class="decode-content">
      <div class="panel-label">
        <i class="pi pi-file-edit"></i>
        <span>Base64 Input</span>
        <Tag
          v-if="base64InputStats"
          :value="`${base64InputStats.chars} chars`"
          severity="secondary"
        />
      </div>
      <CodeEditor
        v-model="base64Input"
        mode="plain_text"
        height="clamp(220px, calc(100vh - 580px), 450px)"
      />
      <Toolbar class="editor-toolbar">
        <template #end>
          <Button
            v-tooltip.top="'Clear'"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :disabled="!base64Input"
            @click="clearBase64Input"
          />
        </template>
      </Toolbar>
    </div>
  </Panel>

  <SectionDivider icon="download" label="Download Options" align="left" />

  <div class="download-section">
    <div class="field">
      <label for="decodedFileName">
        <i class="pi pi-file"></i>
        Output Filename
      </label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-file"></i>
        </InputGroupAddon>
        <InputText id="decodedFileName" v-model="decodedFileName" placeholder="decoded-file" />
        <Button
          icon="pi pi-download"
          label="Download"
          :disabled="!base64Input.trim()"
          @click="handleDownload"
        />
      </InputGroup>
    </div>
  </div>

  <Transition name="fade-slide">
    <Message v-if="decodeError" severity="error" :closable="false" class="error-message">
      <i class="pi pi-times-circle"></i>
      {{ decodeError }}
    </Message>
  </Transition>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/_tool-common.scss';

.decode-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }
}

.decode-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.download-section {
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 8px;
  margin-bottom: 1rem;

  .field {
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

.error-message {
  margin: 1rem 0;

  i {
    margin-right: 0.5rem;
  }
}
</style>
