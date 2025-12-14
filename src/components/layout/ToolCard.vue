<script setup lang="ts">
import Card from 'primevue/card'

defineProps<{
  icon: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i :class="`pi pi-${icon}`"></i>
        <span>{{ title }}</span>
      </div>
    </template>
    <template v-if="subtitle" #subtitle>{{ subtitle }}</template>
    <template #content>
      <slot />
    </template>
  </Card>
</template>
