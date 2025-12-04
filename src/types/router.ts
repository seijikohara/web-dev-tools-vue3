import type { RouteRecordRaw } from 'vue-router'

/**
 * Menu category definitions
 */
export type MenuCategory =
  | 'dashboard'
  | 'formatters'
  | 'encoders'
  | 'cryptography'
  | 'generators'
  | 'converters'
  | 'testing'

/**
 * Category metadata for sidebar grouping
 */
export interface CategoryMeta {
  label: string
  icon: string
  order: number
}

/**
 * Category definitions with display information
 */
export const MENU_CATEGORIES: Record<MenuCategory, CategoryMeta> = {
  dashboard: { label: 'Dashboard', icon: 'pi pi-home', order: 0 },
  formatters: { label: 'Formatters', icon: 'pi pi-align-left', order: 1 },
  encoders: { label: 'Encoders', icon: 'pi pi-code', order: 2 },
  cryptography: { label: 'Cryptography', icon: 'pi pi-lock', order: 3 },
  generators: { label: 'Generators', icon: 'pi pi-bolt', order: 4 },
  converters: { label: 'Converters', icon: 'pi pi-sync', order: 5 },
  testing: { label: 'Testing', icon: 'pi pi-check-circle', order: 6 },
}

/**
 * Custom route meta information
 */
export interface RouteMeta {
  title: string
  menu: boolean
  icon?: string
  category?: MenuCategory
}

/**
 * Application route definition extending Vue Router's RouteRecordRaw
 */
export type AppRoute = RouteRecordRaw & {
  meta: RouteMeta
}
