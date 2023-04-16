import { defineStore } from 'pinia'

interface State {
  isDrawerOpened: boolean
}

export const useDrawerStore = defineStore('drawer', {
  state: (): State => {
    return {
      isDrawerOpened: false,
    }
  },
  actions: {
    open() {
      this.isDrawerOpened = true
    },
    close() {
      this.isDrawerOpened = false
    },
  },
})
