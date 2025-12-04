import type { AppRoute } from '@/types/router'

/**
 * Application route definitions
 * Organized by category for consistent navigation
 */
export const APP_ROUTES: Readonly<AppRoute[]> = [
  // ============================================
  // Dashboard
  // ============================================
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: {
      title: 'Dashboard',
      menu: true,
      icon: 'pi pi-home',
      category: 'dashboard',
    },
  },

  // ============================================
  // Formatters & Viewers
  // ============================================
  {
    path: '/json-formatter',
    name: 'JSON Formatter',
    component: () => import('@/views/formatters/JsonFormatterView.vue'),
    meta: {
      title: 'JSON Formatter',
      menu: true,
      icon: 'pi pi-file',
      category: 'formatters',
    },
  },
  {
    path: '/xml-formatter',
    name: 'XML Formatter',
    component: () => import('@/views/formatters/XmlFormatterView.vue'),
    meta: {
      title: 'XML Formatter',
      menu: true,
      icon: 'pi pi-file',
      category: 'formatters',
    },
  },
  {
    path: '/yaml-formatter',
    name: 'YAML Formatter',
    component: () => import('@/views/formatters/YamlFormatterView.vue'),
    meta: {
      title: 'YAML Formatter',
      menu: true,
      icon: 'pi pi-file',
      category: 'formatters',
    },
  },
  {
    path: '/sql-formatter',
    name: 'SQL Formatter',
    component: () => import('@/views/formatters/SqlFormatterView.vue'),
    meta: {
      title: 'SQL Formatter',
      menu: true,
      icon: 'pi pi-database',
      category: 'formatters',
    },
  },
  {
    path: '/markdown',
    name: 'Markdown Editor',
    component: () => import('@/views/formatters/MarkdownEditorView.vue'),
    meta: {
      title: 'Markdown Editor',
      menu: true,
      icon: 'pi pi-pencil',
      category: 'formatters',
    },
  },
  {
    path: '/diff-viewer',
    name: 'Diff Viewer',
    component: () => import('@/views/formatters/DiffView.vue'),
    meta: {
      title: 'Diff Viewer',
      menu: true,
      icon: 'pi pi-arrows-h',
      category: 'formatters',
    },
  },

  // ============================================
  // Encoders & Decoders
  // ============================================
  {
    path: '/base64',
    name: 'Base64 Encoder',
    component: () => import('@/views/encoders/Base64EncoderView.vue'),
    meta: {
      title: 'Base64 Encoder',
      menu: true,
      icon: 'pi pi-code',
      category: 'encoders',
    },
  },
  {
    path: '/url-encoding',
    name: 'URL Encoder',
    component: () => import('@/views/encoders/UrlEncoderView.vue'),
    meta: {
      title: 'URL Encoder',
      menu: true,
      icon: 'pi pi-link',
      category: 'encoders',
    },
  },
  {
    path: '/html-entities',
    name: 'HTML Entities',
    component: () => import('@/views/encoders/HtmlEntitiesView.vue'),
    meta: {
      title: 'HTML Entities',
      menu: true,
      icon: 'pi pi-tag',
      category: 'encoders',
    },
  },
  {
    path: '/jwt-decoder',
    name: 'JWT Decoder',
    component: () => import('@/views/encoders/JwtDecoderView.vue'),
    meta: {
      title: 'JWT Decoder',
      menu: true,
      icon: 'pi pi-key',
      category: 'encoders',
    },
  },

  // ============================================
  // Hash & Cryptography
  // ============================================
  {
    path: '/hash',
    name: 'Hash Generator',
    component: () => import('@/views/cryptography/HashGeneratorView.vue'),
    meta: {
      title: 'Hash Generator',
      menu: true,
      icon: 'pi pi-hashtag',
      category: 'cryptography',
    },
  },
  {
    path: '/bcrypt',
    name: 'BCrypt Generator',
    component: () => import('@/views/cryptography/BcryptGeneratorView.vue'),
    meta: {
      title: 'BCrypt Generator',
      menu: true,
      icon: 'pi pi-lock',
      category: 'cryptography',
    },
  },

  // ============================================
  // Generators
  // ============================================
  {
    path: '/uuid-generator',
    name: 'UUID Generator',
    component: () => import('@/views/generators/UuidGeneratorView.vue'),
    meta: {
      title: 'UUID Generator',
      menu: true,
      icon: 'pi pi-id-card',
      category: 'generators',
    },
  },
  {
    path: '/qr-code',
    name: 'QR Code Generator',
    component: () => import('@/views/generators/QrCodeGeneratorView.vue'),
    meta: {
      title: 'QR Code Generator',
      menu: true,
      icon: 'pi pi-qrcode',
      category: 'generators',
    },
  },
  {
    path: '/cron-builder',
    name: 'Cron Builder',
    component: () => import('@/views/generators/CronBuilderView.vue'),
    meta: {
      title: 'Cron Builder',
      menu: true,
      icon: 'pi pi-clock',
      category: 'generators',
    },
  },
  {
    path: '/curl-builder',
    name: 'cURL Builder',
    component: () => import('@/views/generators/CurlBuilderView.vue'),
    meta: {
      title: 'cURL Builder',
      menu: true,
      icon: 'pi pi-code',
      category: 'generators',
    },
  },

  // ============================================
  // Converters
  // ============================================
  {
    path: '/json-to-typescript',
    name: 'JSON to TypeScript',
    component: () => import('@/views/converters/JsonToTypeScriptView.vue'),
    meta: {
      title: 'JSON to TypeScript',
      menu: true,
      icon: 'pi pi-arrow-right-arrow-left',
      category: 'converters',
    },
  },
  {
    path: '/color-converter',
    name: 'Color Converter',
    component: () => import('@/views/converters/ColorConverterView.vue'),
    meta: {
      title: 'Color Converter',
      menu: true,
      icon: 'pi pi-palette',
      category: 'converters',
    },
  },
  {
    path: '/timestamp-converter',
    name: 'Timestamp Converter',
    component: () => import('@/views/converters/TimestampConverterView.vue'),
    meta: {
      title: 'Timestamp Converter',
      menu: true,
      icon: 'pi pi-clock',
      category: 'converters',
    },
  },
  {
    path: '/string-case',
    name: 'String Case Converter',
    component: () => import('@/views/converters/StringCaseConverterView.vue'),
    meta: {
      title: 'String Case Converter',
      menu: true,
      icon: 'pi pi-sort-alpha-down',
      category: 'converters',
    },
  },

  // ============================================
  // Testing & Validation
  // ============================================
  {
    path: '/regex-tester',
    name: 'Regex Tester',
    component: () => import('@/views/testing/RegexTesterView.vue'),
    meta: {
      title: 'Regex Tester',
      menu: true,
      icon: 'pi pi-search',
      category: 'testing',
    },
  },
] as const
