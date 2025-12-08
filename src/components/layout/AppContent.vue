<script setup lang="ts">
import { computed, onErrorCaptured, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import Message from 'primevue/message'

import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useUIStore } from '@/stores/ui'

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

const uiStore = useUIStore()
const isCollapsed = computed(() => uiStore.isSidebarCollapsed)
</script>

<template>
  <div class="layout-content" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="content-section">
      <router-view v-slot="{ Component, route: currentRoute }">
        <Message v-if="error.message" severity="error" :closable="false">
          {{ error.message }}
        </Message>
        <Transition v-else-if="Component" name="fade" mode="out-in">
          <div :key="currentRoute.path">
            <Suspense timeout="0">
              <template #default>
                <component :is="Component" />
              </template>
              <template #fallback>
                <LoadingSpinner />
              </template>
            </Suspense>
          </div>
        </Transition>
        <LoadingSpinner v-else />
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
  transition: margin-left 0.3s ease;

  &.sidebar-collapsed {
    margin-left: $sidebarCollapsedWidth;
  }

  .content-section {
    padding: 1.5rem 2rem;
    background-color: var(--surface-b);
    color: var(--text-color);
    flex: 1;
  }
}

// Page transition animations
.fade-enter-active {
  animation: content-fade-in 0.4s ease-out;
}

.fade-leave-active {
  animation: content-fade-out 0.2s ease-in;
}

@keyframes content-fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes content-fade-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

@media screen and (max-width: $breakpoint) {
  .layout-content {
    margin-left: 0;

    &.sidebar-collapsed {
      margin-left: 0;
    }
  }
}
</style>
