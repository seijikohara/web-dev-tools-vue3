<script setup lang="ts">
defineProps<{
  columns?: 2 | 3
}>()
</script>

<template>
  <div :class="columns === 3 ? 'editor-grid-3col' : 'editor-grid-2col'">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.editor-grid-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
</style>
