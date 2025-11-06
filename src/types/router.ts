import type { RouteRecordRaw } from 'vue-router'

/**
 * Custom route meta information
 */
export interface RouteMeta {
  title: string
  menu: boolean
}

/**
 * Application route definition extending Vue Router's RouteRecordRaw
 */
export type AppRoute = RouteRecordRaw & {
  meta: RouteMeta
}
