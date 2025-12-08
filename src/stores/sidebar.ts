/**
 * @deprecated This store is deprecated. Please use `useUIStore` from '@/stores/ui' instead.
 *
 * Migration guide:
 * - useSidebarStore() -> useUIStore()
 * - sidebarStore.isCollapsed -> uiStore.isSidebarCollapsed
 * - sidebarStore.toggle() -> uiStore.toggleSidebar()
 * - sidebarStore.collapse() -> uiStore.collapseSidebar()
 * - sidebarStore.expand() -> uiStore.expandSidebar()
 */

import { defineStore } from 'pinia'
import { useUIStore } from './ui'

/**
 * @deprecated Use `useUIStore` instead
 */
export const useSidebarStore = defineStore('sidebar', () => {
  const uiStore = useUIStore()

  return {
    isCollapsed: uiStore.isSidebarCollapsed,
    toggle: uiStore.toggleSidebar,
    collapse: uiStore.collapseSidebar,
    expand: uiStore.expandSidebar,
  }
})
