<script setup lang="ts">
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import CopyButton from '@/components/display/CopyButton.vue'

defineProps<{
  html: string
}>()
</script>

<template>
  <div class="editor-panel">
    <div class="panel-label">
      <i class="pi pi-code"></i>
      <span>Generated HTML</span>
      <Tag v-if="html" :value="`${html.length} chars`" severity="secondary" />
    </div>
    <CodeEditor :model-value="html" mode="html" height="450px" :options="{ readOnly: true }" />
    <Toolbar class="editor-toolbar">
      <template #start>
        <CopyButton :value="html" label="Copy HTML" tooltip="HTML copied to clipboard" />
      </template>
    </Toolbar>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';
</style>
