<script setup lang="ts">
import { reactive, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import Card from 'primevue/card'
import Panel from 'primevue/panel'

import CodeEditor from '@/components/CodeEditor.vue'

const state = reactive({
  markdown: '',
  html: '',
})

watch(
  () => state.markdown,
  (markdown: string) => {
    state.html = DOMPurify.sanitize(
      marked(markdown, { async: false }) as string,
    )
  },
)
</script>

<template>
  <Card>
    <template #title> Markdown Editor </template>
    <template #subtitle> Editor and preview </template>
    <template #content>
      <div class="grid">
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="Markdown">
            <CodeEditor
              v-model:value="state.markdown"
              mode="markdown"
              height="500px"
            />
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="Preview">
            <div v-html="state.html" />
          </Panel>
        </div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
