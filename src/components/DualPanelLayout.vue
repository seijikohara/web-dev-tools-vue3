<script setup lang="ts">
import Panel from 'primevue/panel'

defineProps<{
  leftHeader: string
  rightHeader: string
}>()
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-6 lg:col-6">
      <Panel :header="leftHeader">
        <slot name="left" />
      </Panel>
    </div>
    <div class="col-12 md:col-6 lg:col-6">
      <Panel :header="rightHeader">
        <slot name="right" />
      </Panel>
    </div>
  </div>
</template>
