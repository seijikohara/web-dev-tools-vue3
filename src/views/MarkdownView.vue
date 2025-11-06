<script setup lang="ts">
import { reactive, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import Card from 'primevue/card'

import CodeEditor from '@/components/CodeEditor.vue'
import DualPanelLayout from '@/components/DualPanelLayout.vue'

const state = reactive({
  markdown: '',
  html: '',
})

watch(
  () => state.markdown,
  (markdown: string) => {
    state.html = DOMPurify.sanitize(marked(markdown, { async: false }))
  },
)
</script>

<template>
  <Card>
    <template #title> Markdown Editor </template>
    <template #subtitle> Editor and preview </template>
    <template #content>
      <DualPanelLayout left-header="Markdown" right-header="Preview">
        <template #left>
          <CodeEditor v-model="state.markdown" mode="markdown" height="500px" />
        </template>
        <template #right>
          <div v-html="state.html" />
        </template>
      </DualPanelLayout>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
