import type { CodeGenerator, JavaOptions, JsonValue, TypeInfo } from './types'
import { inferType, toPascalCase, toCamelCase, generateWithNestedTypes } from './utils'

export const defaultJavaOptions: JavaOptions = {
  rootName: 'Root',
  optionalProperties: false,
  packageName: 'com.example',
  classStyle: 'record',
  serializationLibrary: 'none',
  useValidation: false,
  generateBuilder: false,
  generateEquals: true,
  useOptional: false,
}

const javaType = (typeInfo: TypeInfo, options: JavaOptions): string => {
  if (typeInfo.isArray && typeInfo.arrayItemType) {
    return `List<${javaTypeBoxed(typeInfo.arrayItemType, options)}>`
  }
  if (typeInfo.isObject) {
    return typeInfo.name
  }
  switch (typeInfo.name) {
    case 'string':
      return 'String'
    case 'number':
      return 'double'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'Object'
    default:
      return 'Object'
  }
}

const javaTypeBoxed = (typeInfo: TypeInfo, options: JavaOptions): string => {
  const type = javaType(typeInfo, options)
  switch (type) {
    case 'int':
      return 'Integer'
    case 'long':
      return 'Long'
    case 'double':
      return 'Double'
    case 'float':
      return 'Float'
    case 'boolean':
      return 'Boolean'
    case 'byte':
      return 'Byte'
    case 'short':
      return 'Short'
    case 'char':
      return 'Character'
    default:
      return type
  }
}

// Generate Jackson annotations
const getJacksonAnnotation = (key: string, fieldName: string): string => {
  if (key !== fieldName) {
    return `    @JsonProperty("${key}")\n`
  }
  return ''
}

// Generate Gson annotations
const getGsonAnnotation = (key: string, fieldName: string): string => {
  if (key !== fieldName) {
    return `    @SerializedName("${key}")\n`
  }
  return ''
}

// Generate Moshi annotations
const getMoshiAnnotation = (key: string, fieldName: string): string => {
  if (key !== fieldName) {
    return `    @Json(name = "${key}")\n`
  }
  return ''
}

// Generate field annotation based on serialization library
const getFieldAnnotation = (
  key: string,
  fieldName: string,
  library: JavaOptions['serializationLibrary'],
): string => {
  switch (library) {
    case 'jackson':
      return getJacksonAnnotation(key, fieldName)
    case 'gson':
      return getGsonAnnotation(key, fieldName)
    case 'moshi':
      return getMoshiAnnotation(key, fieldName)
    default:
      return ''
  }
}

// Generate validation annotation
const getValidationAnnotation = (typeInfo: TypeInfo, useValidation: boolean): string => {
  if (!useValidation) return ''
  if (typeInfo.name === 'string') {
    return '    @NotBlank\n'
  }
  if (!typeInfo.isPrimitive) {
    return '    @NotNull\n'
  }
  return ''
}

// Build field type with optional wrapper
const buildFieldType = (childType: TypeInfo, options: JavaOptions): string => {
  const baseType = javaType(childType, options)
  return options.useOptional && options.optionalProperties
    ? `Optional<${javaTypeBoxed(childType, options)}>`
    : baseType
}

// Generate Java record definition
const generateRecordDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  if (!typeInfo.children) return ''
  const fields = Object.entries(typeInfo.children).map(([key, childType]) => {
    const fieldName = toCamelCase(key)
    const fieldType = buildFieldType(childType, options)
    const annotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
    return `${annotation}    ${fieldType} ${fieldName}`
  })
  return `public record ${typeInfo.name}(\n${fields.join(',\n')}\n) {}`
}

// Generate Lombok class definition
const generateLombokDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  if (!typeInfo.children) return ''
  const fields = Object.entries(typeInfo.children).map(([key, childType]) => {
    const fieldName = toCamelCase(key)
    const fieldType = buildFieldType(childType, options)
    const serializationAnnotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
    const validationAnnotation = getValidationAnnotation(childType, options.useValidation)
    return `${serializationAnnotation}${validationAnnotation}    private ${fieldType} ${fieldName};`
  })

  const baseAnnotations = ['@Data']
  const builderAnnotation = options.generateBuilder ? ['@Builder'] : []
  const lombokAnnotations = [
    ...baseAnnotations,
    ...builderAnnotation,
    '@NoArgsConstructor',
    '@AllArgsConstructor',
  ]

  return `${lombokAnnotations.join('\n')}\npublic class ${typeInfo.name} {\n${fields.join('\n\n')}\n}`
}

// Generate Immutables interface definition
const generateImmutablesDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  if (!typeInfo.children) return ''
  const methods = Object.entries(typeInfo.children).map(([key, childType]) => {
    const fieldName = toCamelCase(key)
    const fieldType = buildFieldType(childType, options)
    const annotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
    return `${annotation}    ${fieldType} ${fieldName}();`
  })

  return `@Value.Immutable\npublic interface ${typeInfo.name} {\n${methods.join('\n\n')}\n}`
}

// Generate equals/hashCode methods for POJO
const generateEqualsHashCode = (typeName: string, fieldNames: string[]): string[] => {
  const equalsMethod = `    @Override\n    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ${typeName} that = (${typeName}) o;
        return ${fieldNames.map(f => `Objects.equals(${f}, that.${f})`).join(' &&\n               ')};
    }`
  const hashCodeMethod = `    @Override\n    public int hashCode() {
        return Objects.hash(${fieldNames.join(', ')});
    }`
  return ['', equalsMethod, hashCodeMethod]
}

// Generate POJO class definition
const generatePojoDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  if (!typeInfo.children) return ''
  const entries = Object.entries(typeInfo.children)

  const fields = entries.map(([key, childType]) => {
    const fieldName = toCamelCase(key)
    const fieldType = buildFieldType(childType, options)
    const serializationAnnotation = getFieldAnnotation(key, fieldName, options.serializationLibrary)
    const validationAnnotation = getValidationAnnotation(childType, options.useValidation)
    return `${serializationAnnotation}${validationAnnotation}    private ${fieldType} ${fieldName};`
  })

  const gettersSetters = entries.flatMap(([key, childType]) => {
    const fieldName = toCamelCase(key)
    const fieldType = buildFieldType(childType, options)
    const capitalizedName = toPascalCase(fieldName)
    const getter = `    public ${fieldType} get${capitalizedName}() {\n        return ${fieldName};\n    }`
    const setter = `    public void set${capitalizedName}(${fieldType} ${fieldName}) {\n        this.${fieldName} = ${fieldName};\n    }`
    return [getter, setter]
  })

  const fieldNames = entries.map(([key]) => toCamelCase(key))
  const equalsHashCode = options.generateEquals
    ? generateEqualsHashCode(typeInfo.name, fieldNames)
    : []

  const members = [...fields, '', ...gettersSetters, ...equalsHashCode]

  return `public class ${typeInfo.name} {\n${members.join('\n')}\n}`
}

// Generate a single Java class definition
const generateClassDefinition = (typeInfo: TypeInfo, options: JavaOptions): string => {
  if (!typeInfo.isObject || !typeInfo.children) return ''

  switch (options.classStyle) {
    case 'record':
      return generateRecordDefinition(typeInfo, options)
    case 'lombok':
      return generateLombokDefinition(typeInfo, options)
    case 'immutables':
      return generateImmutablesDefinition(typeInfo, options)
    default:
      return generatePojoDefinition(typeInfo, options)
  }
}

export const javaGenerator: CodeGenerator<JavaOptions> = {
  generate(data: unknown, options: JavaOptions): string {
    const rootType = inferType(data as JsonValue, options.rootName)
    const classes = generateWithNestedTypes(rootType, typeInfo =>
      generateClassDefinition(typeInfo, options),
    )

    // Build imports
    const imports: string[] = []
    if (options.packageName) {
      imports.push(`package ${options.packageName};`)
      imports.push('')
    }

    imports.push('import java.util.List;')

    if (options.useOptional && options.optionalProperties) {
      imports.push('import java.util.Optional;')
    }

    if (options.generateEquals && options.classStyle === 'pojo') {
      imports.push('import java.util.Objects;')
    }

    // Serialization library imports
    switch (options.serializationLibrary) {
      case 'jackson':
        imports.push('import com.fasterxml.jackson.annotation.JsonProperty;')
        break
      case 'gson':
        imports.push('import com.google.gson.annotations.SerializedName;')
        break
      case 'moshi':
        imports.push('import com.squareup.moshi.Json;')
        break
    }

    // Lombok imports
    if (options.classStyle === 'lombok') {
      imports.push('import lombok.Data;')
      imports.push('import lombok.NoArgsConstructor;')
      imports.push('import lombok.AllArgsConstructor;')
      if (options.generateBuilder) {
        imports.push('import lombok.Builder;')
      }
    }

    // Immutables imports
    if (options.classStyle === 'immutables') {
      imports.push('import org.immutables.value.Value;')
    }

    // Validation imports
    if (options.useValidation) {
      imports.push('import javax.validation.constraints.NotNull;')
      imports.push('import javax.validation.constraints.NotBlank;')
    }

    return imports.join('\n') + '\n\n' + classes.filter(Boolean).join('\n\n')
  },

  getDefaultOptions(): JavaOptions {
    return { ...defaultJavaOptions }
  },
}

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
