<template>
  <div class="layout-footer">Seiji Kohara &copy; {{ year }}</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";

const year = computed(() => dayjs().format("YYYY"));
</script>

<style lang="scss">
.layout-footer {
  display: flex;
  font-size: 1rem;
  margin-left: $sidebarWidth;
  padding: 1.5rem;
  background-color: var(--surface-a);
  align-items: center;
  justify-content: space-between;
}
@media screen and (max-width: $breakpoint) {
  .layout-footer {
    margin-left: 0;
  }
}
</style>
