<script setup lang="ts">
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import type { Match } from '@/composables/useRegexTester'

interface Props {
  testString: string
  matches: Match[]
  highlightedText: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:testString': [value: string]
}>()
</script>

<template>
  <div class="test-section">
    <div class="option-item">
      <label for="testString">
        <i class="pi pi-file-edit"></i>
        Test String
      </label>
      <CodeEditor
        :model-value="testString"
        mode="plain_text"
        height="200px"
        @update:model-value="emit('update:testString', $event)"
      />
    </div>

    <div v-if="testString" class="results-section">
      <Toolbar class="editor-toolbar">
        <template #start>
          <div class="match-stats">
            <Tag
              :value="`${matches.length} match${matches.length !== 1 ? 'es' : ''}`"
              :severity="matches.length > 0 ? 'success' : 'secondary'"
              icon="pi pi-search"
            />
          </div>
        </template>
      </Toolbar>

      <SectionDivider icon="eye">Highlighted Matches</SectionDivider>

      <div class="highlighted-text" v-html="highlightedText"></div>

      <div v-if="matches.length > 0">
        <SectionDivider icon="list">Match Details</SectionDivider>

        <DataTable
          :value="matches"
          striped-rows
          size="small"
          :paginator="matches.length > 10"
          :rows="10"
          class="match-table"
        >
          <Column field="index" header="#" :header-style="{ width: '60px' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.index + 1" severity="secondary" />
            </template>
          </Column>
          <Column field="match" header="Match">
            <template #body="slotProps">
              <code class="code-value">{{ slotProps.data.match }}</code>
            </template>
          </Column>
          <Column header="Position" :header-style="{ width: '120px' }">
            <template #body="slotProps">
              <Tag :value="`${slotProps.data.start}-${slotProps.data.end}`" severity="info" />
            </template>
          </Column>
          <Column header="Groups">
            <template #body="slotProps">
              <div v-if="slotProps.data.groups.length > 0" class="groups-list">
                <Tag
                  v-for="(g, i) in slotProps.data.groups"
                  :key="i"
                  :value="`$${i + 1}: ${g}`"
                  severity="warn"
                />
              </div>
              <span v-else class="no-groups">No groups</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-file-edit"></i>
      <span>Enter a test string to see matches</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.test-section {
  padding: 0.5rem 0;
}

.match-stats {
  display: flex;
  gap: 0.5rem;
}

.highlighted-text {
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  margin-bottom: 1rem;

  :deep(.highlight) {
    background-color: #fef08a;
    color: #000;
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
    font-weight: 600;
  }
}

.match-table {
  margin-top: 1rem;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.no-groups {
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
