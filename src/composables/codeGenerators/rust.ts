import type { CodeGenerator, RustOptions, JsonValue, TypeInfo } from './types'
import { inferType, toSnakeCase, generateWithNestedTypes } from './utils'

export const defaultRustOptions: RustOptions = {
  rootName: 'Root',
  optionalProperties: false,
  deriveSerde: true,
  deriveDebug: true,
  deriveClone: true,
  deriveDefault: false,
  useBox: false,
}

const rustType = (typeInfo: TypeInfo, options: RustOptions): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `Vec<${rustType(typeInfo.arrayItemType, options)}>`
  }
  if (typeInfo.isObject) {
    return options.useBox ? `Box<${typeInfo.name}>` : typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'String'
    case 'number':
      return 'f64'
    case 'boolean':
      return 'bool'
    case 'null':
      return 'Option<()>'
    default:
      return 'serde_json::Value'
  }
}

// Build derive attributes array based on options
const buildDerives = (options: RustOptions): string[] => {
  const derives: string[] = []
  if (options.deriveSerde) derives.push('Serialize', 'Deserialize')
  if (options.deriveDebug) derives.push('Debug')
  if (options.deriveClone) derives.push('Clone')
  if (options.deriveDefault) derives.push('Default')
  return derives
}

// Generate a single Rust struct definition
const generateStructDefinition = (
  typeInfo: TypeInfo,
  options: RustOptions,
  derives: string[],
): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) => {
    const fieldName = toSnakeCase(key)
    const baseType = rustType(childType, options)
    const fieldType = options.optionalProperties ? `Option<${baseType}>` : baseType

    // Add serde rename attribute if field name differs from key
    const renameAttr =
      fieldName !== key && options.deriveSerde ? `    #[serde(rename = "${key}")]\n` : ''

    // Add skip_serializing_if for optional fields
    const skipAttr =
      options.optionalProperties && options.deriveSerde
        ? `    #[serde(skip_serializing_if = "Option::is_none")]\n`
        : ''

    return `${renameAttr}${skipAttr}    pub ${fieldName}: ${fieldType},`
  })

  const deriveAttr = derives.length > 0 ? `#[derive(${derives.join(', ')})]\n` : ''
  return `${deriveAttr}pub struct ${typeInfo.name} {\n${fields.join('\n')}\n}`
}

export const rustGenerator: CodeGenerator<RustOptions> = {
  generate(data: unknown, options: RustOptions): string {
    const derives = buildDerives(options)
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateStructDefinition(typeInfo, options, derives),
    )

    const imports = options.deriveSerde ? 'use serde::{Deserialize, Serialize};\n\n' : ''
    return imports + definitions.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): RustOptions {
    return { ...defaultRustOptions }
  },
}
