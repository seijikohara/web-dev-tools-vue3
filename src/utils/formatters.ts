/**
 * Format JSON string with proper indentation
 */
export const formatJson = (input: string, indent: number | string = 2): string => {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed, null, indent)
}

/**
 * Minify JSON string
 */
export const minifyJson = (input: string): string => {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed)
}

/**
 * Format XML string with proper indentation
 */
export const formatXml = (input: string): string => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(input, 'text/xml')
  const serializer = new XMLSerializer()

  return serializer
    .serializeToString(xmlDoc)
    .replace(/></g, '>\n<')
}

/**
 * Encode URL string
 */
export const encodeUrl = (input: string): string => {
  return encodeURIComponent(input)
}

/**
 * Decode URL string
 */
export const decodeUrl = (input: string): string => {
  return decodeURIComponent(input)
}

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
