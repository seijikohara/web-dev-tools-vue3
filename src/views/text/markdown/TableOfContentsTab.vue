<script setup lang="ts">
import { ref, watch } from 'vue'
import { useClipboardToast } from '@/composables/useClipboardToast'

import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

import PanelHeader from '@/components/layout/PanelHeader.vue'

const props = defineProps<{
  markdown: string
}>()

const emit = defineEmits<{
  'update:markdown': [value: string]
}>()

const { showSuccess, showWarning } = useClipboardToast()

// Table of contents
interface TocItem {
  level: number
  text: string
  id: string
}

const tableOfContents = ref<TocItem[]>([])

// Parse markdown and extract headings
watch(
  () => props.markdown,
  (markdown: string) => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    tableOfContents.value = [...markdown.matchAll(headingRegex)]
      .filter(match => typeof match[1] === 'string' && typeof match[2] === 'string')
      .map(match => {
        const hashPart = match[1] ?? ''
        const textPart = match[2] ?? ''
        const level = hashPart.length
        const text = textPart.trim()
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
        return { level, text, id }
      })
  },
  { immediate: true },
)

// Generate TOC markdown
const generateTocMarkdown = () => {
  if (tableOfContents.value.length === 0) {
    showWarning('No headings', 'No headings found in the document')
    return
  }

  const tocLines = [
    '## Table of Contents',
    '',
    ...tableOfContents.value.map(item => {
      const indent = '  '.repeat(item.level - 1)
      return `${indent}- [${item.text}](#${item.id})`
    }),
  ]

  const tocMarkdown = `${tocLines.join('\n')}\n\n`
  emit('update:markdown', tocMarkdown + props.markdown)

  showSuccess('TOC Generated', 'Table of contents added to document')
}
</script>

<template>
  <Panel toggleable>
    <template #header>
      <PanelHeader icon="list">
        <span>Document Structure</span>
        <Tag
          v-if="tableOfContents.length > 0"
          :value="`${tableOfContents.length} headings`"
          severity="info"
        />
      </PanelHeader>
    </template>

    <div v-if="tableOfContents.length === 0" class="empty-state">
      <i class="pi pi-info-circle"></i>
      <span>No headings found in the document</span>
      <small>Add headings using # syntax to generate TOC</small>
    </div>
    <div v-else class="toc-list">
      <div
        v-for="(item, index) in tableOfContents"
        :key="index"
        class="toc-item"
        :style="{ paddingLeft: (item.level - 1) * 20 + 'px' }"
      >
        <Tag :value="`H${item.level}`" severity="info" />
        <span class="toc-text">{{ item.text }}</span>
      </div>
    </div>

    <Divider />

    <Button
      label="Insert TOC at Beginning"
      icon="pi pi-plus"
      :disabled="tableOfContents.length === 0"
      @click="generateTocMarkdown"
    />
  </Panel>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toc-text {
  font-size: 0.95rem;
}
</style>
