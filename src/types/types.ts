export interface IpInfo {
  ipAddress: string
  hostName: string
}

export interface HttpHeader {
  name: string
  value: string
}

export interface HttpHeaders {
  headers: HttpHeader[]
}

export interface HtmlEntity {
  name: string
  code: number
  code2: number | null
  standard: string | null
  dtd: string | null
  description: string | null
  entityReference: string
}

export interface HtmlEntities {
  content: HtmlEntity[]
  pageable?: Pageable
  last: boolean
  totalPages: number
  totalElements: number
  numberOfElements: number
  sort?: Sort
  first: boolean
  number: number
  size: number
  empty: boolean
}

export interface Pageable {
  sort: Sort
  offset: number
  pageNumber: number
  pageSize: number
  paged: boolean
  unpaged: boolean
}

export interface Sort {
  sorted: boolean
  unsorted: boolean
  empty: boolean
}
