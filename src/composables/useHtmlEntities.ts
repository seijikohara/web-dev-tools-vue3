import { ref, shallowRef } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { searchHtmlEntities } from '@/api'
import type { HtmlEntity } from '@/api/endpoints/html-entities'

/**
 * Default debounce delay for search input (milliseconds)
 */
const DEBOUNCE_DELAY = 500 as const

/**
 * Default error message for search failures
 */
const DEFAULT_ERROR_MESSAGE = 'Search failed' as const

/**
 * Extract error message from unknown error type
 * Pure function for error message extraction
 */
const extractErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE

/**
 * Search function type
 */
type SearchFunction = (searchWord: string, page: number, size: number) => Promise<void>

/**
 * Composable return type
 */
interface UseHtmlEntitiesReturn {
  readonly entities: ReturnType<typeof shallowRef<HtmlEntity[]>>
  readonly totalRecords: ReturnType<typeof ref<number>>
  readonly loading: ReturnType<typeof ref<boolean>>
  readonly error: ReturnType<typeof ref<string | null>>
  readonly search: SearchFunction
  readonly debouncedSearch: ReturnType<typeof useDebounceFn<SearchFunction>>
}

/**
 * Composable for HTML entities search with debounce
 */
export const useHtmlEntities = (): UseHtmlEntitiesReturn => {
  const entities = shallowRef<HtmlEntity[]>([])
  const totalRecords = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const search = async (searchWord: string, page: number, size: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result = await searchHtmlEntities(searchWord, page, size)
      entities.value = result.content
      totalRecords.value = result.totalElements
    } catch (e) {
      error.value = extractErrorMessage(e)
      console.error('HTML entities search error:', e)
    } finally {
      loading.value = false
    }
  }

  // Debounce search input
  const debouncedSearch = useDebounceFn(search, DEBOUNCE_DELAY)

  return {
    entities,
    totalRecords,
    loading,
    error,
    search,
    debouncedSearch,
  } satisfies UseHtmlEntitiesReturn
}
