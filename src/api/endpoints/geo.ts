import { apiClient } from '../client'
import type { GeoInfo, RdapInfo } from '@/types/api/geo'

/**
 * Fetch geo location information for IP address
 */
export const getGeoInfo = async (ipAddress: string): Promise<GeoInfo> => {
  const { data } = await apiClient.get<GeoInfo>(`geo/${ipAddress}`)
  return data
}

/**
 * Fetch RDAP information for IP address
 */
export const getRdapInfo = async (ipAddress: string): Promise<RdapInfo> => {
  const { data } = await apiClient.get<RdapInfo>(`rdap/${ipAddress}`)
  return data
}
