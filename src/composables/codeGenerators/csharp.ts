import type { CodeGenerator, CSharpOptions, JsonValue, TypeInfo } from './types'
import { inferType, toPascalCase, generateWithNestedTypes } from './utils'

export const defaultCSharpOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useRecords: true,
  useNullableReferenceTypes: true,
  useSystemTextJson: true,
  useNewtonsoft: false,
  generateDataContract: false,
} as const satisfies CSharpOptions

const csharpType = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `List<${csharpType(typeInfo.arrayItemType, options)}>`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'string',
    number: 'double',
    boolean: 'bool',
    null: 'object',
  } as const

  return (primitiveTypeMap as Record<string, string>)[typeInfo.name] ?? 'object'
}

// Build property type with nullable suffix
const buildPropType = (childType: TypeInfo, options: CSharpOptions): string => {
  const baseType = csharpType(childType, options)
  return options.optionalProperties && options.useNullableReferenceTypes ? `${baseType}?` : baseType
}

// Build annotations array for property
const buildAnnotations = (
  key: string,
  propName: string,
  options: CSharpOptions,
  indent = '',
): string[] => {
  const annotations = [
    options.useSystemTextJson && propName !== key && `${indent}[JsonPropertyName("${key}")]`,
    options.useNewtonsoft && propName !== key && `${indent}[JsonProperty("${key}")]`,
    options.generateDataContract && `${indent}[DataMember(Name = "${key}")]`,
  ].filter(Boolean) as string[]

  return annotations
}

const buildRecordProperty = (key: string, childType: TypeInfo, options: CSharpOptions): string => {
  const propName = toPascalCase(key)
  const propType = buildPropType(childType, options)
  const annotations = buildAnnotations(key, propName, options)
  const annotationStr = annotations.length > 0 ? annotations.join(' ') + ' ' : ''
  return `    ${annotationStr}${propType} ${propName}`
}

// Generate C# record definition
const generateRecordDefinition = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const properties = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildRecordProperty(key, childType, options),
  )

  const dataContractAttr = options.generateDataContract
    ? `[DataContract]
`
    : ''
  return `${dataContractAttr}public record ${typeInfo.name}(
${properties.join(',\n')}
);`
}

const buildClassProperty = (key: string, childType: TypeInfo, options: CSharpOptions): string => {
  const propName = toPascalCase(key)
  const propType = buildPropType(childType, options)
  const annotations = buildAnnotations(key, propName, options, '    ')
  const annotationStr = annotations.length > 0 ? `${annotations.join('\n')}\n` : ''
  return `${annotationStr}    public ${propType} ${propName} { get; set; }`
}

// Generate traditional C# class definition
const generateClassDefinitionCSharp = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const properties = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildClassProperty(key, childType, options),
  )

  const dataContractAttr = options.generateDataContract
    ? `[DataContract]
`
    : ''
  return `${dataContractAttr}public class ${typeInfo.name}
{
${properties.join('\n\n')}
}`
}

// Generate a single C# type definition
const generateTypeDefinitionCSharp = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  return options.useRecords
    ? generateRecordDefinition(typeInfo, options)
    : generateClassDefinitionCSharp(typeInfo, options)
}

const buildImports = (options: CSharpOptions): string[] =>
  [
    'using System.Collections.Generic;',
    options.useSystemTextJson && 'using System.Text.Json.Serialization;',
    options.useNewtonsoft && 'using Newtonsoft.Json;',
    options.generateDataContract && 'using System.Runtime.Serialization;',
    ...(options.useNullableReferenceTypes ? ['', '#nullable enable'] : []),
  ].filter(Boolean) as string[]

export const csharpGenerator = {
  generate(data: unknown, options: CSharpOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateTypeDefinitionCSharp(typeInfo, options),
    )

    const imports = buildImports(options)
    return [imports.join('\n'), classes.filter(Boolean).join('\n\n')].join('\n\n')
  },

  getDefaultOptions(): CSharpOptions {
    return { ...defaultCSharpOptions }
  },
} as const satisfies CodeGenerator<CSharpOptions>
