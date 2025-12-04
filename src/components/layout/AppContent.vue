<script setup lang="ts">
import { onErrorCaptured, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import Message from 'primevue/message'

import LoadingSpinner from '@/components/LoadingSpinner.vue'

const error = reactive({ message: null as string | null })
onErrorCaptured(e => {
  error.message = e.message
  return true
})
const route = useRoute()
watch(
  () => route.params,
  () => (error.message = null),
)
</script>

<template>
  <div class="layout-content">
    <div class="content-section">
      <router-view v-slot="{ Component }">
        <Message v-if="error.message" severity="error" :closable="false">
          {{ error.message }}
        </Message>
        <Suspense v-else timeout="0">
          <template #default>
            <component :is="Component" />
          </template>
          <template #fallback>
            <LoadingSpinner />
          </template>
        </Suspense>
      </router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-content {
  margin-left: $sidebarWidth;
  padding-top: $topbarHeight;
  flex: 1;
  display: flex;
  flex-direction: column;
  .content-section {
    padding: 1.5rem 2rem;
    background-color: var(--surface-b);
    color: var(--text-color);
    flex: 1;
  }
}
@media screen and (max-width: $breakpoint) {
  .layout-content {
    margin-left: 0;
  }
}
</style>
