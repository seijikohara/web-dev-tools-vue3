import type { CodeGenerator, SwiftOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultSwiftOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useStruct: true,
  useCodingKeys: true,
  useOptionalProperties: false,
} as const satisfies SwiftOptions

const swiftType = (typeInfo: TypeInfo): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `[${swiftType(typeInfo.arrayItemType)}]`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'String',
    number: 'Double',
    boolean: 'Bool',
    null: 'Any',
  } as const

  return primitiveTypeMap[typeInfo.name as keyof typeof primitiveTypeMap] ?? 'Any'
}

// Build Swift property type with optional suffix
const buildSwiftPropType = (childType: TypeInfo, options: SwiftOptions): string => {
  const baseType = swiftType(childType)
  return options.optionalProperties || options.useOptionalProperties ? `${baseType}?` : baseType
}

// Generate coding key entry
const generateCodingKey = (key: string, propName: string): string =>
  propName !== key ? `        case ${propName} = "${key}"` : `        case ${propName}`

const buildPropertyDefinition = (key: string, childType: TypeInfo, options: SwiftOptions): string => {
  const propName = toCamelCase(key)
  const propType = buildSwiftPropType(childType, options)
  return `    let ${propName}: ${propType}`
}

const buildCodingKeysEnum = (entries: [string, TypeInfo][], options: SwiftOptions): string => {
  const needsCodingKeys = entries.some(([key]) => toCamelCase(key) !== key)

  if (!options.useCodingKeys || !needsCodingKeys) return ''

  const codingKeys = entries
    .map(([key]) => {
      const propName = toCamelCase(key)
      return generateCodingKey(key, propName)
    })

  return `

    enum CodingKeys: String, CodingKey {
${codingKeys.join('\n')}
    }`
}

// Generate a single Swift struct/class definition
const generateStructDefinitionSwift = (typeInfo: TypeInfo, options: SwiftOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)

  const properties = entries
    .map(([key, childType]) => buildPropertyDefinition(key, childType, options))

  const keyword = options.useStruct ? 'struct' : 'class'
  const codable = options.useStruct ? 'Codable' : 'Codable, Equatable'

  const propertiesSection = properties.join('\n')
  const codingKeysSection = buildCodingKeysEnum(entries, options)

  return `${keyword} ${typeInfo.name}: ${codable} {
${propertiesSection}${codingKeysSection}
}`
}

export const swiftGenerator = {
  generate(data: unknown, options: SwiftOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const structs = generateWithNestedTypes(rootType, typeInfo =>
      generateStructDefinitionSwift(typeInfo, options),
    )
    return structs.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): SwiftOptions {
    return { ...defaultSwiftOptions }
  },
} as const satisfies CodeGenerator<SwiftOptions>
