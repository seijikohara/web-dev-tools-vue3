<script setup lang="ts">
defineProps<{
  icon?: string
  message: string
}>()
</script>

<template>
  <div class="empty-state">
    <i v-if="icon" :class="`pi pi-${icon}`"></i>
    <span>{{ message }}</span>
    <slot />
  </div>
</template>
