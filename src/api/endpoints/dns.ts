import { apiClient } from '../client'

/**
 * DNS record types supported by Google DNS-over-HTTPS
 */
export type DnsRecordType =
  | 'A'
  | 'NS'
  | 'CNAME'
  | 'SOA'
  | 'PTR'
  | 'MX'
  | 'TXT'
  | 'AAAA'
  | 'SRV'
  | 'DS'
  | 'RRSIG'
  | 'NSEC'
  | 'DNSKEY'
  | 'TLSA'
  | 'HTTPS'
  | 'ANY'

/**
 * DNS question from the response
 */
export interface DnsQuestion {
  name: string
  type: number
}

/**
 * DNS record from the response
 */
export interface DnsRecord {
  name: string
  type: number
  ttl: number
  data: string
}

/**
 * DNS resolution response from backend API
 */
export interface DnsResolution {
  status: number
  truncated: boolean
  recursionDesired: boolean
  recursionAvailable: boolean
  authenticData: boolean
  checkingDisabled: boolean
  question: DnsQuestion[]
  answer: DnsRecord[] | null
  authority: DnsRecord[] | null
  additional: DnsRecord[] | null
  comment?: string
  ednsClientSubnet?: string
}

/**
 * Resolve DNS records for a hostname using backend API
 */
export const resolveDns = async (
  hostname: string,
  type: DnsRecordType = 'A',
): Promise<DnsResolution> => {
  const { data } = await apiClient.get<DnsResolution>(`dns/resolve/${hostname}`, {
    params: { type },
  })
  return data
}
