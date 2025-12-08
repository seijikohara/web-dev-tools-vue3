<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const year = computed(() => dayjs().format('YYYY'))
</script>

<template>
  <div class="layout-footer" :class="{ 'sidebar-collapsed': uiStore.isSidebarCollapsed }">
    Seiji Kohara &copy; {{ year }}
  </div>
</template>

<style lang="scss">
.layout-footer {
  display: flex;
  font-size: 0.875rem;
  margin-left: $sidebarWidth;
  padding: 1rem 1.5rem;
  background-color: var(--surface-b);
  color: var(--text-color-secondary);
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--surface-d);
  transition: margin-left $transitionDuration;

  &.sidebar-collapsed {
    margin-left: $sidebarCollapsedWidth;
  }
}
@media screen and (max-width: $breakpoint) {
  .layout-footer {
    margin-left: 0;

    &.sidebar-collapsed {
      margin-left: 0;
    }
  }
}
</style>
