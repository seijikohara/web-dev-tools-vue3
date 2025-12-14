import type { CodeGenerator, PythonOptions, JsonValue, TypeInfo } from './types'
import { inferType, toSnakeCase, generateWithNestedTypes } from './utils'

// Default options for unified Python generator
export const defaultPythonOptions = {
  rootName: 'Root',
  optionalProperties: false,
  style: 'dataclass',
  // dataclass options
  useFrozen: false,
  useSlots: false,
  useKwOnly: false,
  // typeddict options
  useTotal: true,
} as const satisfies PythonOptions

// Legacy default options for backward compatibility
export const defaultPythonDataclassOptions = {
  ...defaultPythonOptions,
  style: 'dataclass',
} as const satisfies PythonOptions

export const defaultPythonTypedDictOptions = {
  ...defaultPythonOptions,
  style: 'typeddict',
} as const satisfies PythonOptions

// Map primitive type to Python type
const mapPrimitiveType = (typeName: string): string => {
  const primitiveTypeMap = {
    string: 'str',
    number: 'float',
    boolean: 'bool',
    null: 'None',
  } as const

  return primitiveTypeMap[typeName as keyof typeof primitiveTypeMap] ?? 'Any'
}

// Python type mapping
const pythonType = (typeInfo: TypeInfo, useOptional: boolean): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `list[${pythonType(typeInfo.arrayItemType, false)}]`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return `'${typeInfo.name}'`
  }

  const baseType = mapPrimitiveType(typeInfo.name)
  return useOptional ? `${baseType} | None` : baseType
}

const buildDataclassDecorator = (options: PythonOptions): string => {
  const decoratorParts = [
    options.useFrozen && 'frozen=True',
    options.useSlots && 'slots=True',
    options.useKwOnly && 'kw_only=True',
  ].filter(Boolean)

  return decoratorParts.length > 0 ? `@dataclass(${decoratorParts.join(', ')})` : '@dataclass'
}

const buildFieldDefinition = (key: string, childType: TypeInfo, options: PythonOptions): string => {
  const fieldName = toSnakeCase(key)
  const fieldType = pythonType(childType, options.optionalProperties)
  const defaultValue = options.optionalProperties ? ' = None' : ''
  return `    ${fieldName}: ${fieldType}${defaultValue}`
}

// Generate a single dataclass definition
const generateDataclassDefinition = (typeInfo: TypeInfo, options: PythonOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildFieldDefinition(key, childType, options),
  )

  const decorator = buildDataclassDecorator(options)

  return `${decorator}
class ${typeInfo.name}:
${fields.join('\n')}`
}

// Dataclass generator
export const pythonDataclassGenerator = {
  generate(data: unknown, options: PythonOptions): string {
    const imports = 'from dataclasses import dataclass'
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateDataclassDefinition(typeInfo, options),
    )

    return [imports, definitions.filter(Boolean).join('\n\n')].join('\n\n')
  },

  getDefaultOptions(): PythonOptions {
    return { ...defaultPythonDataclassOptions }
  },
} as const satisfies CodeGenerator<PythonOptions>

const buildTypedDictFieldType = (childType: TypeInfo, options: PythonOptions): string => {
  const baseType = pythonType(childType, false)
  return options.optionalProperties ? `NotRequired[${baseType}]` : baseType
}

const buildTypedDictField = (key: string, childType: TypeInfo, options: PythonOptions): string => {
  const fieldType = buildTypedDictFieldType(childType, options)
  return `    ${key}: ${fieldType}`
}

// Generate a single TypedDict definition
const generateTypedDictDefinition = (typeInfo: TypeInfo, options: PythonOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildTypedDictField(key, childType, options),
  )

  const totalArg = options.useTotal ? '' : ', total=False'
  return `class ${typeInfo.name}(TypedDict${totalArg}):
${fields.join('\n')}`
}

const buildTypedDictImports = (options: PythonOptions): string =>
  [
    'from typing import TypedDict',
    ...(options.optionalProperties ? ['from typing import NotRequired'] : []),
  ].join('\n')

// TypedDict generator
export const pythonTypedDictGenerator = {
  generate(data: unknown, options: PythonOptions): string {
    const imports = buildTypedDictImports(options)
    const rootType = inferType(data as JsonValue, options.rootName)
    const definitions = generateWithNestedTypes(rootType, typeInfo =>
      generateTypedDictDefinition(typeInfo, options),
    )

    return [imports, definitions.filter(Boolean).join('\n\n')].join('\n\n')
  },

  getDefaultOptions(): PythonOptions {
    return { ...defaultPythonTypedDictOptions }
  },
} as const satisfies CodeGenerator<PythonOptions>

// Unified Python generator that delegates based on style option
export const pythonGenerator = {
  generate(data: unknown, options: PythonOptions): string {
    return options.style === 'dataclass'
      ? pythonDataclassGenerator.generate(data, options)
      : pythonTypedDictGenerator.generate(data, options)
  },

  getDefaultOptions(): PythonOptions {
    return { ...defaultPythonOptions }
  },
} as const satisfies CodeGenerator<PythonOptions>
