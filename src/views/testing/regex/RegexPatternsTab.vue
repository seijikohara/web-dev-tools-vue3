<script setup lang="ts">
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { COMMON_PATTERNS } from '@/composables/useRegexTester'

const emit = defineEmits<{
  usePattern: [pattern: string]
}>()
</script>

<template>
  <div class="common-patterns">
    <div class="patterns-intro">
      <Message severity="info" :closable="false">
        <div class="message-content">
          <i class="pi pi-lightbulb"></i>
          <span>Click on a pattern to load it into the editor</span>
        </div>
      </Message>
    </div>

    <div class="patterns-grid">
      <div
        v-for="p in COMMON_PATTERNS"
        :key="p.name"
        class="pattern-card"
        @click="emit('usePattern', p.pattern)"
      >
        <div class="pattern-header">
          <i :class="p.icon"></i>
          <span class="pattern-name">{{ p.name }}</span>
        </div>
        <code class="pattern-value">{{ p.pattern }}</code>
        <div class="pattern-action">
          <Tag value="Click to use" severity="secondary" icon="pi pi-arrow-right" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.common-patterns {
  padding: 0.5rem 0;
}

.patterns-intro {
  margin-bottom: 1rem;
}

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.pattern-card {
  padding: 1rem;
  background-color: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--surface-hover);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  i {
    color: var(--primary-color);
  }

  .pattern-name {
    font-weight: 600;
    font-size: 1rem;
  }
}

.pattern-value {
  display: block;
  font-size: 0.8rem;
  word-break: break-all;
  color: var(--text-color-secondary);
  background: var(--surface-card);
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.pattern-action {
  display: flex;
  justify-content: flex-end;
}
</style>
