import type { JsonValue, TypeInfo } from './types'

// Case conversion utilities
export const toPascalCase = (str: string): string =>
  str
    .replace(/[-_](.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^(.)/, (_, char: string) => char.toUpperCase())

export const toCamelCase = (str: string): string =>
  str
    .replace(/[-_](.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^(.)/, (_, char: string) => char.toLowerCase())

export const toSnakeCase = (str: string): string =>
  str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[-]/g, '_')

export const toKebabCase = (str: string): string =>
  str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/[_]/g, '-')

export const toUpperSnakeCase = (str: string): string => toSnakeCase(str).toUpperCase()

// Type inference from JSON value
export const inferType = (value: JsonValue, name: string): TypeInfo => {
  // Early return for null
  if (value === null) {
    return { name: 'null', isArray: false, isObject: false, isPrimitive: true }
  }

  // Early return for arrays
  if (Array.isArray(value)) {
    const firstItem = value[0]
    const arrayItemType =
      value.length > 0 && firstItem !== undefined
        ? inferType(firstItem, `${name}Item`)
        : ({ name: 'any', isArray: false, isObject: false, isPrimitive: true } as const)

    return {
      name,
      isArray: true,
      isObject: false,
      isPrimitive: false,
      arrayItemType,
    }
  }

  // Early return for objects
  if (typeof value === 'object') {
    const children = Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, inferType(val, toPascalCase(key))]),
    )

    return {
      name,
      isArray: false,
      isObject: true,
      isPrimitive: false,
      children,
    }
  }

  // Primitives
  return { name: typeof value, isArray: false, isObject: false, isPrimitive: true }
}

// Check if a string is a valid identifier
export const isValidIdentifier = (str: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)

// Escape string for use in code
export const escapeString = (str: string): string =>
  str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')

// Generate indentation string
export const indent = (level: number, size = 4, char = ' '): string => char.repeat(level * size)

// Collect nested types from a single TypeInfo's children
const collectChildTypes = (info: TypeInfo): TypeInfo[] => {
  // Early return for non-objects
  if (!info.isObject || !info.children) return []

  return Object.values(info.children).flatMap(childType => {
    // Object type with nested children
    if (childType.isObject) {
      return [...collectChildTypes(childType), childType]
    }

    // Array with object items
    if (childType.isArray && childType.arrayItemType?.isObject) {
      const itemType = childType.arrayItemType
      return [...collectChildTypes(itemType), itemType]
    }

    // Primitive types
    return []
  })
}

// Collect all nested object types from a TypeInfo tree (depth-first, children before parents)
export const collectNestedTypes = (typeInfo: TypeInfo): TypeInfo[] => collectChildTypes(typeInfo)

// Remove duplicates from array by key extractor (keeps first occurrence)
const uniqueBy = <T>(items: T[], keyFn: (item: T) => string): T[] => {
  const { result } = items.reduce<{ seen: Set<string>; result: T[] }>(
    (acc, item) => {
      const key = keyFn(item)

      // Early return if already seen
      if (acc.seen.has(key)) return acc

      // Add to set and result
      return {
        seen: acc.seen.add(key),
        result: [...acc.result, item],
      }
    },
    { seen: new Set(), result: [] },
  )

  return result
}

// Generate code for a type and all its nested types
export const generateWithNestedTypes = <T>(
  rootType: TypeInfo,
  generateSingle: (typeInfo: TypeInfo) => T,
): T[] => uniqueBy([...collectNestedTypes(rootType), rootType], t => t.name).map(generateSingle)
