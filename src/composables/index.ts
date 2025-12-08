// Utility composables
export { useClipboardToast } from './useClipboardToast'
export {
  useAsyncOperation,
  useMultipleAsyncOperations,
  type AsyncOperationOptions,
  type UseAsyncOperationReturn,
} from './useAsyncOperation'

// Tool-specific composables
export { useBase64Encoder } from './useBase64Encoder'
export { useIpLookup, DNS_TYPE_OPTIONS, SAMPLE_LOOKUPS } from './useIpLookup'
export { useBcryptGenerator } from './useBcryptGenerator'
export { useCodeGenerator } from './useCodeGenerator'
export { useColorConverter } from './useColorConverter'
export { useCronBuilder } from './useCronBuilder'
export { useCurlBuilder } from './useCurlBuilder'
export { useDiffCalculator } from './useDiffCalculator'
export { useFormatters } from './useFormatters'
export { useHashGenerator } from './useHashGenerator'
export { useHtmlEntities } from './useHtmlEntities'
export { useJwtDecoder } from './useJwtDecoder'
export { usePasswordGenerator } from './usePasswordGenerator'
export { useRegexTester } from './useRegexTester'
export { useRegexVisualizer } from './useRegexVisualizer'
export { useStringCaseConverter } from './useStringCaseConverter'
export { useTimestampConverter } from './useTimestampConverter'
export { useUrlEncoder } from './useUrlEncoder'
export { useUuidGenerator } from './useUuidGenerator'

// Re-export types from useCodeGenerator
export type {
  TargetLanguage,
  AllLanguageOptions,
  TypeScriptOptions,
  JavaScriptOptions,
  GoOptions,
  PythonOptions,
  RustOptions,
  JavaOptions,
  CSharpOptions,
  KotlinOptions,
  SwiftOptions,
  PhpOptions,
  CodeGeneratorOptions,
} from './useCodeGenerator'

// Re-export code generation utilities
export {
  generateCode,
  downloadCodeAsFile,
  getDefaultOptions,
  LANGUAGE_INFO,
  LANGUAGE_OPTIONS,
  JAVA_CLASS_STYLE_OPTIONS,
  JAVA_SERIALIZATION_OPTIONS,
  KOTLIN_SERIALIZATION_OPTIONS,
  PYTHON_STYLE_OPTIONS,
} from './useCodeGenerator'
