<script setup lang="ts">
defineProps<{
  icon?: string
}>()
</script>

<template>
  <div class="panel-header">
    <i v-if="icon" :class="`pi pi-${icon}`"></i>
    <slot />
  </div>
</template>
