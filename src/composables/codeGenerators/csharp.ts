import type { CodeGenerator, CSharpOptions, JsonValue, TypeInfo } from './types'
import { inferType, toPascalCase, generateWithNestedTypes } from './utils'

export const defaultCSharpOptions: CSharpOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useRecords: true,
  useNullableReferenceTypes: true,
  useSystemTextJson: true,
  useNewtonsoft: false,
  generateDataContract: false,
}

const csharpType = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `List<${csharpType(typeInfo.arrayItemType, options)}>`
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'string'
    case 'number':
      return 'double'
    case 'boolean':
      return 'bool'
    case 'null':
      return 'object'
    default:
      return 'object'
  }
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
  const annotations: string[] = []
  if (options.useSystemTextJson && propName !== key) {
    annotations.push(`${indent}[JsonPropertyName("${key}")]`)
  }
  if (options.useNewtonsoft && propName !== key) {
    annotations.push(`${indent}[JsonProperty("${key}")]`)
  }
  if (options.generateDataContract) {
    annotations.push(`${indent}[DataMember(Name = "${key}")]`)
  }
  return annotations
}

// Generate C# record definition
const generateRecordDefinition = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  if (!typeInfo.children) return ''
  const properties = Object.entries(typeInfo.children).map(([key, childType]) => {
    const propName = toPascalCase(key)
    const propType = buildPropType(childType, options)
    const annotations = buildAnnotations(key, propName, options)
    const annotationStr = annotations.length > 0 ? annotations.join(' ') + ' ' : ''
    return `    ${annotationStr}${propType} ${propName}`
  })

  const dataContractAttr = options.generateDataContract ? '[DataContract]\n' : ''
  return `${dataContractAttr}public record ${typeInfo.name}(\n${properties.join(',\n')}\n);`
}

// Generate traditional C# class definition
const generateClassDefinitionCSharp = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  if (!typeInfo.children) return ''
  const properties = Object.entries(typeInfo.children).map(([key, childType]) => {
    const propName = toPascalCase(key)
    const propType = buildPropType(childType, options)
    const annotations = buildAnnotations(key, propName, options, '    ')
    const annotationStr = annotations.length > 0 ? annotations.join('\n') + '\n' : ''
    return `${annotationStr}    public ${propType} ${propName} { get; set; }`
  })

  const dataContractAttr = options.generateDataContract ? '[DataContract]\n' : ''
  return `${dataContractAttr}public class ${typeInfo.name}\n{\n${properties.join('\n\n')}\n}`
}

// Generate a single C# type definition
const generateTypeDefinitionCSharp = (typeInfo: TypeInfo, options: CSharpOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  return options.useRecords
    ? generateRecordDefinition(typeInfo, options)
    : generateClassDefinitionCSharp(typeInfo, options)
}

export const csharpGenerator: CodeGenerator<CSharpOptions> = {
  generate(data: unknown, options: CSharpOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateTypeDefinitionCSharp(typeInfo, options),
    )

    // Build imports
    const imports: string[] = []
    imports.push('using System.Collections.Generic;')

    if (options.useSystemTextJson) {
      imports.push('using System.Text.Json.Serialization;')
    }
    if (options.useNewtonsoft) {
      imports.push('using Newtonsoft.Json;')
    }
    if (options.generateDataContract) {
      imports.push('using System.Runtime.Serialization;')
    }
    if (options.useNullableReferenceTypes) {
      imports.push('')
      imports.push('#nullable enable')
    }

    return imports.join('\n') + '\n\n' + classes.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): CSharpOptions {
    return { ...defaultCSharpOptions }
  },
}
