<script setup lang="ts">
import { watch, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import PanelHeader from '@/components/layout/PanelHeader.vue'

const props = defineProps<{
  markdown: string
  html: string
}>()

const emit = defineEmits<{
  'update:markdown': [value: string]
  'update:html': [value: string]
}>()

// Parse markdown and generate HTML
watch(
  () => props.markdown,
  (markdown: string) => {
    const html = DOMPurify.sanitize(marked(markdown, { async: false }))
    emit('update:html', html)
  },
)

// Toolbar actions
const insertText = (before: string, after = '', placeholder = '') => {
  const textarea = document.querySelector<HTMLTextAreaElement>('.code-editor textarea')
  if (!textarea) {
    // Fallback: append to end
    emit('update:markdown', props.markdown + before + placeholder + after)
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = props.markdown.substring(start, end)

  const insertedText = before + (selectedText || placeholder) + after
  const newMarkdown =
    props.markdown.substring(0, start) + insertedText + props.markdown.substring(end)
  emit('update:markdown', newMarkdown)
}

const insertBold = () => insertText('**', '**', 'bold text')
const insertItalic = () => insertText('*', '*', 'italic text')
const insertStrikethrough = () => insertText('~~', '~~', 'strikethrough text')
const insertCode = () => insertText('`', '`', 'code')
const insertCodeBlock = () => insertText('\n```\n', '\n```\n', 'code block')
const insertLink = () => insertText('[', '](url)', 'link text')
const insertImage = () => insertText('![', '](image-url)', 'alt text')
const insertHeading1 = () => insertText('# ', '', 'Heading 1')
const insertHeading2 = () => insertText('## ', '', 'Heading 2')
const insertHeading3 = () => insertText('### ', '', 'Heading 3')
const insertBulletList = () => insertText('\n- ', '', 'list item')
const insertNumberedList = () => insertText('\n1. ', '', 'list item')
const insertQuote = () => insertText('\n> ', '', 'quote')
const insertHorizontalRule = () => insertText('\n---\n', '', '')
const insertTable = () => {
  const table = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`
  emit('update:markdown', props.markdown + table)
}

// Word count
const wordCount = computed(() => {
  const text = props.markdown.trim()
  if (!text) return { words: 0, characters: 0, lines: 0 }

  const words = text.split(/\s+/).filter(w => w.length > 0).length
  const characters = text.length
  const lines = text.split('\n').length

  return { words, characters, lines }
})
</script>

<template>
  <Panel toggleable class="options-panel">
    <template #header>
      <PanelHeader icon="pencil">Formatting</PanelHeader>
    </template>

    <div class="format-toolbar">
      <div class="toolbar-group">
        <Button
          v-tooltip.bottom="'Bold'"
          icon="pi pi-bold"
          severity="secondary"
          text
          @click="insertBold"
        />
        <Button
          v-tooltip.bottom="'Italic'"
          icon="pi pi-italic"
          severity="secondary"
          text
          @click="insertItalic"
        />
        <Button
          v-tooltip.bottom="'Strikethrough'"
          icon="pi pi-minus"
          severity="secondary"
          text
          @click="insertStrikethrough"
        />
      </div>
      <Divider layout="vertical" />
      <div class="toolbar-group">
        <Button
          v-tooltip.bottom="'Heading 1'"
          label="H1"
          severity="secondary"
          text
          @click="insertHeading1"
        />
        <Button
          v-tooltip.bottom="'Heading 2'"
          label="H2"
          severity="secondary"
          text
          @click="insertHeading2"
        />
        <Button
          v-tooltip.bottom="'Heading 3'"
          label="H3"
          severity="secondary"
          text
          @click="insertHeading3"
        />
      </div>
      <Divider layout="vertical" />
      <div class="toolbar-group">
        <Button
          v-tooltip.bottom="'Code'"
          icon="pi pi-code"
          severity="secondary"
          text
          @click="insertCode"
        />
        <Button
          v-tooltip.bottom="'Code Block'"
          icon="pi pi-box"
          severity="secondary"
          text
          @click="insertCodeBlock"
        />
      </div>
      <Divider layout="vertical" />
      <div class="toolbar-group">
        <Button
          v-tooltip.bottom="'Link'"
          icon="pi pi-link"
          severity="secondary"
          text
          @click="insertLink"
        />
        <Button
          v-tooltip.bottom="'Image'"
          icon="pi pi-image"
          severity="secondary"
          text
          @click="insertImage"
        />
      </div>
      <Divider layout="vertical" />
      <div class="toolbar-group">
        <Button
          v-tooltip.bottom="'Bullet List'"
          icon="pi pi-list"
          severity="secondary"
          text
          @click="insertBulletList"
        />
        <Button
          v-tooltip.bottom="'Numbered List'"
          icon="pi pi-list-check"
          severity="secondary"
          text
          @click="insertNumberedList"
        />
        <Button
          v-tooltip.bottom="'Quote'"
          icon="pi pi-comment"
          severity="secondary"
          text
          @click="insertQuote"
        />
      </div>
      <Divider layout="vertical" />
      <div class="toolbar-group">
        <Button
          v-tooltip.bottom="'Table'"
          icon="pi pi-table"
          severity="secondary"
          text
          @click="insertTable"
        />
        <Button
          v-tooltip.bottom="'Horizontal Rule'"
          icon="pi pi-minus"
          severity="secondary"
          text
          @click="insertHorizontalRule"
        />
      </div>
    </div>
  </Panel>

  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-edit"></i>
        <span>Markdown</span>
        <Tag v-if="wordCount.words > 0" :value="`${wordCount.words} words`" severity="secondary" />
      </div>
      <CodeEditor
        :model-value="markdown"
        mode="markdown"
        height="450px"
        @update:model-value="v => emit('update:markdown', v)"
      />
    </div>
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-eye"></i>
        <span>Preview</span>
      </div>
      <div class="preview-content" v-html="html"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.format-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.toolbar-group {
  display: flex;
  gap: 0.25rem;
}

.preview-content {
  padding: 1rem;
  height: 450px;
  overflow-y: auto;
  background: var(--surface-ground);
  border-radius: 6px;
  border: 1px solid var(--surface-border);

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  :deep(pre) {
    background-color: var(--surface-card);
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }

  :deep(code) {
    background-color: var(--surface-card);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
  }

  :deep(pre code) {
    padding: 0;
    background: none;
  }

  :deep(blockquote) {
    border-left: 4px solid var(--primary-color);
    margin: 1rem 0;
    padding-left: 1rem;
    color: var(--text-color-secondary);
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid var(--surface-border);
    padding: 0.5rem;
    text-align: left;
  }

  :deep(th) {
    background-color: var(--surface-card);
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--surface-border);
    margin: 1.5rem 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.5rem;
  }

  :deep(a) {
    color: var(--primary-color);
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>
