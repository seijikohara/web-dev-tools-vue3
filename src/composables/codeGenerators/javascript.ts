import type { CodeGenerator, JavaScriptOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultJavaScriptOptions: JavaScriptOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useClass: true,
  useJSDoc: true,
  useES6: true,
  generateFactory: false,
  generateValidator: false,
}

const generateJSDocType = (typeInfo: TypeInfo): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `Array<${generateJSDocType(typeInfo.arrayItemType)}>`
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    default:
      return '*'
  }
}

// Generate class definition
const generateClassDefinition = (typeInfo: TypeInfo, options: JavaScriptOptions): string[] => {
  if (!typeInfo.isObject || !typeInfo.children) return []

  const results: string[] = []
  const entries = Object.entries(typeInfo.children)
  const name = typeInfo.name

  // Generate JSDoc
  const jsDocLines: string[] = []
  if (options.useJSDoc) {
    jsDocLines.push('/**')
    jsDocLines.push(` * @class ${name}`)
    entries.forEach(([key, childType]) => {
      const propName = toCamelCase(key)
      const propType = generateJSDocType(childType)
      jsDocLines.push(` * @property {${propType}} ${propName}`)
    })
    jsDocLines.push(' */')
  }

  const constructorParams = entries.map(([key]) => toCamelCase(key)).join(', ')
  const constructorBody = entries
    .map(([key]) => {
      const propName = toCamelCase(key)
      return `    this.${propName} = ${propName};`
    })
    .join('\n')

  const classBody = options.useES6
    ? `class ${name} {\n  constructor(${constructorParams}) {\n${constructorBody}\n  }\n}`
    : `function ${name}(${constructorParams}) {\n${constructorBody}\n}`

  const jsDoc = jsDocLines.length > 0 ? jsDocLines.join('\n') + '\n' : ''
  results.push(jsDoc + classBody)

  // Generate factory function if requested
  if (options.generateFactory) {
    const factoryParams = entries.map(([key]) => toCamelCase(key)).join(', ')
    const factoryDoc = options.useJSDoc
      ? `/**\n * Create a new ${name} instance\n * @returns {${name}}\n */\n`
      : ''
    results.push(
      `${factoryDoc}function create${name}(${factoryParams}) {\n  return new ${name}(${factoryParams});\n}`,
    )
  }

  // Generate validator if requested
  if (options.generateValidator) {
    const validatorDoc = options.useJSDoc
      ? `/**\n * Validate a ${name} object\n * @param {Object} obj\n * @returns {boolean}\n */\n`
      : ''
    const checks = entries
      .map(([key, childType]) => {
        const propName = toCamelCase(key)
        if (childType.isArray) {
          return `  if (!Array.isArray(obj.${propName})) return false;`
        }
        if (childType.isObject) {
          return `  if (typeof obj.${propName} !== 'object' || obj.${propName} === null) return false;`
        }
        switch (childType.name) {
          case 'string':
            return `  if (typeof obj.${propName} !== 'string') return false;`
          case 'number':
            return `  if (typeof obj.${propName} !== 'number') return false;`
          case 'boolean':
            return `  if (typeof obj.${propName} !== 'boolean') return false;`
          default:
            return ''
        }
      })
      .filter(Boolean)
      .join('\n')

    results.push(
      `${validatorDoc}function is${name}(obj) {\n  if (typeof obj !== 'object' || obj === null) return false;\n${checks}\n  return true;\n}`,
    )
  }

  return results
}

// Generate object literal / typedef
const generateObjectLiteral = (typeInfo: TypeInfo, options: JavaScriptOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)
  const name = typeInfo.name

  const jsDocLines: string[] = []
  if (options.useJSDoc) {
    jsDocLines.push('/**')
    jsDocLines.push(` * @typedef {Object} ${name}`)
    entries.forEach(([key, childType]) => {
      const propName = toCamelCase(key)
      const propType = generateJSDocType(childType)
      jsDocLines.push(` * @property {${propType}} ${propName}`)
    })
    jsDocLines.push(' */')
  }

  const getDefaultValue = (childType: TypeInfo): string => {
    if (childType.isArray) return '[]'
    if (childType.isObject) return 'null'
    switch (childType.name) {
      case 'string':
        return "''"
      case 'number':
        return '0'
      case 'boolean':
        return 'false'
      default:
        return 'null'
    }
  }

  const objectProps = entries
    .map(([key, childType]) => {
      const propName = toCamelCase(key)
      const defaultValue = getDefaultValue(childType)
      return `  ${propName}: ${defaultValue},`
    })
    .join('\n')

  const jsDoc = jsDocLines.length > 0 ? jsDocLines.join('\n') + '\n' : ''
  const constKeyword = options.useES6 ? 'const' : 'var'
  return `${jsDoc}${constKeyword} ${name.toLowerCase()}Template = {\n${objectProps}\n};`
}

// Generate code for a single type
const generateSingleType = (typeInfo: TypeInfo, options: JavaScriptOptions): string[] => {
  if (options.useClass) {
    return generateClassDefinition(typeInfo, options)
  }
  const literal = generateObjectLiteral(typeInfo, options)
  return literal ? [literal] : []
}

export const javaScriptGenerator: CodeGenerator<JavaScriptOptions> = {
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
}
