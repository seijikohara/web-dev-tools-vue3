import type { CodeGenerator, PhpOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultPhpOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useStrictTypes: true,
  useReadonlyProperties: false,
  useConstructorPromotion: true,
  namespace: '',
} as const satisfies PhpOptions

const phpType = (typeInfo: TypeInfo): string => {
  // Early return for arrays
  if (typeInfo.isArray) {
    return 'array'
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'string',
    number: 'float',
    boolean: 'bool',
    null: 'mixed',
  } as const

  return primitiveTypeMap[typeInfo.name as keyof typeof primitiveTypeMap] ?? 'mixed'
}

// Build PHP property type with optional prefix
const buildPhpPropType = (childType: TypeInfo, options: PhpOptions): string => {
  const baseType = phpType(childType)
  return options.optionalProperties ? `?${baseType}` : baseType
}

const buildPromotedProperty = (
  key: string,
  childType: TypeInfo,
  options: PhpOptions,
  isLast: boolean,
): string => {
  const propName = toCamelCase(key)
  const propType = buildPhpPropType(childType, options)
  const readonly = options.useReadonlyProperties ? 'readonly ' : ''
  const trailing = isLast ? '' : ','
  return `        public ${readonly}${propType} $${propName}${trailing}`
}

// Generate PHP class with constructor promotion (PHP 8.0+)
const generatePromotedClassPhp = (typeInfo: TypeInfo, options: PhpOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)
  const properties = entries
    .map(([key, childType], index) =>
      buildPromotedProperty(key, childType, options, index === entries.length - 1)
    )

  return `class ${typeInfo.name}
{
    public function __construct(
${properties.join('\n')}
    ) {}
}`
}

const buildTraditionalProperty = (
  key: string,
  childType: TypeInfo,
  options: PhpOptions,
): string => {
  const propName = toCamelCase(key)
  const propType = buildPhpPropType(childType, options)
  const readonly = options.useReadonlyProperties ? 'readonly ' : ''
  return `    public ${readonly}${propType} $${propName};`
}

const buildConstructorParam = (key: string, childType: TypeInfo, options: PhpOptions): string => {
  const propName = toCamelCase(key)
  const propType = buildPhpPropType(childType, options)
  return `${propType} $${propName}`
}

const buildConstructorAssignment = (key: string): string => {
  const propName = toCamelCase(key)
  return `        $this->${propName} = $${propName};`
}

// Generate traditional PHP class
const generateTraditionalClassPhp = (typeInfo: TypeInfo, options: PhpOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)

  const properties = entries
    .map(([key, childType]) => buildTraditionalProperty(key, childType, options))

  const constructorParams = entries
    .map(([key, childType]) => buildConstructorParam(key, childType, options))

  const constructorAssignments = entries
    .map(([key]) => buildConstructorAssignment(key))

  const constructor = `    public function __construct(
        ${constructorParams.join(`,
        `)}
    ) {
${constructorAssignments.join('\n')}
    }`

  return `class ${typeInfo.name}
{
${properties.join('\n')}

${constructor}
}`
}

// Generate a single PHP class definition
const generateClassDefinitionPhp = (typeInfo: TypeInfo, options: PhpOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  return options.useConstructorPromotion
    ? generatePromotedClassPhp(typeInfo, options)
    : generateTraditionalClassPhp(typeInfo, options)
}

const buildHeader = (options: PhpOptions): string[] =>
  [
    '<?php',
    ...(options.useStrictTypes ? ['', 'declare(strict_types=1);'] : []),
    ...(options.namespace ? ['', `namespace ${options.namespace};`] : []),
  ]

export const phpGenerator = {
  generate(data: unknown, options: PhpOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateClassDefinitionPhp(typeInfo, options),
    )

    const header = buildHeader(options)
    return [header.join('\n'), classes.filter(Boolean).join('\n\n')].join('\n\n')
  },

  getDefaultOptions(): PhpOptions {
    return { ...defaultPhpOptions }
  },
} as const satisfies CodeGenerator<PhpOptions>
