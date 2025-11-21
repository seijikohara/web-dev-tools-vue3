import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouterHistory } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { APP_ROUTES } from '@/constants/routes'

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
