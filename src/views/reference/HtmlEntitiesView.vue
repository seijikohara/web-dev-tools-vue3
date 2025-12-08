<script setup lang="ts">
import { ref } from 'vue'
import DOMPurify from 'dompurify'

import Button from 'primevue/button'
import Card from 'primevue/card'
import DataView from 'primevue/dataview'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Divider from 'primevue/divider'

import type { HtmlEntity } from '@/api/endpoints/html-entities'
import { searchHtmlEntities } from '@/api'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy } = useClipboardToast()

/**
 * Sanitize HTML entity reference to prevent XSS
 */
const sanitizeEntity = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  })
}

interface PageEvent {
  page: number
  first?: number
  rows: number
  pageCount?: number
}

const layout = ref<'list' | 'grid'>('list')
const searchWord = ref('')
const page = ref(0)
const size = ref(50)
const totalRecords = ref(0)
const entities = ref<HtmlEntity[]>([])
const isLoading = ref(false)

const layoutOptions = [
  { icon: 'pi pi-bars', value: 'list' },
  { icon: 'pi pi-th-large', value: 'grid' },
]

const onPage = async (event: PageEvent) => {
  page.value = event.page
  size.value = event.rows
  isLoading.value = true
  try {
    const pagedEntities = await searchHtmlEntities(searchWord.value, page.value, size.value)
    entities.value = pagedEntities.content
    totalRecords.value = pagedEntities.totalElements
  } finally {
    isLoading.value = false
  }
}

const onClickSearch = async () => {
  await onPage({ page: 0, rows: size.value })
}

const clearSearch = () => {
  searchWord.value = ''
  void onClickSearch()
}

const copyEntity = (entity: HtmlEntity) => {
  void copy(entity.entityReference, { detail: `${entity.entityReference} copied to clipboard` })
}

await onClickSearch()
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>HTML Entities</span>
      </div>
    </template>
    <template #subtitle> Browse and search HTML entity references </template>
    <template #content>
      <Panel toggleable class="search-panel">
        <template #header>
          <div class="panel-header">
            <i class="pi pi-search"></i>
            <span>Search</span>
            <Tag
              v-if="totalRecords > 0"
              :value="`${totalRecords} entities`"
              severity="info"
              icon="pi pi-list"
            />
          </div>
        </template>

        <div class="search-content">
          <InputGroup class="search-input-group">
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText
              v-model="searchWord"
              placeholder="Search entities by name, code, or description..."
              @keyup.enter="onClickSearch"
            />
            <Button
              label="Search"
              icon="pi pi-search"
              :loading="isLoading"
              @click="onClickSearch"
            />
            <Button
              v-tooltip.top="'Clear'"
              icon="pi pi-times"
              severity="secondary"
              text
              :disabled="!searchWord"
              @click="clearSearch"
            />
          </InputGroup>

          <div class="layout-toggle">
            <span class="layout-label">View:</span>
            <SelectButton
              v-model="layout"
              :options="layoutOptions"
              option-label="icon"
              option-value="value"
              data-key="value"
            >
              <template #option="slotProps">
                <i :class="slotProps.option.icon"></i>
              </template>
            </SelectButton>
          </div>
        </div>
      </Panel>

      <Divider v-if="entities.length > 0" align="left">
        <span class="divider-text">
          <i class="pi pi-list"></i>
          Results
          <Tag :value="`Showing ${entities.length} of ${totalRecords}`" severity="secondary" />
        </span>
      </Divider>

      <DataView
        data-key="name"
        :value="entities"
        :layout="layout"
        paginator-position="both"
        :paginator="true"
        :rows="size"
        :lazy="true"
        :total-records="totalRecords"
        :always-show-paginator="false"
        :rows-per-page-options="[25, 50, 100, 200, 1000]"
        @page="onPage($event)"
      >
        <template #list="slotProps">
          <div class="entity-list">
            <div v-for="(item, index) in slotProps.items" :key="index" class="entity-item">
              <div class="entity-char" v-html="sanitizeEntity(item.entityReference)"></div>
              <div class="entity-details">
                <div class="entity-code-row">
                  <code class="entity-reference">{{ item.entityReference }}</code>
                  <Button
                    v-tooltip.top="'Copy'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    @click="copyEntity(item)"
                  />
                </div>
                <div class="entity-info">
                  <Tag :value="item.name" severity="info" />
                  <span class="entity-description">{{ item.description }}</span>
                </div>
                <div v-if="item.standard || item.dtd" class="entity-meta">
                  <Tag v-if="item.standard" :value="item.standard" severity="secondary" />
                  <Tag v-if="item.dtd" :value="item.dtd" severity="secondary" />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #grid="slotProps">
          <div class="entity-grid">
            <div
              v-for="(item, index) in slotProps.items"
              :key="index"
              v-tooltip.top="item.description"
              class="entity-grid-item"
              @click="copyEntity(item)"
            >
              <div class="entity-char" v-html="sanitizeEntity(item.entityReference)"></div>
              <code class="entity-code">{{ item.entityReference }}</code>
              <span class="entity-name">{{ item.name }}</span>
            </div>
          </div>
        </template>
        <template #empty>
          <div class="empty-message">
            <i class="pi pi-inbox"></i>
            <span>No entities found.</span>
            <small>Try a different search term</small>
          </div>
        </template>
      </DataView>
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

.search-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
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

.search-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}

.search-input-group {
  flex: 1;
  min-width: 0;
}

.layout-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .layout-label {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
  }
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-color);
  }
}

.entity-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  overflow: hidden;
}

.entity-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  align-items: flex-start;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--surface-border);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(odd) {
    background-color: var(--p-surface-50);
  }

  &:nth-child(even) {
    background-color: var(--p-surface-0);
  }

  &:hover {
    background-color: var(--p-surface-100);
  }
}

.entity-char {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 4rem;
  height: 4rem;
  font-size: 2rem;
  background-color: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;

  &:hover {
    font-size: 2.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

.entity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.entity-code-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.entity-reference {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.95rem;
  color: var(--primary-color);
  background-color: var(--surface-card);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.entity-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.entity-description {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.entity-meta {
  display: flex;
  gap: 0.5rem;
}

.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.entity-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: var(--surface-hover);

    .entity-char {
      font-size: 2.5rem;
    }
  }

  .entity-char {
    width: 4rem;
    margin-bottom: 0.5rem;
  }

  .entity-code {
    font-size: 0.75rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    color: var(--primary-color);
  }

  .entity-name {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    text-align: center;
    word-break: break-word;
    margin-top: 0.25rem;
  }
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.5rem;
  color: var(--text-color-secondary);

  i {
    font-size: 2rem;
    color: var(--primary-color);
    opacity: 0.5;
  }

  span {
    font-size: 1.1rem;
  }

  small {
    font-size: 0.85rem;
    opacity: 0.7;
  }
}
</style>
