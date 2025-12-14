import type { CodeGenerator, GoOptions, JsonValue, TypeInfo } from './types'
import { inferType, toPascalCase, generateWithNestedTypes } from './utils'

export const defaultGoOptions = {
  rootName: 'Root',
  optionalProperties: false,
  usePointers: false,
  omitEmpty: true,
  useJsonTag: true,
} as const satisfies GoOptions

const goType = (typeInfo: TypeInfo, options: GoOptions): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    const itemType = goType(typeInfo.arrayItemType, options)
    return `[]${itemType}`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return options.usePointers ? `*${typeInfo.name}` : typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'string',
    number: 'float64',
    boolean: 'bool',
    null: 'interface{}',
  } as const

  return (primitiveTypeMap as Record<string, string>)[typeInfo.name] ?? 'interface{}'
}

const buildJsonTag = (key: string, options: GoOptions): string => {
  if (!options.useJsonTag) return ''

  const tagValue = options.omitEmpty ? `${key},omitempty` : key
  return ` \`json:"${tagValue}"\``
}

const buildFieldDefinition = (key: string, childType: TypeInfo, options: GoOptions): string => {
  const fieldName = toPascalCase(key)
  const fieldType = goType(childType, options)
  const jsonTag = buildJsonTag(key, options)
  return `\t${fieldName} ${fieldType}${jsonTag}`
}

// Generate a single Go struct definition
const generateStructDefinition = (typeInfo: TypeInfo, options: GoOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildFieldDefinition(key, childType, options),
  )

  return `type ${typeInfo.name} struct {
${fields.join('\n')}
}`
}

export const goGenerator = {
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
} as const satisfies CodeGenerator<GoOptions>
