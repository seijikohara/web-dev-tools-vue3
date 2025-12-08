import type { CodeGenerator, TypeScriptOptions, JsonValue, TypeInfo } from './types'
import { inferType, generateWithNestedTypes } from './utils'

export const defaultTypeScriptOptions: TypeScriptOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useInterface: true,
  useExport: true,
  useReadonly: false,
  strictNullChecks: true,
}

const tsType = (typeInfo: TypeInfo, options: TypeScriptOptions): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `${tsType(typeInfo.arrayItemType, options)}[]`
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return options.strictNullChecks ? 'null' : 'any'
    default:
      return 'unknown'
  }
}

// Generate a single TypeScript type/interface definition
const generateTypeDefinition = (typeInfo: TypeInfo, options: TypeScriptOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const properties = Object.entries(typeInfo.children).map(([key, childType]) => {
    const baseType = tsType(childType, options)
    const propType =
      options.optionalProperties && options.strictNullChecks ? `${baseType} | undefined` : baseType

    const readonly = options.useReadonly ? 'readonly ' : ''
    const optional = options.optionalProperties ? '?' : ''

    // Use original key if it contains special characters
    const displayName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`

    return `  ${readonly}${displayName}${optional}: ${propType};`
  })

  const keyword = options.useInterface ? 'interface' : 'type'
  const exportKeyword = options.useExport ? 'export ' : ''
  const assignment = options.useInterface ? '' : ' ='

  return `${exportKeyword}${keyword} ${typeInfo.name}${assignment} {\n${properties.join('\n')}\n}`
}

export const typeScriptGenerator: CodeGenerator<TypeScriptOptions> = {
  generate(data: unknown, options: TypeScriptOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateTypeDefinition(typeInfo, options),
    )
    return definitions.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): TypeScriptOptions {
    return { ...defaultTypeScriptOptions }
  },
}
