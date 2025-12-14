<script setup lang="ts">
import Divider from 'primevue/divider'

defineProps<{
  icon?: string
  align?: 'left' | 'center' | 'right'
}>()
</script>

<template>
  <Divider :align="align ?? 'left'">
    <span class="divider-text">
      <i v-if="icon" :class="`pi pi-${icon}`"></i>
      <slot />
    </span>
  </Divider>
</template>
