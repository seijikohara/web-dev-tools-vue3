import type { CodeGenerator, GoOptions, JsonValue, TypeInfo } from './types'
import { inferType, toPascalCase, generateWithNestedTypes } from './utils'

export const defaultGoOptions: GoOptions = {
  rootName: 'Root',
  optionalProperties: false,
  usePointers: false,
  omitEmpty: true,
  useJsonTag: true,
}

const goType = (typeInfo: TypeInfo, options: GoOptions): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    const itemType = goType(typeInfo.arrayItemType, options)
    return `[]${itemType}`
  }
  if (typeInfo.isObject) {
    return options.usePointers ? `*${typeInfo.name}` : typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'string'
    case 'number':
      return 'float64'
    case 'boolean':
      return 'bool'
    case 'null':
      return 'interface{}'
    default:
      return 'interface{}'
  }
}

// Generate a single Go struct definition
const generateStructDefinition = (typeInfo: TypeInfo, options: GoOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const buildJsonTag = (key: string): string => {
    if (!options.useJsonTag) return ''
    const tagValue = options.omitEmpty ? `${key},omitempty` : key
    return ` \`json:"${tagValue}"\``
  }

  const fields = Object.entries(typeInfo.children).map(([key, childType]) => {
    const fieldName = toPascalCase(key)
    const fieldType = goType(childType, options)
    const jsonTag = buildJsonTag(key)
    return `\t${fieldName} ${fieldType}${jsonTag}`
  })

  return `type ${typeInfo.name} struct {\n${fields.join('\n')}\n}`
}

export const goGenerator: CodeGenerator<GoOptions> = {
  generate(data: unknown, options: GoOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateStructDefinition(typeInfo, options),
    )
    return definitions.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): GoOptions {
    return { ...defaultGoOptions }
  },
}
