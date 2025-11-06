// Re-export all API functions
export * from './endpoints/ip'
export * from './endpoints/geo'
export * from './endpoints/html-entities'
export { apiClient, ApiError } from './client'

// Backward compatibility: export as default object
import { getIpAddress, getHttpHeaders } from './endpoints/ip'
import { getGeoInfo, getRdapInfo } from './endpoints/geo'
import { searchHtmlEntities } from './endpoints/html-entities'

/**
 * @deprecated Use named imports instead
 * Legacy API service object for backward compatibility
 */
export default {
  getIpAddress,
  getHttpHeader: getHttpHeaders, // Note: renamed for consistency
  getGeo: getGeoInfo,
  getRdap: getRdapInfo,
  getHtmlEntities: searchHtmlEntities,
}
