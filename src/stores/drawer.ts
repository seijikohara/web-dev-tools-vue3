/**
 * @deprecated This store is deprecated. Please use `useUIStore` from '@/stores/ui' instead.
 *
 * Migration guide:
 * - useDrawerStore() -> useUIStore()
 * - drawerStore.isDrawerOpened -> uiStore.isDrawerOpened
 * - drawerStore.open() -> uiStore.openDrawer()
 * - drawerStore.close() -> uiStore.closeDrawer()
 * - drawerStore.toggle() -> uiStore.toggleDrawer()
 */

import { defineStore } from 'pinia'
import { useUIStore } from './ui'

/**
 * @deprecated Use `useUIStore` instead
 */
export const useDrawerStore = defineStore('drawer', () => {
  const uiStore = useUIStore()

  return {
    isDrawerOpened: uiStore.isDrawerOpened,
    open: uiStore.openDrawer,
    close: uiStore.closeDrawer,
    toggle: uiStore.toggleDrawer,
  }
})
