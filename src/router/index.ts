import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouterHistory, RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'
import { useTitle } from '@vueuse/core'

/**
 * Menu category definitions
 */
export type MenuCategory =
  | 'dashboard'
  | 'formatters'
  | 'text'
  | 'encoders'
  | 'cryptography'
  | 'generators'
  | 'converters'
  | 'testing'
  | 'network'
  | 'reference'

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
  text: { label: 'Text', icon: 'pi pi-file-edit', order: 2 },
  encoders: { label: 'Encoders', icon: 'pi pi-code', order: 3 },
  cryptography: { label: 'Cryptography', icon: 'pi pi-lock', order: 4 },
  generators: { label: 'Generators', icon: 'pi pi-bolt', order: 5 },
  converters: { label: 'Converters', icon: 'pi pi-sync', order: 6 },
  testing: { label: 'Testing', icon: 'pi pi-check-circle', order: 7 },
  network: { label: 'Network', icon: 'pi pi-globe', order: 8 },
  reference: { label: 'Reference', icon: 'pi pi-book', order: 9 },
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

/**
 * Route definition helper type
 */
type RouteDefinition = [
  path: string,
  name: string,
  component: () => Promise<Component>,
  icon: string,
]

/**
 * Create a tool route with standard meta configuration
 */
const createToolRoute = (
  path: string,
  name: string,
  component: () => Promise<Component>,
  category: MenuCategory,
  icon: string,
): AppRoute => ({
  path,
  name,
  component,
  meta: { title: name, menu: true, icon, category },
})

/**
 * Create multiple routes for a category
 */
const createCategoryRoutes = (category: MenuCategory, routes: RouteDefinition[]): AppRoute[] =>
  routes.map(([path, name, component, icon]) =>
    createToolRoute(path, name, component, category, icon),
  )

/**
 * Application route definitions
 * Organized by category for consistent navigation
 */
const APP_ROUTES: readonly AppRoute[] = [
  // ============================================
  // Dashboard
  // ============================================
  ...createCategoryRoutes('dashboard', [
    ['/dashboard', 'Dashboard', () => import('@/views/dashboard/DashboardView.vue'), 'pi pi-home'],
  ]),

  // ============================================
  // Formatters (Code Formatting)
  // ============================================
  ...createCategoryRoutes('formatters', [
    [
      '/json-formatter',
      'JSON Formatter',
      () => import('@/views/formatters/JsonFormatterView.vue'),
      'pi pi-code',
    ],
    [
      '/xml-formatter',
      'XML Formatter',
      () => import('@/views/formatters/XmlFormatterView.vue'),
      'pi pi-file-edit',
    ],
    [
      '/yaml-formatter',
      'YAML Formatter',
      () => import('@/views/formatters/YamlFormatterView.vue'),
      'pi pi-file-edit',
    ],
    [
      '/sql-formatter',
      'SQL Formatter',
      () => import('@/views/formatters/SqlFormatterView.vue'),
      'pi pi-database',
    ],
  ]),

  // ============================================
  // Text Processing
  // ============================================
  ...createCategoryRoutes('text', [
    [
      '/markdown',
      'Markdown Editor',
      () => import('@/views/text/MarkdownEditorView.vue'),
      'pi pi-file-edit',
    ],
    [
      '/diff-viewer',
      'Diff Viewer',
      () => import('@/views/text/DiffView.vue'),
      'pi pi-arrows-alt',
    ],
    [
      '/string-case',
      'String Case Converter',
      () => import('@/views/text/StringCaseConverterView.vue'),
      'pi pi-sort-alpha-down',
    ],
  ]),

  // ============================================
  // Encoders & Decoders
  // ============================================
  ...createCategoryRoutes('encoders', [
    [
      '/base64',
      'Base64 Encoder',
      () => import('@/views/encoders/Base64EncoderView.vue'),
      'pi pi-code',
    ],
    [
      '/url-encoding',
      'URL Encoder',
      () => import('@/views/encoders/UrlEncoderView.vue'),
      'pi pi-link',
    ],
    [
      '/jwt-decoder',
      'JWT Decoder',
      () => import('@/views/encoders/JwtDecoderView.vue'),
      'pi pi-key',
    ],
  ]),

  // ============================================
  // Cryptography
  // ============================================
  ...createCategoryRoutes('cryptography', [
    [
      '/hash',
      'Hash Generator',
      () => import('@/views/cryptography/HashGeneratorView.vue'),
      'pi pi-hashtag',
    ],
    [
      '/bcrypt',
      'BCrypt Generator',
      () => import('@/views/cryptography/BcryptGeneratorView.vue'),
      'pi pi-lock',
    ],
    [
      '/ssh-key-generator',
      'SSH Key Generator',
      () => import('@/views/cryptography/SshKeyGeneratorView.vue'),
      'pi pi-key',
    ],
    [
      '/gpg-key-generator',
      'GPG Key Generator',
      () => import('@/views/cryptography/GpgKeyGeneratorView.vue'),
      'pi pi-shield',
    ],
  ]),

  // ============================================
  // Generators
  // ============================================
  ...createCategoryRoutes('generators', [
    [
      '/uuid-generator',
      'UUID Generator',
      () => import('@/views/generators/UuidGeneratorView.vue'),
      'pi pi-id-card',
    ],
    [
      '/password-generator',
      'Password Generator',
      () => import('@/views/generators/PasswordGeneratorView.vue'),
      'pi pi-key',
    ],
    [
      '/qr-code',
      'QR Code Generator',
      () => import('@/views/generators/QrCodeGeneratorView.vue'),
      'pi pi-qrcode',
    ],
    [
      '/cron-builder',
      'Cron Builder',
      () => import('@/views/generators/CronBuilderView.vue'),
      'pi pi-clock',
    ],
    [
      '/curl-builder',
      'cURL Builder',
      () => import('@/views/generators/CurlBuilderView.vue'),
      'pi pi-send',
    ],
  ]),

  // ============================================
  // Converters
  // ============================================
  ...createCategoryRoutes('converters', [
    [
      '/color-converter',
      'Color Converter',
      () => import('@/views/converters/ColorConverterView.vue'),
      'pi pi-palette',
    ],
    [
      '/timestamp-converter',
      'Timestamp Converter',
      () => import('@/views/converters/TimestampConverterView.vue'),
      'pi pi-clock',
    ],
  ]),

  // ============================================
  // Testing & Validation
  // ============================================
  ...createCategoryRoutes('testing', [
    [
      '/regex-tester',
      'Regex Tester',
      () => import('@/views/testing/RegexTesterView.vue'),
      'pi pi-search',
    ],
  ]),

  // ============================================
  // Network Tools
  // ============================================
  ...createCategoryRoutes('network', [
    ['/ip-lookup', 'IP Lookup', () => import('@/views/network/IpLookupView.vue'), 'pi pi-globe'],
  ]),

  // ============================================
  // Reference
  // ============================================
  ...createCategoryRoutes('reference', [
    [
      '/html-entities',
      'HTML Entities',
      () => import('@/views/reference/HtmlEntitiesView.vue'),
      'pi pi-tag',
    ],
  ]),
] as const

const historyCreators = {
  hash: () => createWebHashHistory(),
  history: () => createWebHistory(import.meta.env.BASE_URL),
} as const satisfies Record<string, () => RouterHistory>

type HistoryMode = keyof typeof historyCreators

const isHistoryMode = (mode: string): mode is HistoryMode => mode === 'hash' || mode === 'history'

const createHistory = (): RouterHistory => {
  const mode = import.meta.env.VUE_APP_HISTORY_MODE
  return isHistoryMode(mode) ? historyCreators[mode]() : historyCreators.history()
}

const router = createRouter({
  history: createHistory(),
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    ...APP_ROUTES,
  ],
})

router.afterEach(to => {
  useTitle(to.meta.title ? `${to.meta.title} - Web Dev Tools` : 'Web Dev Tools')
})

export default router
