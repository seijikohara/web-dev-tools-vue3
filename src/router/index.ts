import { when } from 'switch-ts'
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

const router = createRouter({
  history: when(import.meta.env.VUE_APP_HISTORY_MODE)
    .is(
      (v) => v === 'history',
      () => createWebHistory(import.meta.env.BASE_URL),
    )
    .is(
      (v) => v === 'hash',
      () => createWebHashHistory(),
    )
    .default(() => createWebHistory(import.meta.env.BASE_URL)),
  scrollBehavior: () => {
    return {
      left: 0,
      top: 0,
    }
  },
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: {
        title: 'Dashboard',
        menu: true,
      },
    },
    {
      path: '/json-formatter',
      name: 'JSON Formatter',
      component: () => import('@/views/JsonFormatterView.vue'),
      meta: {
        title: 'JSON Formatter',
        menu: true,
      },
    },
    {
      path: '/xml-formatter',
      name: 'XML Formatter',
      component: () => import('@/views/XmlFormatterView.vue'),
      meta: {
        title: 'XML Formatter',
        menu: true,
      },
    },
    {
      path: '/url-encoding',
      name: 'URL Encoding',
      component: () => import('@/views/UrlEncodingView.vue'),
      meta: {
        title: 'URL Encoding',
        menu: true,
      },
    },
    {
      path: '/hash',
      name: 'Hash',
      component: () => import('@/views/HashView.vue'),
      meta: {
        title: 'Hash',
        menu: true,
      },
    },
    {
      path: '/b-crypt-hash',
      name: 'BCrypt Hash',
      component: () => import('@/views/BCryptHashView.vue'),
      meta: {
        title: 'BCrypt Hash',
        menu: true,
      },
    },
    {
      path: '/html-entities',
      name: 'HTML Entities',
      component: () => import('@/views/HtmlEntitiesView.vue'),
      meta: {
        title: 'HTML Entities',
        menu: true,
      },
    },
    {
      path: '/json-to-typescript',
      name: 'JSON to TypeScript',
      component: () => import('@/views/JsonToTypeScriptView.vue'),
      meta: {
        title: 'JSON to TypeScript',
        menu: true,
      },
    },
    {
      path: '/markdown',
      name: 'Markdown',
      component: () => import('@/views/MarkdownView.vue'),
      meta: {
        title: 'Markdown',
        menu: true,
      },
    },
  ],
})

router.afterEach((to) => {
  const pageTitle = to.meta.title as String | undefined
  const title = 'Web Dev Tools'
  document.title = pageTitle ? `${pageTitle} - ${title}` : title
})

export default router
