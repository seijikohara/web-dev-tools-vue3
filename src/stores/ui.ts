import { readonly } from 'vue'
import { useToggle, useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

/**
 * Storage key for sidebar state
 */
const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed' as const

/**
 * Create drawer actions
 */
const createDrawerActions = (toggleDrawer: (value?: boolean) => boolean) =>
  ({
    openDrawer: () => toggleDrawer(true),
    closeDrawer: () => toggleDrawer(false),
    toggleDrawer,
  }) as const

/**
 * Create sidebar actions
 */
const createSidebarActions = (isSidebarCollapsed: { value: boolean }) =>
  ({
    toggleSidebar: () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
    },
    collapseSidebar: () => {
      isSidebarCollapsed.value = true
    },
    expandSidebar: () => {
      isSidebarCollapsed.value = false
    },
  }) as const

export const useUIStore = defineStore('ui', () => {
  // Drawer state (mobile menu)
  const [isDrawerOpened, toggleDrawer] = useToggle(false)
  const drawerActions = createDrawerActions(toggleDrawer)

  // Sidebar state (collapse)
  const isSidebarCollapsed = useLocalStorage(SIDEBAR_STORAGE_KEY, false)
  const sidebarActions = createSidebarActions(isSidebarCollapsed)

  return {
    // Drawer
    isDrawerOpened: readonly(isDrawerOpened),
    ...drawerActions,

    // Sidebar
    isSidebarCollapsed: readonly(isSidebarCollapsed),
    ...sidebarActions,
  }
})
