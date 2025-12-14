import type { CodeGenerator, TypeScriptOptions, JsonValue, TypeInfo } from './types'
import { inferType, generateWithNestedTypes } from './utils'

export const defaultTypeScriptOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useInterface: true,
  useExport: true,
  useReadonly: false,
  strictNullChecks: true,
} as const satisfies TypeScriptOptions

const tsType = (typeInfo: TypeInfo, options: TypeScriptOptions): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `${tsType(typeInfo.arrayItemType, options)}[]`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    null: options.strictNullChecks ? 'null' : 'any',
  } as const

  return primitiveTypeMap[typeInfo.name as keyof typeof primitiveTypeMap] ?? 'unknown'
}

const buildPropertyType = (childType: TypeInfo, options: TypeScriptOptions): string => {
  const baseType = tsType(childType, options)
  return options.optionalProperties && options.strictNullChecks
    ? `${baseType} | undefined`
    : baseType
}

const buildPropertyName = (key: string): string =>
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`

const buildPropertySignature = (
  key: string,
  childType: TypeInfo,
  options: TypeScriptOptions,
): string => {
  const propType = buildPropertyType(childType, options)
  const readonly = options.useReadonly ? 'readonly ' : ''
  const optional = options.optionalProperties ? '?' : ''
  const displayName = buildPropertyName(key)

  return `  ${readonly}${displayName}${optional}: ${propType};`
}

// Generate a single TypeScript type/interface definition
const generateTypeDefinition = (typeInfo: TypeInfo, options: TypeScriptOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const properties = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildPropertySignature(key, childType, options),
  )

  const keyword = options.useInterface ? 'interface' : 'type'
  const exportKeyword = options.useExport ? 'export ' : ''
  const assignment = options.useInterface ? '' : ' ='

  return `${exportKeyword}${keyword} ${typeInfo.name}${assignment} {
${properties.join('\n')}
}`
}

export const typeScriptGenerator = {
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
} as const satisfies CodeGenerator<TypeScriptOptions>
