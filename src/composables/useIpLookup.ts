import { ref, computed } from 'vue'
import { getGeoInfo, getRdapInfo, resolveDns } from '@/api'
import type { GeoInfo, RdapInfo } from '@/api/endpoints/geo'
import type { DnsResolution, DnsRecordType } from '@/api/endpoints/dns'

// Types
export interface ResolvedIps {
  ipv4: string[]
  ipv6: string[]
}

export type InputType = 'ipv4' | 'ipv6' | 'hostname' | 'invalid' | null

export interface DnsTypeOption {
  label: string
  value: DnsRecordType
  description: string
}

interface TableDataRow {
  label: string
  value: string
}

// Constants
export const DNS_TYPE_OPTIONS: DnsTypeOption[] = [
  { label: 'A', value: 'A', description: 'IPv4 Address' },
  { label: 'AAAA', value: 'AAAA', description: 'IPv6 Address' },
  { label: 'NS', value: 'NS', description: 'Name Server' },
  { label: 'MX', value: 'MX', description: 'Mail Exchange' },
  { label: 'TXT', value: 'TXT', description: 'Text Record' },
  { label: 'CNAME', value: 'CNAME', description: 'Canonical Name' },
  { label: 'SOA', value: 'SOA', description: 'Start of Authority' },
  { label: 'PTR', value: 'PTR', description: 'Pointer (Reverse DNS)' },
  { label: 'SRV', value: 'SRV', description: 'Service' },
] as const

export const DNS_TYPE_MAP: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  43: 'DS',
  46: 'RRSIG',
  47: 'NSEC',
  48: 'DNSKEY',
  52: 'TLSA',
  65: 'HTTPS',
} as const

export const SAMPLE_LOOKUPS = [
  { label: 'Google DNS', value: '8.8.8.8' },
  { label: 'Cloudflare', value: '1.1.1.1' },
  { label: 'Google.com', value: 'google.com' },
  { label: 'GitHub.com', value: 'github.com' },
] as const

// Pure validation functions
export const isValidIpv4 = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipv4Regex.test(ip)) return false

  return ip
    .split('.')
    .map(part => parseInt(part, 10))
    .every(num => num >= 0 && num <= 255)
}

export const isValidIpv6 = (ip: string): boolean => {
  const ipv6Regex =
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/
  return ipv6Regex.test(ip)
}

export const isValidHostname = (hostname: string): boolean => {
  const hostnameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return hostnameRegex.test(hostname) && hostname.includes('.')
}

export const getInputType = (input: string): InputType => {
  const trimmed = input.trim()

  if (!trimmed) return null
  if (isValidIpv4(trimmed)) return 'ipv4'
  if (isValidIpv6(trimmed)) return 'ipv6'
  if (isValidHostname(trimmed)) return 'hostname'

  return 'invalid'
}

// Expand IPv6 address to full format
export const expandIpv6 = (ip: string): string => {
  if (!ip.includes('::')) {
    return ip
      .split(':')
      .map(part => part.padStart(4, '0'))
      .join(':')
  }

  const [leftPart = '', rightPart = ''] = ip.split('::')
  const left = leftPart ? leftPart.split(':') : []
  const right = rightPart ? rightPart.split(':') : []
  const missingCount = 8 - left.length - right.length

  return [...left, ...Array<string>(missingCount).fill('0000'), ...right]
    .map(part => part.padStart(4, '0'))
    .join(':')
}

// Convert IP to reverse DNS format for PTR lookup
export const ipToReverseDns = (ip: string): string => {
  if (isValidIpv4(ip)) {
    return `${ip.split('.').reverse().join('.')}.in-addr.arpa`
  }

  if (isValidIpv6(ip)) {
    return `${expandIpv6(ip).replace(/:/g, '').split('').reverse().join('.')}.ip6.arpa`
  }

  return ip
}

// Build GEO table data from GeoInfo
export const buildGeoTableData = (geo: GeoInfo): TableDataRow[] => {
  const entries: { condition: boolean; label: string; value: string }[] = [
    { condition: !!geo.ip, label: 'IP Address', value: geo.ip },
    { condition: !!geo.hostname, label: 'Hostname', value: geo.hostname ?? '' },
    {
      condition: !!(geo.countryName ?? geo.countryCode),
      label: 'Country',
      value: geo.countryName ?? geo.countryCode ?? '',
    },
    { condition: !!geo.region, label: 'Region', value: geo.region ?? '' },
    { condition: !!geo.city, label: 'City', value: geo.city ?? '' },
    { condition: !!geo.postal, label: 'Postal Code', value: geo.postal ?? '' },
    {
      condition: geo.latitude != null && geo.longitude != null,
      label: 'Coordinates',
      value: `${geo.latitude ?? ''}, ${geo.longitude ?? ''}`,
    },
    { condition: !!geo.timezone, label: 'Timezone', value: geo.timezone ?? '' },
    { condition: !!geo.asn, label: 'ASN', value: geo.asn ?? '' },
    { condition: !!geo.org, label: 'Organization', value: geo.org ?? '' },
    { condition: !!geo.network, label: 'Network', value: geo.network ?? '' },
  ]

  return entries.filter(entry => entry.condition).map(({ label, value }) => ({ label, value }))
}

// Build RDAP basic info from RdapInfo
export const buildRdapBasicInfo = (rdap: RdapInfo): TableDataRow[] => {
  const registrationEvent = rdap.events?.find(e => e.eventAction === 'registration')
  const lastChangedEvent = rdap.events?.find(e => e.eventAction === 'last changed')

  const entries: { condition: boolean; label: string; value: string }[] = [
    { condition: !!rdap.handle, label: 'Handle', value: rdap.handle ?? '' },
    { condition: !!rdap.name, label: 'Network Name', value: rdap.name ?? '' },
    { condition: !!rdap.type, label: 'Type', value: rdap.type ?? '' },
    {
      condition: !!(rdap.startAddress && rdap.endAddress),
      label: 'IP Range',
      value: `${rdap.startAddress ?? ''} - ${rdap.endAddress ?? ''}`,
    },
    { condition: !!rdap.ipVersion, label: 'IP Version', value: rdap.ipVersion ?? '' },
    { condition: !!rdap.country, label: 'Country', value: rdap.country ?? '' },
    { condition: !!rdap.parentHandle, label: 'Parent Handle', value: rdap.parentHandle ?? '' },
    {
      condition: !!(rdap.status && rdap.status.length > 0),
      label: 'Status',
      value: rdap.status?.join(', ') ?? '',
    },
    {
      condition: !!registrationEvent?.eventDate,
      label: 'Registered',
      value: registrationEvent?.eventDate
        ? new Date(registrationEvent.eventDate).toLocaleString()
        : '',
    },
    {
      condition: !!lastChangedEvent?.eventDate,
      label: 'Last Changed',
      value: lastChangedEvent?.eventDate
        ? new Date(lastChangedEvent.eventDate).toLocaleString()
        : '',
    },
  ]

  return entries.filter(entry => entry.condition).map(({ label, value }) => ({ label, value }))
}

// Composable
export const useIpLookup = () => {
  // State
  const input = ref('')
  const isLoading = ref(false)
  const error = ref('')
  const resolvedIps = ref<ResolvedIps>({ ipv4: [], ipv6: [] })
  const isDnsResolved = ref(false)

  // API Response Data
  const geoData = ref<GeoInfo | null>(null)
  const rdapData = ref<RdapInfo | null>(null)
  const dnsData = ref<DnsResolution | null>(null)
  const ptrData = ref<DnsResolution | null>(null)

  // DNS tab state
  const selectedDnsType = ref<DnsRecordType>('A')
  const isDnsLoading = ref(false)
  const dnsError = ref('')

  // Computed
  const inputType = computed(() => getInputType(input.value))

  const geoTableData = computed(() => (geoData.value ? buildGeoTableData(geoData.value) : []))

  const rdapBasicInfo = computed(() => (rdapData.value ? buildRdapBasicInfo(rdapData.value) : []))

  const dnsRecordsData = computed(
    () =>
      dnsData.value?.answer?.map(record => ({
        name: record.name,
        type: DNS_TYPE_MAP[record.type] ?? record.type.toString(),
        ttl: record.ttl,
        data: record.data,
      })) ?? [],
  )

  const ptrHostname = computed(() => ptrData.value?.answer?.find(r => r.type === 12)?.data ?? null)

  const hasResults = computed(() => !!(geoData.value ?? rdapData.value ?? dnsData.value))

  // API calls
  const resolveHostnameToIps = async (hostname: string): Promise<ResolvedIps> => {
    const [ipv4Result, ipv6Result] = await Promise.allSettled([
      resolveDns(hostname, 'A'),
      resolveDns(hostname, 'AAAA'),
    ])

    return {
      ipv4:
        ipv4Result.status === 'fulfilled'
          ? (ipv4Result.value.answer?.filter(r => r.type === 1).map(r => r.data) ?? [])
          : [],
      ipv6:
        ipv6Result.status === 'fulfilled'
          ? (ipv6Result.value.answer?.filter(r => r.type === 28).map(r => r.data) ?? [])
          : [],
    }
  }

  const fetchPtrRecord = async (ip: string): Promise<void> => {
    try {
      const reverseDns = ipToReverseDns(ip)
      ptrData.value = await resolveDns(reverseDns, 'PTR')
    } catch {
      ptrData.value = null
    }
  }

  const fetchDnsRecords = async () => {
    const trimmed = input.value.trim()
    if (!trimmed) return

    isDnsLoading.value = true
    dnsError.value = ''

    try {
      const isPtrLookup = selectedDnsType.value === 'PTR'
      const isIpAddress = isValidIpv4(trimmed) || isValidIpv6(trimmed)
      const queryHost = isPtrLookup && isIpAddress ? ipToReverseDns(trimmed) : trimmed

      dnsData.value = await resolveDns(queryHost, selectedDnsType.value)
    } catch (e) {
      dnsError.value = e instanceof Error ? e.message : 'DNS lookup failed'
      dnsData.value = null
    } finally {
      isDnsLoading.value = false
    }
  }

  const lookup = async () => {
    const trimmed = input.value.trim()
    if (!trimmed) return

    // Reset state
    error.value = ''
    geoData.value = null
    rdapData.value = null
    dnsData.value = null
    ptrData.value = null
    resolvedIps.value = { ipv4: [], ipv6: [] }
    isDnsResolved.value = false
    isLoading.value = true

    try {
      const ipToLookup = await (async (): Promise<string> => {
        if (inputType.value !== 'hostname') {
          return trimmed
        }

        const ips = await resolveHostnameToIps(trimmed)
        resolvedIps.value = ips
        isDnsResolved.value = true

        const resolvedIp = ips.ipv4[0] ?? ips.ipv6[0]
        if (!resolvedIp) {
          throw new Error('No IP address found for hostname')
        }

        dnsData.value = await resolveDns(trimmed, selectedDnsType.value)
        return resolvedIp
      })()

      const [geoResult, rdapResult] = await Promise.allSettled([
        getGeoInfo(ipToLookup),
        getRdapInfo(ipToLookup),
      ])

      const isIpInput = inputType.value === 'ipv4' || inputType.value === 'ipv6'
      if (isIpInput) {
        await fetchPtrRecord(ipToLookup)
      }

      if (geoResult.status === 'fulfilled') {
        geoData.value = geoResult.value
      }
      if (rdapResult.status === 'fulfilled') {
        rdapData.value = rdapResult.value
      }

      const bothFailed = geoResult.status === 'rejected' && rdapResult.status === 'rejected'
      if (bothFailed) {
        throw new Error('Failed to fetch IP information')
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Lookup failed'
    } finally {
      isLoading.value = false
    }
  }

  const clearAll = () => {
    input.value = ''
    geoData.value = null
    rdapData.value = null
    dnsData.value = null
    ptrData.value = null
    resolvedIps.value = { ipv4: [], ipv6: [] }
    isDnsResolved.value = false
    error.value = ''
    dnsError.value = ''
  }

  const loadSample = (sample: string) => {
    input.value = sample
  }

  return {
    // State
    input,
    isLoading,
    error,
    resolvedIps,
    isDnsResolved,

    // API data
    geoData,
    rdapData,
    dnsData,
    ptrData,

    // DNS state
    selectedDnsType,
    isDnsLoading,
    dnsError,

    // Computed
    inputType,
    geoTableData,
    rdapBasicInfo,
    dnsRecordsData,
    ptrHostname,
    hasResults,

    // Actions
    lookup,
    fetchDnsRecords,
    clearAll,
    loadSample,
  }
}
