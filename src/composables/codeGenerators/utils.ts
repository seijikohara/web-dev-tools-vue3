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
  if (value === null) {
    return { name: 'null', isArray: false, isObject: false, isPrimitive: true }
  }

  if (Array.isArray(value)) {
    const [firstItem] = value
    return {
      name: name,
      isArray: true,
      isObject: false,
      isPrimitive: false,
      arrayItemType:
        value.length > 0 && firstItem !== undefined
          ? inferType(firstItem, `${name}Item`)
          : { name: 'any', isArray: false, isObject: false, isPrimitive: true },
    }
  }

  if (typeof value === 'object') {
    return {
      name: name,
      isArray: false,
      isObject: true,
      isPrimitive: false,
      children: Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, inferType(val, toPascalCase(key))]),
      ),
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
  if (!info.isObject || !info.children) return []

  return Object.values(info.children).flatMap(childType => {
    if (childType.isObject) {
      return [...collectChildTypes(childType), childType]
    }
    if (childType.isArray && childType.arrayItemType?.isObject) {
      return [...collectChildTypes(childType.arrayItemType), childType.arrayItemType]
    }
    return []
  })
}

// Collect all nested object types from a TypeInfo tree (depth-first, children before parents)
export const collectNestedTypes = (typeInfo: TypeInfo): TypeInfo[] => collectChildTypes(typeInfo)

// Remove duplicates from array by key extractor (keeps first occurrence)
const uniqueBy = <T>(items: T[], keyFn: (item: T) => string): T[] =>
  items.reduce<{ seen: Set<string>; result: T[] }>(
    (acc, item) => {
      const key = keyFn(item)
      return acc.seen.has(key) ? acc : { seen: acc.seen.add(key), result: [...acc.result, item] }
    },
    { seen: new Set(), result: [] },
  ).result

// Generate code for a type and all its nested types
export const generateWithNestedTypes = <T>(
  rootType: TypeInfo,
  generateSingle: (typeInfo: TypeInfo) => T,
): T[] => uniqueBy([...collectNestedTypes(rootType), rootType], t => t.name).map(generateSingle)
