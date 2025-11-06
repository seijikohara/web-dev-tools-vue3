import { ref, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { searchHtmlEntities } from '@/api'
import type { HtmlEntity } from '@/types/api/html-entities'

interface UseHtmlEntitiesReturn {
  entities: Ref<HtmlEntity[]>
  totalRecords: Ref<number>
  loading: Ref<boolean>
  error: Ref<string | null>
  search: (searchWord: string, page: number, size: number) => Promise<void>
  debouncedSearch: (searchWord: string, page: number, size: number) => void
}

/**
 * Composable for HTML entities search with debounce
 */
export function useHtmlEntities(): UseHtmlEntitiesReturn {
  const entities = ref<HtmlEntity[]>([])
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
      error.value = e instanceof Error ? e.message : 'Search failed'
      console.error('HTML entities search error:', e)
    } finally {
      loading.value = false
    }
  }

  // Debounce search input (500ms delay)
  const debouncedSearch = useDebounceFn(search, 500)

  return {
    entities,
    totalRecords,
    loading,
    error,
    search,
    debouncedSearch,
  }
}
