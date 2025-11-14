/**
 * Geographic location information
 */
export interface GeoInfo {
  ipAddress: string
  countryCode: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

/**
 * RDAP information
 */
export interface RdapInfo {
  ipAddress: string
  handle: string | null
  name: string | null
  country: string | null
  registeredAt: string | null
}
