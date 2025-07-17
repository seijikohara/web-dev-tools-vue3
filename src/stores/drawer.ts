import { readonly } from 'vue'
import { useToggle } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useDrawerStore = defineStore('drawer', () => {
  const [isDrawerOpened, toggle] = useToggle(false)

  const open = (): void => {
    toggle(true)
  }

  const close = (): void => {
    toggle(false)
  }

  return {
    isDrawerOpened: readonly(isDrawerOpened),
    open,
    close,
    toggle,
  }
})
