import type { CodeGenerator, KotlinOptions, JsonValue, TypeInfo } from './types'
import { inferType, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultKotlinOptions = {
  rootName: 'Root',
  optionalProperties: false,
  useDataClass: true,
  serializationLibrary: 'none',
  useDefaultValues: false,
} as const satisfies KotlinOptions

const kotlinType = (typeInfo: TypeInfo): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `List<${kotlinType(typeInfo.arrayItemType)}>`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'String',
    number: 'Double',
    boolean: 'Boolean',
    null: 'Any',
  } as const

  return (primitiveTypeMap as Record<string, string>)[typeInfo.name] ?? 'Any'
}

const getDefaultValue = (typeInfo: TypeInfo): string => {
  if (typeInfo.isArray) return 'emptyList()'

  const defaultValueMap = {
    string: '""',
    number: '0.0',
    boolean: 'false',
  } as const

  return (defaultValueMap as Record<string, string>)[typeInfo.name] ?? 'null'
}

// Get serialization annotation for property
const getSerializationAnnotation = (
  key: string,
  propName: string,
  library: KotlinOptions['serializationLibrary'],
): string | null => {
  if (propName === key || library === 'none') return null

  const annotationMap = {
    kotlinx: `@SerialName("${key}")`,
    gson: `@SerializedName("${key}")`,
    moshi: `@Json(name = "${key}")`,
    jackson: `@JsonProperty("${key}")`,
  } as const

  return (annotationMap as Record<string, string>)[library] ?? null
}

const buildPropertyDefinition = (
  key: string,
  childType: TypeInfo,
  options: KotlinOptions,
): string => {
  const propName = toCamelCase(key)
  const baseType = kotlinType(childType)
  const propType = options.optionalProperties ? `${baseType}?` : baseType

  const annotation = getSerializationAnnotation(key, propName, options.serializationLibrary)
  const annotationStr = annotation
    ? `${annotation}
    `
    : ''
  const defaultValue = options.useDefaultValues ? ` = ${getDefaultValue(childType)}` : ''

  return `${annotationStr}val ${propName}: ${propType}${defaultValue}`
}

const buildClassAnnotations = (library: KotlinOptions['serializationLibrary']): string[] =>
  library === 'kotlinx' ? ['@Serializable'] : []

const buildImports = (library: KotlinOptions['serializationLibrary']): string[] => {
  if (library === 'none') return []

  const importMap = {
    kotlinx: [
      'import kotlinx.serialization.Serializable',
      'import kotlinx.serialization.SerialName',
    ],
    gson: ['import com.google.gson.annotations.SerializedName'],
    moshi: ['import com.squareup.moshi.Json'],
    jackson: ['import com.fasterxml.jackson.annotation.JsonProperty'],
  }

  return (importMap as Record<string, string[]>)[library] ?? []
}

// Generate a single Kotlin class definition
const generateClassDefinitionKotlin = (typeInfo: TypeInfo, options: KotlinOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const properties = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildPropertyDefinition(key, childType, options),
  )

  const classAnnotations = buildClassAnnotations(options.serializationLibrary)
  const classAnnotationStr = classAnnotations.length > 0 ? `${classAnnotations.join('\n')}\n` : ''
  const classKeyword = options.useDataClass ? 'data class' : 'class'

  return `${classAnnotationStr}${classKeyword} ${typeInfo.name}(
    ${properties.join(`,
    `)}
)`
}

export const kotlinGenerator = {
  generate(data: unknown, options: KotlinOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateClassDefinitionKotlin(typeInfo, options),
    )

    const imports = buildImports(options.serializationLibrary)
    const importStr = imports.length > 0 ? `${imports.join('\n')}\n\n` : ''
    return importStr + classes.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): KotlinOptions {
    return { ...defaultKotlinOptions }
  },
} as const satisfies CodeGenerator<KotlinOptions>

// UI option definitions for Kotlin
export const KOTLIN_SERIALIZATION_OPTIONS = [
  { value: 'none', label: 'None', description: 'No serialization annotations' },
  { value: 'kotlinx', label: 'Kotlinx Serialization', description: '@Serializable annotations' },
  { value: 'gson', label: 'Gson', description: '@SerializedName annotations' },
  { value: 'moshi', label: 'Moshi', description: '@Json annotations' },
  { value: 'jackson', label: 'Jackson', description: '@JsonProperty annotations' },
] as const
