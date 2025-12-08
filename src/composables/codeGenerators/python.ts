import type { CodeGenerator, PythonOptions, JsonValue, TypeInfo } from './types'
import { inferType, toSnakeCase, generateWithNestedTypes } from './utils'

// Default options for unified Python generator
export const defaultPythonOptions: PythonOptions = {
  rootName: 'Root',
  optionalProperties: false,
  style: 'dataclass',
  // dataclass options
  useFrozen: false,
  useSlots: false,
  useKwOnly: false,
  // typeddict options
  useTotal: true,
}

// Legacy default options for backward compatibility
export const defaultPythonDataclassOptions: PythonOptions = {
  ...defaultPythonOptions,
  style: 'dataclass',
}

export const defaultPythonTypedDictOptions: PythonOptions = {
  ...defaultPythonOptions,
  style: 'typeddict',
}

// Map primitive type to Python type
const mapPrimitiveType = (typeName: string): string => {
  switch (typeName) {
    case 'string':
      return 'str'
    case 'number':
      return 'float'
    case 'boolean':
      return 'bool'
    case 'null':
      return 'None'
    default:
      return 'Any'
  }
}

// Python type mapping
const pythonType = (typeInfo: TypeInfo, useOptional: boolean): string => {
  const baseType =
    typeInfo.isArray && typeInfo.arrayItemType
      ? `list[${pythonType(typeInfo.arrayItemType, false)}]`
      : typeInfo.isObject
        ? `'${typeInfo.name}'`
        : mapPrimitiveType(typeInfo.name)

  return useOptional ? `${baseType} | None` : baseType
}

// Generate a single dataclass definition
const generateDataclassDefinition = (typeInfo: TypeInfo, options: PythonOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) => {
    const fieldName = toSnakeCase(key)
    const fieldType = pythonType(childType, options.optionalProperties)
    const defaultValue = options.optionalProperties ? ' = None' : ''
    return `    ${fieldName}: ${fieldType}${defaultValue}`
  })

  // Build decorator
  const decoratorParts: string[] = []
  if (options.useFrozen) decoratorParts.push('frozen=True')
  if (options.useSlots) decoratorParts.push('slots=True')
  if (options.useKwOnly) decoratorParts.push('kw_only=True')

  const decorator =
    decoratorParts.length > 0 ? `@dataclass(${decoratorParts.join(', ')})` : '@dataclass'

  return `${decorator}\nclass ${typeInfo.name}:\n${fields.join('\n')}`
}

// Dataclass generator
export const pythonDataclassGenerator: CodeGenerator<PythonOptions> = {
  generate(data: unknown, options: PythonOptions): string {
    const imports = 'from dataclasses import dataclass'
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateDataclassDefinition(typeInfo, options),
    )

    return imports + '\n\n' + definitions.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): PythonOptions {
    return { ...defaultPythonDataclassOptions }
  },
}

// Generate a single TypedDict definition
const generateTypedDictDefinition = (typeInfo: TypeInfo, options: PythonOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) => {
    const baseType = pythonType(childType, false)
    const fieldType = options.optionalProperties ? `NotRequired[${baseType}]` : baseType
    return `    ${key}: ${fieldType}`
  })

  const totalArg = options.useTotal ? '' : ', total=False'
  return `class ${typeInfo.name}(TypedDict${totalArg}):\n${fields.join('\n')}`
}

// TypedDict generator
export const pythonTypedDictGenerator: CodeGenerator<PythonOptions> = {
  generate(data: unknown, options: PythonOptions): string {
    const imports: string[] = ['from typing import TypedDict']
    if (options.optionalProperties) {
      imports.push('from typing import NotRequired')
    }

    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateTypedDictDefinition(typeInfo, options),
    )

    return imports.join('\n') + '\n\n' + definitions.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): PythonOptions {
    return { ...defaultPythonTypedDictOptions }
  },
}

// Unified Python generator that delegates based on style option
export const pythonGenerator: CodeGenerator<PythonOptions> = {
  generate(data: unknown, options: PythonOptions): string {
    return options.style === 'dataclass'
      ? pythonDataclassGenerator.generate(data, options)
      : pythonTypedDictGenerator.generate(data, options)
  },

  getDefaultOptions(): PythonOptions {
    return { ...defaultPythonOptions }
  },
}
