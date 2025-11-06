import { apiClient } from '../client'
import type { IpInfo, HttpHeaders } from '@/types/api/ip'

/**
 * Fetch client IP address information
 */
export async function getIpAddress(): Promise<IpInfo> {
  const { data } = await apiClient.get<IpInfo>('ip')
  return data
}

/**
 * Fetch client HTTP headers
 */
export async function getHttpHeaders(): Promise<HttpHeaders> {
  const { data } = await apiClient.get<HttpHeaders>('http-headers')
  return data
}
