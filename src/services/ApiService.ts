import axios from 'axios'

import type { IpInfo, HttpHeaders, HtmlEntities } from '@/types/types'

const api = axios.create({
  baseURL: `${import.meta.env.VUE_APP_API_BASE_URL}api`,
})
api.interceptors.response.use(
  response => response,
  error => Promise.reject(error),
)

export default {
  async getIpAddress(): Promise<IpInfo> {
    const response = await api.get('ip')
    return response.data as IpInfo
  },
  async getHttpHeader(): Promise<HttpHeaders> {
    const response = await api.get('http-headers')
    return response.data as HttpHeaders
  },
  async getGeo(ipAddress: string): Promise<unknown> {
    const response = await api.get(`geo/${ipAddress}`)
    return response.data
  },
  async getRdap(ipAddress: string): Promise<unknown> {
    const response = await api.get(`rdap/${ipAddress}`)
    return response.data
  },
  async getHtmlEntities(name: string, page: number, size: number): Promise<HtmlEntities> {
    const response = await api.get(`html-entities`, {
      params: {
        name,
        page,
        size,
      },
    })
    return response.data
  },
}
