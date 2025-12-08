import { ref, computed, reactive, type Ref } from 'vue'
import {
  generateCode,
  getDefaultOptions,
  downloadCodeAsFile,
  LANGUAGE_INFO,
  LANGUAGE_OPTIONS,
  type TargetLanguage,
  type AllLanguageOptions,
  type TypeScriptOptions,
  type JavaScriptOptions,
  type GoOptions,
  type PythonOptions,
  type RustOptions,
  type JavaOptions,
  type CSharpOptions,
  type KotlinOptions,
  type SwiftOptions,
  type PhpOptions,
  type LanguageConfig,
  type OptionsForLanguage,
  generateCodeFromConfig,
  isOptionsForLanguage,
} from './codeGenerators'

// Re-export types for external use
export {
  generateCode,
  downloadCodeAsFile,
  getDefaultOptions,
  LANGUAGE_INFO,
  LANGUAGE_OPTIONS,
  // Type-safe APIs
  generateCodeFromConfig,
  isOptionsForLanguage,
  type TargetLanguage,
  type AllLanguageOptions,
  type TypeScriptOptions,
  type JavaScriptOptions,
  type GoOptions,
  type PythonOptions,
  type RustOptions,
  type JavaOptions,
  type CSharpOptions,
  type KotlinOptions,
  type SwiftOptions,
  type PhpOptions,
  // Discriminated union types
  type LanguageConfig,
  type OptionsForLanguage,
}

// Re-export language option definitions for UI
export { JAVA_CLASS_STYLE_OPTIONS, JAVA_SERIALIZATION_OPTIONS } from './codeGenerators/java'
export { KOTLIN_SERIALIZATION_OPTIONS } from './codeGenerators/kotlin'
export { PYTHON_STYLE_OPTIONS } from './codeGenerators/types'

// Unified options type for backward compatibility with templates
// This combines all possible options into a single interface
export interface CodeGeneratorOptions {
  // Base options (all languages)
  rootName: string
  optionalProperties: boolean
  // TypeScript
  useInterface: boolean
  useExport: boolean
  useReadonly: boolean
  strictNullChecks: boolean
  // JavaScript
  useClass: boolean
  useJSDoc: boolean
  useES6: boolean
  generateFactory: boolean
  generateValidator: boolean
  // Go
  usePointers: boolean
  omitEmpty: boolean
  useJsonTag: boolean
  // Python
  pythonStyle: 'dataclass' | 'typeddict'
  useFrozen: boolean
  useSlots: boolean
  useKwOnly: boolean
  useTotal: boolean
  // Rust
  deriveSerde: boolean
  deriveDebug: boolean
  deriveClone: boolean
  deriveDefault: boolean
  useBox: boolean
  // Java
  packageName: string
  classStyle: 'record' | 'pojo' | 'lombok' | 'immutables'
  serializationLibrary: 'none' | 'jackson' | 'gson' | 'moshi'
  useValidation: boolean
  generateBuilder: boolean
  generateEquals: boolean
  useOptional: boolean
  // C#
  useRecords: boolean
  useNullableReferenceTypes: boolean
  useSystemTextJson: boolean
  useNewtonsoft: boolean
  generateDataContract: boolean
  // Kotlin
  useDataClass: boolean
  kotlinSerializationLibrary: 'none' | 'kotlinx' | 'gson' | 'moshi' | 'jackson'
  useDefaultValues: boolean
  // Swift
  useStruct: boolean
  useCodingKeys: boolean
  useOptionalProperties: boolean
  // PHP
  useStrictTypes: boolean
  useReadonlyProperties: boolean
  useConstructorPromotion: boolean
  namespace: string
  // Legacy compatibility
  useLombok: boolean
}

// Default unified options
const getDefaultUnifiedOptions = (): CodeGeneratorOptions => ({
  // Base
  rootName: 'Root',
  optionalProperties: false,
  // TypeScript
  useInterface: true,
  useExport: true,
  useReadonly: false,
  strictNullChecks: true,
  // JavaScript
  useClass: true,
  useJSDoc: true,
  useES6: true,
  generateFactory: false,
  generateValidator: false,
  // Go
  usePointers: false,
  omitEmpty: true,
  useJsonTag: true,
  // Python
  pythonStyle: 'dataclass',
  useFrozen: false,
  useSlots: false,
  useKwOnly: false,
  useTotal: true,
  // Rust
  deriveSerde: true,
  deriveDebug: true,
  deriveClone: true,
  deriveDefault: false,
  useBox: false,
  // Java
  packageName: 'com.example',
  classStyle: 'record',
  serializationLibrary: 'none',
  useValidation: false,
  generateBuilder: false,
  generateEquals: true,
  useOptional: false,
  // C#
  useRecords: true,
  useNullableReferenceTypes: true,
  useSystemTextJson: true,
  useNewtonsoft: false,
  generateDataContract: false,
  // Kotlin
  useDataClass: true,
  kotlinSerializationLibrary: 'none',
  useDefaultValues: false,
  // Swift
  useStruct: true,
  useCodingKeys: true,
  useOptionalProperties: false,
  // PHP
  useStrictTypes: true,
  useReadonlyProperties: false,
  useConstructorPromotion: true,
  namespace: '',
  // Legacy
  useLombok: false,
})

// Convert unified options to language-specific options
const toLanguageOptions = (
  language: TargetLanguage,
  options: CodeGeneratorOptions,
): AllLanguageOptions => {
  const base = { rootName: options.rootName, optionalProperties: options.optionalProperties }

  switch (language) {
    case 'typescript':
      return {
        ...base,
        useInterface: options.useInterface,
        useExport: options.useExport,
        useReadonly: options.useReadonly,
        strictNullChecks: options.strictNullChecks,
      } as TypeScriptOptions
    case 'javascript':
      return {
        ...base,
        useClass: options.useClass,
        useJSDoc: options.useJSDoc,
        useES6: options.useES6,
        generateFactory: options.generateFactory,
        generateValidator: options.generateValidator,
      } as JavaScriptOptions
    case 'go':
      return {
        ...base,
        usePointers: options.usePointers,
        omitEmpty: options.omitEmpty,
        useJsonTag: options.useJsonTag,
      } as GoOptions
    case 'python':
      return {
        ...base,
        style: options.pythonStyle,
        useFrozen: options.useFrozen,
        useSlots: options.useSlots,
        useKwOnly: options.useKwOnly,
        useTotal: options.useTotal,
      } as PythonOptions
    case 'rust':
      return {
        ...base,
        deriveSerde: options.deriveSerde,
        deriveDebug: options.deriveDebug,
        deriveClone: options.deriveClone,
        deriveDefault: options.deriveDefault,
        useBox: options.useBox,
      } as RustOptions
    case 'java':
      return {
        ...base,
        packageName: options.packageName,
        classStyle: options.classStyle,
        serializationLibrary: options.serializationLibrary,
        useValidation: options.useValidation,
        generateBuilder: options.generateBuilder,
        generateEquals: options.generateEquals,
        useOptional: options.useOptional,
      } as JavaOptions
    case 'csharp':
      return {
        ...base,
        useRecords: options.useRecords,
        useNullableReferenceTypes: options.useNullableReferenceTypes,
        useSystemTextJson: options.useSystemTextJson,
        useNewtonsoft: options.useNewtonsoft,
        generateDataContract: options.generateDataContract,
      } as CSharpOptions
    case 'kotlin':
      return {
        ...base,
        useDataClass: options.useDataClass,
        serializationLibrary: options.kotlinSerializationLibrary,
        useDefaultValues: options.useDefaultValues,
      } as KotlinOptions
    case 'swift':
      return {
        ...base,
        useStruct: options.useStruct,
        useCodingKeys: options.useCodingKeys,
        useOptionalProperties: options.useOptionalProperties,
      } as SwiftOptions
    case 'php':
      return {
        ...base,
        useStrictTypes: options.useStrictTypes,
        useReadonlyProperties: options.useReadonlyProperties,
        useConstructorPromotion: options.useConstructorPromotion,
        namespace: options.namespace,
      } as PhpOptions
  }
}

// Composable for code generation
export const useCodeGenerator = (jsonInput: Ref<string>) => {
  const language = ref<TargetLanguage>('typescript')
  const options = reactive<CodeGeneratorOptions>(getDefaultUnifiedOptions())
  const error = ref<string | null>(null)

  // Generated code
  const generatedCode = computed(() => {
    error.value = null

    if (!jsonInput.value.trim()) {
      return ''
    }

    try {
      const parsed = JSON.parse(jsonInput.value) as unknown
      const langOptions = toLanguageOptions(language.value, options)
      return generateCode(parsed, language.value, langOptions)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse JSON'
      return ''
    }
  })

  // Selected language info
  const selectedLanguageInfo = computed(() => LANGUAGE_INFO[language.value])

  // Editor mode for syntax highlighting
  const editorMode = computed(() => selectedLanguageInfo.value.editorMode)

  // Reset options to defaults
  const resetOptions = () => {
    Object.assign(options, getDefaultUnifiedOptions())
  }

  return {
    // State
    language,
    options,
    error,

    // Computed
    generatedCode,
    selectedLanguageInfo,
    editorMode,

    // Actions
    resetOptions,

    // Constants
    LANGUAGE_OPTIONS,
  }
}
