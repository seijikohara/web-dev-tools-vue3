<template>
  <div class="loading-container">
    <ProgressSpinner />
  </div>
</template>

<script setup lang="ts">
import ProgressSpinner from "primevue/progressspinner";
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}
</style>
