export const formatJson = (input: string, indent: number | string = 2): string =>
  JSON.stringify(JSON.parse(input), null, indent)

export const minifyJson = (input: string): string => JSON.stringify(JSON.parse(input))

export const formatXml = (input: string): string => {
  const xmlDoc = new DOMParser().parseFromString(input, 'text/xml')
  const serialized = new XMLSerializer().serializeToString(xmlDoc)
  return serialized.replace(/></g, '>\n<')
}

export const encodeUrl = (input: string): string => encodeURIComponent(input)

export const decodeUrl = (input: string): string => decodeURIComponent(input)

const BYTE_SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const
const BYTE_BASE = 1024 as const

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const dm = Math.max(0, decimals)
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTE_BASE)), BYTE_SIZES.length - 1)
  const value = bytes / Math.pow(BYTE_BASE, i)

  return `${parseFloat(value.toFixed(dm))} ${BYTE_SIZES[i]!}`
}
