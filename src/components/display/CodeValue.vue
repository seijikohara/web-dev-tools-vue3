<script setup lang="ts">
defineProps<{
  value: string
  variant?: 'default' | 'added' | 'removed'
}>()
</script>

<template>
  <code :class="['code-value', variant ? `code-value--${variant}` : '']">{{ value }}</code>
</template>

<style lang="scss" scoped>
.code-value {
  &--added {
    background-color: rgba(34, 197, 94, 0.1);
    color: var(--green-500);
  }

  &--removed {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--red-500);
  }
}
</style>
