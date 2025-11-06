/**
 * Validate JSON string
 */
export function isValidJson(input: string): boolean {
  try {
    JSON.parse(input)
    return true
  } catch {
    return false
  }
}

/**
 * Validate XML string
 */
export function isValidXml(input: string): boolean {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, 'text/xml')
    return !doc.querySelector('parsererror')
  } catch {
    return false
  }
}

/**
 * Validate URL string
 */
export function isValidUrl(input: string): boolean {
  try {
    new URL(input)
    return true
  } catch {
    return false
  }
}

/**
 * Validate email string
 */
export function isValidEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(input)
}
