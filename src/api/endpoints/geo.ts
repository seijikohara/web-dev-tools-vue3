import { apiClient } from '../client'

/**
 * Geographic location information from ipapi.co
 */
export interface GeoInfo {
  ip: string
  version?: string
  city?: string
  region?: string
  regionCode?: string
  countryCode?: string
  countryCodeIso3?: string
  countryName?: string
  countryCapital?: string
  countryTld?: string
  continentCode?: string
  inEu?: boolean
  postal?: string
  latitude?: number
  longitude?: number
  timezone?: string
  utcOffset?: string
  countryCallingCode?: string
  currency?: string
  currencyName?: string
  languages?: string
  countryArea?: number
  countryPopulation?: number
  asn?: string
  org?: string
  hostname?: string
  network?: string
  error?: boolean
  reason?: string
  reserved?: boolean
}

/**
 * RDAP link information
 */
export interface RdapLink {
  value?: string
  rel?: string
  href?: string
  hreflang?: string[]
  title?: string
  media?: string
  type?: string
}

/**
 * RDAP event information
 */
export interface RdapEvent {
  eventAction?: string
  eventActor?: string
  eventDate?: string
  links?: RdapLink[]
}

/**
 * RDAP remark
 */
export interface RdapRemark {
  title?: string
  type?: string
  description?: string[]
  links?: RdapLink[]
}

/**
 * RDAP notice
 */
export interface RdapNotice {
  title?: string
  type?: string
  description?: string[]
  links?: RdapLink[]
}

/**
 * RDAP public ID
 */
export interface RdapPublicId {
  type?: string
  identifier?: string
}

/**
 * RDAP entity information
 */
export interface RdapEntity {
  objectClassName?: string
  handle?: string
  vcardArray?: unknown
  roles?: string[]
  publicIds?: RdapPublicId[]
  remarks?: RdapRemark[]
  links?: RdapLink[]
  events?: RdapEvent[]
  asEventActor?: RdapEvent[]
  status?: string[]
  port43?: string
  lang?: string
}

/**
 * RDAP CIDR information
 */
export interface RdapCidr {
  v4prefix?: string
  v6prefix?: string
  length?: number
}

/**
 * RDAP information (RFC 9083 compliant)
 */
export interface RdapInfo {
  objectClassName?: string
  handle?: string
  startAddress?: string
  endAddress?: string
  ipVersion?: string
  name?: string
  type?: string
  country?: string
  parentHandle?: string
  status?: string[]
  entities?: RdapEntity[]
  remarks?: RdapRemark[]
  links?: RdapLink[]
  events?: RdapEvent[]
  port43?: string
  rdapConformance?: string[]
  notices?: RdapNotice[]
  lang?: string
  cidr0Cidrs?: RdapCidr[]
  originAutnums?: number[]
}

/**
 * Fetch geo location information for IP address
 */
export const getGeoInfo = async (ipAddress: string): Promise<GeoInfo> =>
  apiClient.get<GeoInfo>(`geo/${ipAddress}`).then(({ data }) => data)

/**
 * Fetch RDAP information for IP address
 */
export const getRdapInfo = async (ipAddress: string): Promise<RdapInfo> =>
  apiClient.get<RdapInfo>(`rdap/${ipAddress}`).then(({ data }) => data)
