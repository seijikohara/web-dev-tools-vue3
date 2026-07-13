<script setup lang="ts">
import Toolbar from 'primevue/toolbar'
import CodeEditor, { type EditorMode } from '@/components/editors/CodeEditor.vue'

const modelValue = defineModel<string>({ required: true })

defineProps<{
  icon?: string
  label: string
  mode?: EditorMode
  height?: string
  readOnly?: boolean
}>()
</script>

<template>
  <div class="editor-panel">
    <div class="panel-label">
      <i v-if="icon" :class="`pi pi-${icon}`"></i>
      <span>{{ label }}</span>
      <slot name="stats"></slot>
    </div>
    <CodeEditor
      v-model="modelValue"
      :mode="mode ?? 'plain_text'"
      :height="height ?? '300px'"
      :options="readOnly ? { readOnly: true } : {}"
    />
    <Toolbar v-if="$slots.toolbar" class="editor-toolbar">
      <template #start>
        <slot name="toolbar-start"></slot>
      </template>
      <template #center>
        <slot name="toolbar-center"></slot>
      </template>
      <template #end>
        <slot name="toolbar-end"></slot>
      </template>
    </Toolbar>
    <slot name="toolbar"></slot>
  </div>
</template>
