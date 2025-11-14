import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouterHistory } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { APP_ROUTES } from '@/constants/routes'

/**
 * Create router history based on environment variable
 */
const createHistory = (): RouterHistory => {
  const mode = import.meta.env.VUE_APP_HISTORY_MODE

  switch (mode) {
    case 'hash':
      return createWebHashHistory()
    case 'history':
      return createWebHistory(import.meta.env.BASE_URL)
    default:
      return createWebHistory(import.meta.env.BASE_URL)
  }
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

/**
 * Update page title on route change
 */
router.afterEach(to => {
  useTitle(to.meta.title ? `${to.meta.title} - Web Dev Tools` : 'Web Dev Tools')
})

export default router
