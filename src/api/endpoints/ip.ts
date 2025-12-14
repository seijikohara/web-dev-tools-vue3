import { apiClient } from '../client'

/**
 * IP address information from API
 */
export interface IpInfo {
  ipAddress: string
  hostName: string
}

/**
 * HTTP header key-value pair
 */
export interface HttpHeader {
  name: string
  value: string
}

/**
 * HTTP headers response
 */
export interface HttpHeaders {
  headers: HttpHeader[]
}

/**
 * Fetch client IP address information
 */
export const getIpAddress = async (): Promise<IpInfo> =>
  apiClient.get<IpInfo>('ip').then(({ data }) => data)

/**
 * Fetch client HTTP headers
 */
export const getHttpHeaders = async (): Promise<HttpHeaders> =>
  apiClient.get<HttpHeaders>('http-headers').then(({ data }) => data)
