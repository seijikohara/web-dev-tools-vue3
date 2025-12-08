import type { CodeGenerator, PhpOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultPhpOptions: PhpOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useStrictTypes: true,
  useReadonlyProperties: false,
  useConstructorPromotion: true,
  namespace: '',
}

const phpType = (typeInfo: TypeInfo): string => {
  if (typeInfo.isArray) {
    return 'array'
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'string'
    case 'number':
      return 'float'
    case 'boolean':
      return 'bool'
    case 'null':
      return 'mixed'
    default:
      return 'mixed'
  }
}

// Build PHP property type with optional prefix
const buildPhpPropType = (childType: TypeInfo, options: PhpOptions): string => {
  const baseType = phpType(childType)
  return options.optionalProperties ? `?${baseType}` : baseType
}

// Generate PHP class with constructor promotion (PHP 8.0+)
const generatePromotedClassPhp = (typeInfo: TypeInfo, options: PhpOptions): string => {
  if (!typeInfo.children) return ''
  const entries = Object.entries(typeInfo.children)
  const readonly = options.useReadonlyProperties ? 'readonly ' : ''

  const properties = entries.map(([key, childType], index) => {
    const propName = toCamelCase(key)
    const propType = buildPhpPropType(childType, options)
    const trailing = index === entries.length - 1 ? '' : ','
    return `        public ${readonly}${propType} $${propName}${trailing}`
  })

  return `class ${typeInfo.name}\n{\n    public function __construct(\n${properties.join('\n')}\n    ) {}\n}`
}

// Generate traditional PHP class
const generateTraditionalClassPhp = (typeInfo: TypeInfo, options: PhpOptions): string => {
  if (!typeInfo.children) return ''
  const entries = Object.entries(typeInfo.children)
  const readonly = options.useReadonlyProperties ? 'readonly ' : ''

  const properties = entries.map(([key, childType]) => {
    const propName = toCamelCase(key)
    const propType = buildPhpPropType(childType, options)
    return `    public ${readonly}${propType} $${propName};`
  })

  const constructorParams = entries.map(([key, childType]) => {
    const propName = toCamelCase(key)
    const propType = buildPhpPropType(childType, options)
    return `${propType} $${propName}`
  })

  const constructorAssignments = entries.map(([key]) => {
    const propName = toCamelCase(key)
    return `        $this->${propName} = $${propName};`
  })

  const constructor = `    public function __construct(\n        ${constructorParams.join(',\n        ')}\n    ) {\n${constructorAssignments.join('\n')}\n    }`

  return `class ${typeInfo.name}\n{\n${properties.join('\n')}\n\n${constructor}\n}`
}

// Generate a single PHP class definition
const generateClassDefinitionPhp = (typeInfo: TypeInfo, options: PhpOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  return options.useConstructorPromotion
    ? generatePromotedClassPhp(typeInfo, options)
    : generateTraditionalClassPhp(typeInfo, options)
}

export const phpGenerator: CodeGenerator<PhpOptions> = {
  generate(data: unknown, options: PhpOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateClassDefinitionPhp(typeInfo, options),
    )

    // Build header
    const header: string[] = ['<?php']
    if (options.useStrictTypes) {
      header.push('')
      header.push('declare(strict_types=1);')
    }
    if (options.namespace) {
      header.push('')
      header.push(`namespace ${options.namespace};`)
    }

    return header.join('\n') + '\n\n' + classes.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): PhpOptions {
    return { ...defaultPhpOptions }
  },
}
