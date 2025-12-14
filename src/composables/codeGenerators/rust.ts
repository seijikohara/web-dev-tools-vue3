import type { CodeGenerator, RustOptions, JsonValue, TypeInfo } from './types'
import { inferType, toSnakeCase, generateWithNestedTypes } from './utils'

export const defaultRustOptions = {
  rootName: 'Root',
  optionalProperties: false,
  deriveSerde: true,
  deriveDebug: true,
  deriveClone: true,
  deriveDefault: false,
  useBox: false,
} as const satisfies RustOptions

const rustType = (typeInfo: TypeInfo, options: RustOptions): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `Vec<${rustType(typeInfo.arrayItemType, options)}>`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return options.useBox ? `Box<${typeInfo.name}>` : typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'String',
    number: 'f64',
    boolean: 'bool',
    null: 'Option<()>',
  } as const

  return (primitiveTypeMap as Record<string, string>)[typeInfo.name] ?? 'serde_json::Value'
}

// Build derive attributes array based on options
const buildDerives = (options: RustOptions): string[] => {
  const derives = [
    options.deriveSerde && ['Serialize', 'Deserialize'],
    options.deriveDebug && 'Debug',
    options.deriveClone && 'Clone',
    options.deriveDefault && 'Default',
  ]
    .filter(Boolean)
    .flat() as string[]

  return derives
}

const buildFieldAttributes = (key: string, fieldName: string, options: RustOptions): string[] => {
  if (!options.deriveSerde) return []

  const attributes = [
    fieldName !== key && `    #[serde(rename = "${key}")]`,
    options.optionalProperties && `    #[serde(skip_serializing_if = "Option::is_none")]`,
  ].filter(Boolean) as string[]

  return attributes
}

const buildFieldDefinition = (key: string, childType: TypeInfo, options: RustOptions): string => {
  const fieldName = toSnakeCase(key)
  const baseType = rustType(childType, options)
  const fieldType = options.optionalProperties ? `Option<${baseType}>` : baseType

  const attributes = buildFieldAttributes(key, fieldName, options)
  const attributeStr = attributes.length > 0 ? `${attributes.join('\n')}\n` : ''

  return `${attributeStr}    pub ${fieldName}: ${fieldType},`
}

// Generate a single Rust struct definition
const generateStructDefinition = (
  typeInfo: TypeInfo,
  options: RustOptions,
  derives: string[],
): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildFieldDefinition(key, childType, options),
  )

  const deriveAttr =
    derives.length > 0
      ? `#[derive(${derives.join(', ')})]
`
      : ''
  return `${deriveAttr}pub struct ${typeInfo.name} {
${fields.join('\n')}
}`
}

export const rustGenerator = {
  generate(data: unknown, options: RustOptions): string {
    const derives = buildDerives(options)
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateStructDefinition(typeInfo, options, derives),
    )

    const imports = options.deriveSerde
      ? `use serde::{Deserialize, Serialize};

`
      : ''
    return imports + definitions.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): RustOptions {
    return { ...defaultRustOptions }
  },
} as const satisfies CodeGenerator<RustOptions>
