<template>
  <div
    class="layout-sidebar"
    :class="{ active: isDrawerOpened }"
    @click="onClick"
  >
    <ul class="layout-menu">
      <li v-for="(route, key) in routes" :key="key">
        <router-link
          :to="route.path"
          :class="{
            'menu-active': route.name === currentRouteName,
            'menu-inactive': route.name !== currentRouteName,
          }"
        >
          <i class="menu-icon pi pi-th-large" />
          <span>{{ route.name }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDrawerStore } from '@/stores/drawer'

const drawerStore = useDrawerStore()
const isDrawerOpened = computed(() => drawerStore.$state.isDrawerOpened)
const router = useRouter()
const routes = computed(() =>
  router
    .getRoutes()
    .filter((route) => route.meta['menu'])
    .map((route) => {
      return {
        name: route.name,
        path: route.path,
      }
    }),
)
const currentRouteName = computed(() => useRoute().name)
const onClick = () => drawerStore.close()
</script>

<style lang="scss">
.layout-sidebar {
  position: fixed;
  left: 0;
  top: $topbarHeight;
  height: calc(100vh - #{$topbarHeight});
  background-color: var(--surface-a);
  overflow: auto;
  width: $sidebarWidth;
  border-right: 1px solid var(--surface-d);
  transition: transform 0.4s cubic-bezier(0.05, 0.74, 0.2, 0.99),
    -webkit-transform 0.4s cubic-bezier(0.05, 0.74, 0.2, 0.99);
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    li {
      display: inline;
      padding: 0;
      margin: 0;
      a {
        display: block;
        padding: 0.75rem 1rem;
        text-decoration: none;
        margin: 1px 0px;
        text-align: left;
        border-radius: 4px;
        &:hover {
          color: #ffffff;
          background-color: #c4cee2;
          transition: all 0.25s ease;
        }
      }
    }
  }
}
.menu-active {
  color: #70acb1;
  background-color: #59606d;
}
.menu-inactive {
  color: var(--text-color);
}
.menu-icon {
  margin-right: 1.5rem;
}
@media screen and (max-width: $breakpoint) {
  .layout-sidebar {
    top: 0;
    z-index: 999;
    height: 100%;
    transform: translateX(-100%);
  }
  .layout-sidebar.active {
    transform: translateX(0);
  }
}
</style>
