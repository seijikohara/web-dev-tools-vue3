/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VUE_APP_API_BASE_URL: string
  readonly VUE_APP_HISTORY_MODE: string
  readonly VUE_APP_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
