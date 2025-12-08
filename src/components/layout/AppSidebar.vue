<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { MENU_CATEGORIES, type MenuCategory } from '@/router'

interface MenuItem {
  name: string
  path: string
  icon: string
  category: MenuCategory
}

interface CategoryGroup {
  category: MenuCategory
  label: string
  icon: string
  items: MenuItem[]
  order: number
}

const uiStore = useUIStore()
const isDrawerOpened = computed(() => uiStore.isDrawerOpened)
const isCollapsed = computed(() => uiStore.isSidebarCollapsed)
const router = useRouter()
const route = useRoute()

const collapsedCategories = ref<Set<MenuCategory>>(new Set())

const menuItems = computed<MenuItem[]>(() =>
  router
    .getRoutes()
    .filter(r => r.meta.menu)
    .map(r => ({
      name: String(r.name ?? ''),
      path: r.path,
      icon: r.meta.icon ?? 'pi pi-circle',
      category: (r.meta.category as MenuCategory | undefined) ?? 'dashboard',
    })),
)

const groupedMenuItems = computed<CategoryGroup[]>(() => {
  const groups = new Map<MenuCategory, MenuItem[]>()

  menuItems.value.forEach(item => {
    const existing = groups.get(item.category) ?? []
    existing.push(item)
    groups.set(item.category, existing)
  })

  return Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      label: MENU_CATEGORIES[category].label,
      icon: MENU_CATEGORIES[category].icon,
      items,
      order: MENU_CATEGORIES[category].order,
    }))
    .sort((a, b) => a.order - b.order)
})

const currentRouteName = computed(() => route.name)

const toggleCategory = (category: MenuCategory) => {
  if (collapsedCategories.value.has(category)) {
    collapsedCategories.value.delete(category)
  } else {
    collapsedCategories.value.add(category)
  }
}

const isCategoryCollapsed = (category: MenuCategory) => collapsedCategories.value.has(category)

const onMenuClick = () => uiStore.closeDrawer()
</script>

<template>
  <div v-if="isDrawerOpened" class="sidebar-overlay" @click="onMenuClick"></div>
  <nav
    class="layout-sidebar"
    :class="{
      active: isDrawerOpened,
      collapsed: isCollapsed,
    }"
    role="navigation"
    aria-label="Main navigation"
  >
    <div class="sidebar-content">
      <template v-for="group in groupedMenuItems" :key="group.category">
        <div
          v-if="group.category !== 'dashboard'"
          v-tooltip.right="{ value: group.label, disabled: !isCollapsed }"
          class="category-header"
          role="button"
          tabindex="0"
          :aria-expanded="!isCategoryCollapsed(group.category)"
          @click="toggleCategory(group.category)"
          @keydown.enter="toggleCategory(group.category)"
          @keydown.space.prevent="toggleCategory(group.category)"
        >
          <i :class="group.icon" class="category-icon"></i>
          <span class="category-label">{{ group.label }}</span>
          <i
            class="toggle-icon pi"
            :class="isCategoryCollapsed(group.category) ? 'pi-chevron-down' : 'pi-chevron-up'"
          ></i>
        </div>

        <ul
          class="menu-list"
          :class="{
            collapsed: group.category !== 'dashboard' && isCategoryCollapsed(group.category),
            'dashboard-group': group.category === 'dashboard',
          }"
          role="menu"
        >
          <li v-for="item in group.items" :key="item.path" role="none">
            <router-link
              v-tooltip.right="{ value: item.name, disabled: !isCollapsed }"
              :to="item.path"
              class="menu-item"
              :class="{ 'menu-active': item.name === currentRouteName }"
              role="menuitem"
              :aria-current="item.name === currentRouteName ? 'page' : undefined"
              @click="onMenuClick"
            >
              <i :class="item.icon" class="menu-icon"></i>
              <span class="menu-label">{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </template>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  position: fixed;
  left: 0;
  top: $topbarHeight;
  height: calc(100vh - #{$topbarHeight});
  width: $sidebarWidth;
  background-color: var(--surface-a);
  border-right: 1px solid var(--surface-border);
  overflow-y: auto;
  overflow-x: hidden;
  transition:
    width 0.3s ease,
    transform 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;

  &.collapsed {
    width: $sidebarCollapsedWidth;
  }

  // Modern custom scrollbar
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--primary-color-rgb, 79, 170, 162), 0.4) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 3px;
    opacity: 0.4;

    &:hover {
      opacity: 0.8;
    }
  }
}

.sidebar-content {
  padding: 0.5rem 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin: 0.25rem 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border-radius: 6px;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--surface-hover);
    color: var(--text-color);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
}

.category-icon {
  font-size: 0.875rem;
  margin-right: 0.5rem;
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

.category-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.2s ease;

  .layout-sidebar.collapsed & {
    opacity: 0;
  }
}

.toggle-icon {
  font-size: 0.75rem;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
  flex-shrink: 0;
  opacity: 1;

  .layout-sidebar.collapsed & {
    opacity: 0;
  }
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0 0.5rem;
  overflow: hidden;
  max-height: 1000px;
  transition: max-height 0.3s ease;

  &.collapsed {
    max-height: 0;
    padding: 0 0.5rem;
  }

  &.dashboard-group {
    padding-bottom: 0.5rem;
    margin-bottom: 0.25rem;
    border-bottom: 1px solid var(--surface-border);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.625rem 1rem;
  margin: 2px 0;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: var(--surface-hover);
    color: var(--primary-color);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  &.menu-active {
    background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    font-weight: 600;

    // Left accent bar
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background-color: var(--primary-color);
      border-radius: 0 4px 4px 0;
    }

    .menu-icon {
      color: var(--primary-color);
    }

    &:hover {
      background-color: color-mix(in srgb, var(--primary-color) 20%, transparent);
    }
  }
}

.menu-icon {
  font-size: 1rem;
  width: 1.25rem;
  margin-right: 0.75rem;
  text-align: center;
  color: var(--text-color-secondary);
  transition: color 0.2s ease;
  flex-shrink: 0;

  .menu-active & {
    color: inherit;
  }

  .menu-item:hover & {
    color: var(--primary-color);
  }
}

.menu-label {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transition: opacity 0.2s ease;

  .layout-sidebar.collapsed & {
    opacity: 0;
  }
}

.sidebar-overlay {
  display: none;
}

@media screen and (max-width: $breakpoint) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 998;
  }

  .layout-sidebar {
    top: 0;
    height: 100%;
    padding-top: 1rem;
    transform: translateX(-100%);
    z-index: 999;
    background: var(--surface-overlay, #ffffff);
    width: $sidebarWidth !important;

    &.active {
      transform: translateX(0);
    }

    &.collapsed {
      width: $sidebarWidth !important;
    }

    // モバイルでは常にテキストを表示
    .category-label,
    .toggle-icon,
    .menu-label {
      opacity: 1 !important;
    }
  }
}
</style>
