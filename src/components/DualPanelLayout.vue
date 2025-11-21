<script setup lang="ts">
import Panel from 'primevue/panel'

interface Props {
  leftHeader: string
  rightHeader: string
}

const { leftHeader, rightHeader } = defineProps<Props>()
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-6 lg:col-6">
      <Panel :header="leftHeader">
        <slot name="left"></slot>
      </Panel>
    </div>
    <div class="col-12 md:col-6 lg:col-6">
      <Panel :header="rightHeader">
        <slot name="right"></slot>
      </Panel>
    </div>
  </div>
</template>
