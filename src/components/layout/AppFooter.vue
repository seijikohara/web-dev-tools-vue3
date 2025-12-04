<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

const year = computed(() => dayjs().format('YYYY'))
</script>

<template>
  <div class="layout-footer">Seiji Kohara &copy; {{ year }}</div>
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
}
@media screen and (max-width: $breakpoint) {
  .layout-footer {
    margin-left: 0;
  }
}
</style>
