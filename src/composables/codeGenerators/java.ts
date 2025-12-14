import type { CodeGenerator, JavaOptions, JsonValue, TypeInfo } from './types'
import { inferType, toPascalCase, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultJavaOptions = {
  rootName: 'Root',
  optionalProperties: false,
  packageName: 'com.example',
  classStyle: 'record',
  serializationLibrary: 'none',
  useValidation: false,
  generateBuilder: false,
  generateEquals: true,
  useOptional: false,
} as const satisfies JavaOptions

const javaType = (typeInfo: TypeInfo, options: JavaOptions): string => {
  // Early return for arrays
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `List<${javaTypeBoxed(typeInfo.arrayItemType, options)}>`
  }

  // Early return for objects
  if (typeInfo.isObject) {
    return typeInfo.name
  }

  // Map primitive types
  const primitiveTypeMap = {
    string: 'String',
    number: 'double',
    boolean: 'boolean',
    null: 'Object',
  } as const

  return (primitiveTypeMap as Record<string, string>)[typeInfo.name] ?? 'Object'
}

const javaTypeBoxed = (typeInfo: TypeInfo, options: JavaOptions): string => {
  const type = javaType(typeInfo, options)

  const boxedTypeMap = {
    int: 'Integer',
    long: 'Long',
    double: 'Double',
    float: 'Float',
    boolean: 'Boolean',
    byte: 'Byte',
    short: 'Short',
    char: 'Character',
  } as const

  return (boxedTypeMap as Record<string, string>)[type] ?? type
}

// Generate field annotation based on serialization library
const getFieldAnnotation = (
  key: string,
  fieldName: string,
  library: JavaOptions['serializationLibrary'],
): string => {
  if (key === fieldName || library === 'none') return ''

  const annotationMap = {
    jackson: `    @JsonProperty("${key}")
`,
    gson: `    @SerializedName("${key}")
`,
    moshi: `    @Json(name = "${key}")
`,
  } as const

  return (annotationMap as Record<string, string>)[library] ?? ''
}

// Generate validation annotation
const getValidationAnnotation = (typeInfo: TypeInfo, useValidation: boolean): string => {
  if (!useValidation) return ''

  if (typeInfo.name === 'string')
    return `    @NotBlank
`
  if (!typeInfo.isPrimitive)
    return `    @NotNull
`

  return ''
}

// Build field type with optional wrapper
const buildFieldType = (childType: TypeInfo, options: JavaOptions): string => {
  const baseType = javaType(childType, options)
  return options.useOptional && options.optionalProperties
    ? `Optional<${javaTypeBoxed(childType, options)}>`
    : baseType
}

const buildRecordField = (key: string, childType: TypeInfo, options: JavaOptions): string => {
  const fieldName = toCamelCase(key)
  const fieldType = buildFieldType(childType, options)
  const annotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
  return `${annotation}    ${fieldType} ${fieldName}`
}

// Generate Java record definition
const generateRecordDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildRecordField(key, childType, options),
  )

  return `public record ${typeInfo.name}(
${fields.join(',\n')}
) {}`
}

const buildLombokField = (key: string, childType: TypeInfo, options: JavaOptions): string => {
  const fieldName = toCamelCase(key)
  const fieldType = buildFieldType(childType, options)
  const serializationAnnotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
  const validationAnnotation = getValidationAnnotation(childType, options.useValidation)
  return `${serializationAnnotation}${validationAnnotation}    private ${fieldType} ${fieldName};`
}

const buildLombokAnnotations = (options: JavaOptions): string[] => {
  const annotations = [
    '@Data',
    options.generateBuilder && '@Builder',
    '@NoArgsConstructor',
    '@AllArgsConstructor',
  ].filter(Boolean) as string[]

  return annotations
}

// Generate Lombok class definition
const generateLombokDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const fields = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildLombokField(key, childType, options),
  )

  const lombokAnnotations = buildLombokAnnotations(options)

  return `${lombokAnnotations.join('\n')}
public class ${typeInfo.name} {
${fields.join('\n\n')}
}`
}

const buildImmutablesMethod = (key: string, childType: TypeInfo, options: JavaOptions): string => {
  const fieldName = toCamelCase(key)
  const fieldType = buildFieldType(childType, options)
  const annotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
  return `${annotation}    ${fieldType} ${fieldName}();`
}

// Generate Immutables interface definition
const generateImmutablesDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const methods = Object.entries(typeInfo.children).map(([key, childType]) =>
    buildImmutablesMethod(key, childType, options),
  )

  return `@Value.Immutable
public interface ${typeInfo.name} {
${methods.join('\n\n')}
}`
}

// Generate equals/hashCode methods for POJO
const generateEqualsHashCode = (typeName: string, fieldNames: string[]): string[] => {
  const equalsComparisons = fieldNames.map(f => `Objects.equals(${f}, that.${f})`).join(` &&
               `)

  const equalsMethod = `    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ${typeName} that = (${typeName}) o;
        return ${equalsComparisons};
    }`

  const hashCodeMethod = `    @Override
    public int hashCode() {
        return Objects.hash(${fieldNames.join(', ')});
    }`

  return ['', equalsMethod, hashCodeMethod]
}

const buildPojoField = (key: string, childType: TypeInfo, options: JavaOptions): string => {
  const fieldName = toCamelCase(key)
  const fieldType = buildFieldType(childType, options)
  const serializationAnnotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
  const validationAnnotation = getValidationAnnotation(childType, options.useValidation)
  return `${serializationAnnotation}${validationAnnotation}    private ${fieldType} ${fieldName};`
}

const buildPojoAccessors = (key: string, childType: TypeInfo, options: JavaOptions): string[] => {
  const fieldName = toCamelCase(key)
  const fieldType = buildFieldType(childType, options)
  const capitalizedName = toPascalCase(fieldName)

  const getter = `    public ${fieldType} get${capitalizedName}() {
        return ${fieldName};
    }`
  const setter = `    public void set${capitalizedName}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`

  return [getter, setter]
}

// Generate POJO class definition
const generatePojoDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  // Early return for non-objects
  if (!typeInfo.children) return ''

  const entries = Object.entries(typeInfo.children)

  const fields = entries.map(([key, childType]) => buildPojoField(key, childType, options))

  const gettersSetters = entries.flatMap(([key, childType]) =>
    buildPojoAccessors(key, childType, options),
  )

  const fieldNames = entries.map(([key]) => toCamelCase(key))
  const equalsHashCode = options.generateEquals
    ? generateEqualsHashCode(typeInfo.name, fieldNames)
    : []

  const members = [...fields, '', ...gettersSetters, ...equalsHashCode]

  return `public class ${typeInfo.name} {
${members.join('\n')}
}`
}

// Generate a single Java class definition
const generateClassDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  // Early return for non-objects
  if (!typeInfo.isObject || !typeInfo.children) return ''

  const generatorMap = {
    record: generateRecordDefinition,
    lombok: generateLombokDefinition,
    immutables: generateImmutablesDefinition,
    pojo: generatePojoDefinition,
  } as const

  const generator = generatorMap[options.classStyle]
  return generator(typeInfo, options)
}

const buildPackageImport = (packageName: string): string[] =>
  packageName ? [`package ${packageName};`, ''] : []

const buildBaseImports = (): string[] => ['import java.util.List;']

const buildOptionalImport = (options: JavaOptions): string[] =>
  options.useOptional && options.optionalProperties ? ['import java.util.Optional;'] : []

const buildEqualsImport = (options: JavaOptions): string[] =>
  options.generateEquals && options.classStyle === 'pojo' ? ['import java.util.Objects;'] : []

const buildSerializationImports = (library: JavaOptions['serializationLibrary']): string[] => {
  if (library === 'none') return []

  const importMap = {
    jackson: ['import com.fasterxml.jackson.annotation.JsonProperty;'],
    gson: ['import com.google.gson.annotations.SerializedName;'],
    moshi: ['import com.squareup.moshi.Json;'],
  }

  return (importMap as Record<string, string[]>)[library] ?? []
}

const buildLombokImports = (options: JavaOptions): string[] => {
  if (options.classStyle !== 'lombok') return []

  const imports = [
    'import lombok.Data;',
    'import lombok.NoArgsConstructor;',
    'import lombok.AllArgsConstructor;',
    options.generateBuilder && 'import lombok.Builder;',
  ].filter(Boolean) as string[]

  return imports
}

const buildImmutablesImport = (options: JavaOptions): string[] =>
  options.classStyle === 'immutables' ? ['import org.immutables.value.Value;'] : []

const buildValidationImports = (options: JavaOptions): string[] =>
  options.useValidation
    ? [
        'import javax.validation.constraints.NotNull;',
        'import javax.validation.constraints.NotBlank;',
      ]
    : []

const buildAllImports = (options: JavaOptions): string[] => {
  const imports = [
    ...buildPackageImport(options.packageName),
    ...buildBaseImports(),
    ...buildOptionalImport(options),
    ...buildEqualsImport(options),
    ...buildSerializationImports(options.serializationLibrary),
    ...buildLombokImports(options),
    ...buildImmutablesImport(options),
    ...buildValidationImports(options),
  ]

  return imports
}

export const javaGenerator = {
  generate(data: unknown, options: JavaOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateClassDefinition(typeInfo, options),
    )

    const imports = buildAllImports(options)
    return [imports.join('\n'), classes.filter(Boolean).join('\n\n')].join('\n\n')
  },

  getDefaultOptions(): JavaOptions {
    return { ...defaultJavaOptions }
  },
} as const satisfies CodeGenerator<JavaOptions>

// UI option definitions for Java
export const JAVA_CLASS_STYLE_OPTIONS = [
  { value: 'record', label: 'Record (Java 16+)', description: 'Immutable data class' },
  { value: 'pojo', label: 'POJO', description: 'Traditional JavaBean' },
  { value: 'lombok', label: 'Lombok', description: 'With @Data annotation' },
  { value: 'immutables', label: 'Immutables', description: 'With @Value.Immutable' },
] as const

export const JAVA_SERIALIZATION_OPTIONS = [
  { value: 'none', label: 'None', description: 'No serialization annotations' },
  { value: 'jackson', label: 'Jackson', description: '@JsonProperty annotations' },
  { value: 'gson', label: 'Gson', description: '@SerializedName annotations' },
  { value: 'moshi', label: 'Moshi', description: '@Json annotations' },
] as const
