import type { CodeGenerator, KotlinOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultKotlinOptions: KotlinOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useDataClass: true,
  serializationLibrary: 'none',
  useDefaultValues: false,
}

const kotlinType = (typeInfo: TypeInfo): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `List<${kotlinType(typeInfo.arrayItemType)}>`
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'String'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Boolean'
    case 'null':
      return 'Any'
    default:
      return 'Any'
  }
}

const getDefaultValue = (typeInfo: TypeInfo): string => {
  if (typeInfo.isArray) return 'emptyList()'
  switch (typeInfo.name) {
    case 'string':
      return '""'
    case 'number':
      return '0.0'
    case 'boolean':
      return 'false'
    default:
      return 'null'
  }
}

// Get serialization annotation for property
const getSerializationAnnotation = (
  key: string,
  propName: string,
  library: KotlinOptions['serializationLibrary'],
): string | null => {
  if (propName === key) return null
  switch (library) {
    case 'kotlinx':
      return `@SerialName("${key}")`
    case 'gson':
      return `@SerializedName("${key}")`
    case 'moshi':
      return `@Json(name = "${key}")`
    case 'jackson':
      return `@JsonProperty("${key}")`
    default:
      return null
  }
}

// Generate a single Kotlin class definition
const generateClassDefinitionKotlin = (typeInfo: TypeInfo, options: KotlinOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const properties = Object.entries(typeInfo.children).map(([key, childType]) => {
    const propName = toCamelCase(key)
    const baseType = kotlinType(childType)
    const propType = options.optionalProperties ? `${baseType}?` : baseType

    const annotation = getSerializationAnnotation(key, propName, options.serializationLibrary)
    const annotationStr = annotation ? `${annotation}\n    ` : ''
    const defaultValue = options.useDefaultValues ? ` = ${getDefaultValue(childType)}` : ''

    return `${annotationStr}val ${propName}: ${propType}${defaultValue}`
  })

  // Build class annotations
  const classAnnotations: string[] = []
  if (options.serializationLibrary === 'kotlinx') {
    classAnnotations.push('@Serializable')
  }

  const classAnnotationStr = classAnnotations.length > 0 ? classAnnotations.join('\n') + '\n' : ''
  const classKeyword = options.useDataClass ? 'data class' : 'class'

  return `${classAnnotationStr}${classKeyword} ${typeInfo.name}(\n    ${properties.join(',\n    ')}\n)`
}

export const kotlinGenerator: CodeGenerator<KotlinOptions> = {
  generate(data: unknown, options: KotlinOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateClassDefinitionKotlin(typeInfo, options),
    )

    // Build imports
    const imports: string[] = []
    switch (options.serializationLibrary) {
      case 'kotlinx':
        imports.push('import kotlinx.serialization.Serializable')
        imports.push('import kotlinx.serialization.SerialName')
        break
      case 'gson':
        imports.push('import com.google.gson.annotations.SerializedName')
        break
      case 'moshi':
        imports.push('import com.squareup.moshi.Json')
        break
      case 'jackson':
        imports.push('import com.fasterxml.jackson.annotation.JsonProperty')
        break
    }

    const importStr = imports.length > 0 ? imports.join('\n') + '\n\n' : ''
    return importStr + classes.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): KotlinOptions {
    return { ...defaultKotlinOptions }
  },
}

// UI option definitions for Kotlin
export const KOTLIN_SERIALIZATION_OPTIONS = [
  { value: 'none', label: 'None', description: 'No serialization annotations' },
  { value: 'kotlinx', label: 'Kotlinx Serialization', description: '@Serializable annotations' },
  { value: 'gson', label: 'Gson', description: '@SerializedName annotations' },
  { value: 'moshi', label: 'Moshi', description: '@Json annotations' },
  { value: 'jackson', label: 'Jackson', description: '@JsonProperty annotations' },
] as const
