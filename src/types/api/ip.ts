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
