import { apiClient } from '../client'
import type { HtmlEntities } from '@/types/api/html-entities'

/**
 * Search HTML entities with pagination
 */
export async function searchHtmlEntities(
  name: string,
  page: number,
  size: number,
): Promise<HtmlEntities> {
  const { data } = await apiClient.get<HtmlEntities>('html-entities', {
    params: { name, page, size },
  })
  return data
}
