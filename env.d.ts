/// <reference types="vite/client" />

import type { MenuCategory } from '@/router'

declare module '*.vue' {
  import type { Component } from 'vue'
  const component: Component
  export default component
}

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    menu: boolean
    icon?: string
    category?: MenuCategory
  }
}

declare global {
  interface ImportMetaEnv {
    readonly VUE_APP_API_BASE_URL: string
    readonly VUE_APP_HISTORY_MODE: 'hash' | 'history'
    readonly VUE_APP_GA_MEASUREMENT_ID?: string
    readonly MODE: 'development' | 'production'
    readonly DEV: boolean
    readonly PROD: boolean
    readonly SSR: boolean
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
