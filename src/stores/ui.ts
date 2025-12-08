import { readonly } from 'vue'
import { useToggle, useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', () => {
  // Drawer state (mobile menu)
  const [isDrawerOpened, toggleDrawer] = useToggle(false)

  const openDrawer = (): void => {
    toggleDrawer(true)
  }

  const closeDrawer = (): void => {
    toggleDrawer(false)
  }

  // Sidebar state (collapse)
  const isSidebarCollapsed = useLocalStorage('sidebar-collapsed', false)

  const toggleSidebar = (): void => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  const collapseSidebar = (): void => {
    isSidebarCollapsed.value = true
  }

  const expandSidebar = (): void => {
    isSidebarCollapsed.value = false
  }

  return {
    // Drawer
    isDrawerOpened: readonly(isDrawerOpened),
    openDrawer,
    closeDrawer,
    toggleDrawer,

    // Sidebar
    isSidebarCollapsed: readonly(isSidebarCollapsed),
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
  }
})
