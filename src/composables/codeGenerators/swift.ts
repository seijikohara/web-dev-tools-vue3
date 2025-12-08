import type { CodeGenerator, SwiftOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultSwiftOptions: SwiftOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useStruct: true,
  useCodingKeys: true,
  useOptionalProperties: false,
}

const swiftType = (typeInfo: TypeInfo): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `[${swiftType(typeInfo.arrayItemType)}]`
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'String'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Bool'
    case 'null':
      return 'Any'
    default:
      return 'Any'
  }
}

// Build Swift property type with optional suffix
const buildSwiftPropType = (childType: TypeInfo, options: SwiftOptions): string => {
  const baseType = swiftType(childType)
  return options.optionalProperties || options.useOptionalProperties ? `${baseType}?` : baseType
}

// Generate coding key entry
const generateCodingKey = (key: string, propName: string): string =>
  propName !== key ? `        case ${propName} = "${key}"` : `        case ${propName}`

// Generate a single Swift struct/class definition
const generateStructDefinitionSwift = (typeInfo: TypeInfo, options: SwiftOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)

  const properties = entries.map(([key, childType]) => {
    const propName = toCamelCase(key)
    const propType = buildSwiftPropType(childType, options)
    return `    let ${propName}: ${propType}`
  })

  const codingKeys = entries.map(([key]) => {
    const propName = toCamelCase(key)
    return generateCodingKey(key, propName)
  })

  const needsCodingKeys = entries.some(([key]) => toCamelCase(key) !== key)

  const keyword = options.useStruct ? 'struct' : 'class'
  const codable = options.useStruct ? 'Codable' : 'Codable, Equatable'

  const propertiesSection = properties.join('\n')
  const codingKeysSection =
    options.useCodingKeys && needsCodingKeys
      ? `\n\n    enum CodingKeys: String, CodingKey {\n${codingKeys.join('\n')}\n    }`
      : ''

  return `${keyword} ${typeInfo.name}: ${codable} {\n${propertiesSection}${codingKeysSection}\n}`
}

export const swiftGenerator: CodeGenerator<SwiftOptions> = {
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
}
