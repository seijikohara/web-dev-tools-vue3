/**
 * Format JSON string with proper indentation
 */
export function formatJson(input: string, indent: number | string = 2): string {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed, null, indent)
}

/**
 * Minify JSON string
 */
export function minifyJson(input: string): string {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed)
}

/**
 * Format XML string with proper indentation
 */
export function formatXml(input: string): string {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(input, 'text/xml')
  const serializer = new XMLSerializer()
  let formatted = serializer.serializeToString(xmlDoc)

  // Simple formatting
  formatted = formatted.replace(/></g, '>\n<')

  return formatted
}

/**
 * Encode URL string
 */
export function encodeUrl(input: string): string {
  return encodeURIComponent(input)
}

/**
 * Decode URL string
 */
export function decodeUrl(input: string): string {
  return decodeURIComponent(input)
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
