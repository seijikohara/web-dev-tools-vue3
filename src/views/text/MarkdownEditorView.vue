<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useClipboardToast } from '@/composables/useClipboardToast'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'

import CodeEditor from '@/components/editors/CodeEditor.vue'

const { copy, showSuccess, showWarning } = useClipboardToast()

const state = reactive({
  markdown: '',
  html: '',
})

// Table of contents
interface TocItem {
  level: number
  text: string
  id: string
}

const tableOfContents = ref<TocItem[]>([])

// Parse markdown and extract headings
watch(
  () => state.markdown,
  (markdown: string) => {
    state.html = DOMPurify.sanitize(marked(markdown, { async: false }))

    // Extract headings for TOC using matchAll and map
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
)

// Toolbar actions
const insertText = (before: string, after = '', placeholder = '') => {
  const textarea = document.querySelector<HTMLTextAreaElement>('.code-editor textarea')
  if (!textarea) {
    // Fallback: append to end
    state.markdown += before + placeholder + after
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = state.markdown.substring(start, end)

  const insertedText = before + (selectedText || placeholder) + after
  state.markdown = state.markdown.substring(0, start) + insertedText + state.markdown.substring(end)
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
  state.markdown += table
}

// Copy functions
const copyMarkdown = () => {
  void copy(state.markdown, { detail: 'Markdown copied to clipboard' })
}

const copyHtml = () => {
  void copy(state.html, { detail: 'HTML copied to clipboard' })
}

// Export functions
const downloadMarkdown = () => {
  const blob = new Blob([state.markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'document.md'
  link.click()
  URL.revokeObjectURL(url)
}

const downloadHtml = () => {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background-color: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background-color: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body>
${state.html}
</body>
</html>`

  const blob = new Blob([fullHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'document.html'
  link.click()
  URL.revokeObjectURL(url)
}

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

  const tocMarkdown = tocLines.join('\n') + '\n\n'
  state.markdown = tocMarkdown + state.markdown

  showSuccess('TOC Generated', 'Table of contents added to document')
}

// Word count
const wordCount = computed(() => {
  const text = state.markdown.trim()
  if (!text) return { words: 0, characters: 0, lines: 0 }

  const words = text.split(/\s+/).filter(w => w.length > 0).length
  const characters = text.length
  const lines = text.split('\n').length

  return { words, characters, lines }
})

// Sample markdown
const loadSample = () => {
  state.markdown = `# Sample Document

This is a **sample markdown** document to demonstrate the editor features.

## Features

- **Bold** and *italic* text
- ~~Strikethrough~~ text
- \`Inline code\` and code blocks
- [Links](https://example.com)
- Images and tables

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

### Table Example

| Feature | Supported |
|---------|-----------|
| Bold    | Yes       |
| Italic  | Yes       |
| Tables  | Yes       |

> This is a blockquote with some important information.

---

Enjoy writing markdown!
`
}

// Clear all
const clearAll = () => {
  state.markdown = ''
  state.html = ''
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-file-edit"></i>
        <span>Markdown Editor</span>
      </div>
    </template>
    <template #subtitle> Write markdown with live preview, toolbar, and export options </template>
    <template #content>
      <Panel toggleable class="toolbar-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-pencil"></i>
            <span>Formatting</span>
          </div>
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

      <Tabs value="0">
        <TabList>
          <Tab value="0">Editor</Tab>
          <Tab value="1">HTML Output</Tab>
          <Tab value="2">Table of Contents</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div class="editor-grid">
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-file-edit"></i>
                  <span>Markdown</span>
                  <Tag
                    v-if="wordCount.words > 0"
                    :value="`${wordCount.words} words`"
                    severity="secondary"
                  />
                </div>
                <CodeEditor v-model="state.markdown" mode="markdown" height="450px" />
              </div>
              <div class="editor-panel">
                <div class="panel-label">
                  <i class="pi pi-eye"></i>
                  <span>Preview</span>
                </div>
                <div class="preview-content" v-html="state.html"></div>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="1">
            <div class="panel-label">
              <i class="pi pi-code"></i>
              <span>Generated HTML</span>
              <Tag v-if="state.html" :value="`${state.html.length} chars`" severity="secondary" />
            </div>
            <CodeEditor
              :model-value="state.html"
              mode="html"
              height="450px"
              :options="{ readOnly: true }"
            />
          </TabPanel>

          <TabPanel value="2">
            <Panel toggleable>
              <template #header>
                <div class="panel-header">
                  <i class="pi pi-list"></i>
                  <span>Document Structure</span>
                  <Tag
                    v-if="tableOfContents.length > 0"
                    :value="`${tableOfContents.length} headings`"
                    severity="info"
                  />
                </div>
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
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Toolbar class="footer-toolbar">
        <template #start>
          <div class="stats-display">
            <Tag :value="`${wordCount.words} words`" severity="secondary" icon="pi pi-file" />
            <Tag :value="`${wordCount.characters} chars`" severity="secondary" />
            <Tag :value="`${wordCount.lines} lines`" severity="secondary" />
          </div>
        </template>
        <template #center>
          <Button
            v-tooltip.top="'Load Sample'"
            icon="pi pi-file"
            label="Sample"
            severity="info"
            text
            @click="loadSample"
          />
          <Button
            v-tooltip.top="'Clear'"
            icon="pi pi-trash"
            severity="danger"
            text
            :disabled="!state.markdown"
            @click="clearAll"
          />
        </template>
        <template #end>
          <Button
            icon="pi pi-copy"
            label="Copy MD"
            severity="secondary"
            :disabled="!state.markdown"
            @click="copyMarkdown"
          />
          <Button
            icon="pi pi-copy"
            label="Copy HTML"
            severity="secondary"
            :disabled="!state.html"
            @click="copyHtml"
          />
          <Button
            icon="pi pi-download"
            label=".md"
            severity="info"
            :disabled="!state.markdown"
            @click="downloadMarkdown"
          />
          <Button
            icon="pi pi-download"
            label=".html"
            severity="info"
            :disabled="!state.html"
            @click="downloadHtml"
          />
        </template>
      </Toolbar>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.toolbar-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }

  :deep(.p-panel-content) {
    padding: 0.5rem;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  i {
    color: var(--primary-color);
  }
}

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

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 0;

  i {
    color: var(--primary-color);
  }
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.5rem;
  color: var(--text-color-secondary);

  i {
    font-size: 2rem;
    color: var(--primary-color);
    opacity: 0.5;
  }

  small {
    font-size: 0.85rem;
    opacity: 0.7;
  }
}

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

.footer-toolbar {
  margin-top: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-center),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.stats-display {
  display: flex;
  gap: 0.5rem;
}
</style>
