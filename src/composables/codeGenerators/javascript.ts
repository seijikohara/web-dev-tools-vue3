import type { CodeGenerator, JavaScriptOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultJavaScriptOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useClass: true,
  useJSDoc: true,
  useES6: true,
  generateFactory: false,
  generateValidator: false,
} as const satisfies JavaScriptOptions

const generateJSDocType = (typeInfo: TypeInfo): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `Array<${generateJSDocType(typeInfo.arrayItemType)}>`
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
    null: 'null',
  } as const

  return (primitiveTypeMap as Record<string, string>)[typeInfo.name] ?? '*'
}

const getDefaultValue = (childType: TypeInfo): string => {
  if (childType.isArray) return '[]'
  if (childType.isObject) return 'null'

  const defaultValueMap = {
    string: "''",
    number: '0',
    boolean: 'false',
  } as const

  return (defaultValueMap as Record<string, string>)[childType.name] ?? 'null'
}

const buildJSDocLines = (name: string, entries: [string, TypeInfo][]): string[] => [
  '/**',
  ` * @class ${name}`,
  ...entries.map(([key, childType]) => {
    const propName = toCamelCase(key)
    const propType = generateJSDocType(childType)
    return ` * @property {${propType}} ${propName}`
  }),
  ' */',
]

const buildConstructorBody = (entries: [string, TypeInfo][]): string =>
  entries
    .map(([key]) => {
      const propName = toCamelCase(key)
      return `    this.${propName} = ${propName};`
    })
    .join('\n')

const buildValidatorChecks = (entries: [string, TypeInfo][]): string =>
  entries
    .map(([key, childType]) => {
      const propName = toCamelCase(key)

      if (childType.isArray) {
        return `  if (!Array.isArray(obj.${propName})) return false;`
      }

      if (childType.isObject) {
        return `  if (typeof obj.${propName} !== 'object' || obj.${propName} === null) return false;`
      }

      const typeCheckMap = {
        string: `  if (typeof obj.${propName} !== 'string') return false;`,
        number: `  if (typeof obj.${propName} !== 'number') return false;`,
        boolean: `  if (typeof obj.${propName} !== 'boolean') return false;`,
      } as const

      return (typeCheckMap as Record<string, string>)[childType.name] ?? ''
    })
    .filter(Boolean)
    .join('\n')

// Build factory function code
const buildFactoryFunction = (name: string, params: string, useJSDoc: boolean): string => {
  const doc = useJSDoc
    ? `/**
 * Create a new ${name} instance
 * @returns {${name}}
 */
`
    : ''
  return `${doc}function create${name}(${params}) {
  return new ${name}(${params});
}`
}

// Build validator function code
const buildValidatorFunction = (
  name: string,
  entries: [string, TypeInfo][],
  useJSDoc: boolean,
): string => {
  const doc = useJSDoc
    ? `/**
 * Validate a ${name} object
 * @param {Object} obj
 * @returns {boolean}
 */
`
    : ''
  const checks = buildValidatorChecks(entries)
  return `${doc}function is${name}(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
${checks}
  return true;
}`
}

// Generate class definition
const generateClassDefinition = (typeInfo: TypeInfo, options: JavaScriptOptions): string[] => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return []

  const entries = Object.entries(typeInfo.children)
  const { name } = typeInfo

  // Generate JSDoc
  const jsDocLines = options.useJSDoc ? buildJSDocLines(name, entries) : []
  const constructorParams = entries.map(([key]) => toCamelCase(key)).join(', ')
  const constructorBody = buildConstructorBody(entries)

  const classBody = options.useES6
    ? `class ${name} {
  constructor(${constructorParams}) {
${constructorBody}
  }
}`
    : `function ${name}(${constructorParams}) {
${constructorBody}
}`

  const jsDoc = jsDocLines.length > 0 ? `${jsDocLines.join('\n')}\n` : ''

  return [
    jsDoc + classBody,
    ...(options.generateFactory
      ? [buildFactoryFunction(name, constructorParams, options.useJSDoc)]
      : []),
    ...(options.generateValidator ? [buildValidatorFunction(name, entries, options.useJSDoc)] : []),
  ]
}

// Generate object literal / typedef
const generateObjectLiteral = (typeInfo: TypeInfo, options: JavaScriptOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)
  const { name } = typeInfo

  const jsDocLines = options.useJSDoc
    ? [
        '/**',
        ` * @typedef {Object} ${name}`,
        ...entries.map(([key, childType]) => {
          const propName = toCamelCase(key)
          const propType = generateJSDocType(childType)
          return ` * @property {${propType}} ${propName}`
        }),
        ' */',
      ]
    : []

  const objectProps = entries
    .map(([key, childType]) => {
      const propName = toCamelCase(key)
      const defaultValue = getDefaultValue(childType)
      return `  ${propName}: ${defaultValue},`
    })
    .join('\n')

  const jsDoc = jsDocLines.length > 0 ? `${jsDocLines.join('\n')}\n` : ''
  const constKeyword = options.useES6 ? 'const' : 'var'
  return `${jsDoc}${constKeyword} ${name.toLowerCase()}Template = {
${objectProps}
};`
}

// Generate code for a single type
const generateSingleType = (typeInfo: TypeInfo, options: JavaScriptOptions): string[] => {
  if (options.useClass) {
    return generateClassDefinition(typeInfo, options)
  }
  const literal = generateObjectLiteral(typeInfo, options)
  return literal ? [literal] : []
}

export const javaScriptGenerator = {
  generate(data: unknown, options: JavaScriptOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const allCode = generateWithNestedTypes(rootType, typeInfo =>
      generateSingleType(typeInfo, options),
    )
    return allCode.flat().join('\n\n')
  },

  getDefaultOptions(): JavaScriptOptions {
    return { ...defaultJavaScriptOptions }
  },
} as const satisfies CodeGenerator<JavaScriptOptions>
