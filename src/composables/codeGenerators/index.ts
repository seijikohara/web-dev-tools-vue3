// Export types
export * from './types'
export * from './utils'

// Export generators
export { typeScriptGenerator, defaultTypeScriptOptions } from './typescript'
export { javaScriptGenerator, defaultJavaScriptOptions } from './javascript'
export { goGenerator, defaultGoOptions } from './go'
export {
  pythonGenerator,
  pythonDataclassGenerator,
  pythonTypedDictGenerator,
  defaultPythonOptions,
  defaultPythonDataclassOptions,
  defaultPythonTypedDictOptions,
} from './python'
export { rustGenerator, defaultRustOptions } from './rust'
export {
  javaGenerator,
  defaultJavaOptions,
  JAVA_CLASS_STYLE_OPTIONS,
  JAVA_SERIALIZATION_OPTIONS,
} from './java'
export { csharpGenerator, defaultCSharpOptions } from './csharp'
export { kotlinGenerator, defaultKotlinOptions, KOTLIN_SERIALIZATION_OPTIONS } from './kotlin'
export { swiftGenerator, defaultSwiftOptions } from './swift'
export { phpGenerator, defaultPhpOptions } from './php'

// Import types for the unified API
import type {
  TargetLanguage,
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
} from './types'

import { typeScriptGenerator, defaultTypeScriptOptions } from './typescript'
import { javaScriptGenerator, defaultJavaScriptOptions } from './javascript'
import { goGenerator, defaultGoOptions } from './go'
import { pythonGenerator, defaultPythonOptions } from './python'
import { rustGenerator, defaultRustOptions } from './rust'
import { javaGenerator, defaultJavaOptions } from './java'
import { csharpGenerator, defaultCSharpOptions } from './csharp'
import { kotlinGenerator, defaultKotlinOptions } from './kotlin'
import { swiftGenerator, defaultSwiftOptions } from './swift'
import { phpGenerator, defaultPhpOptions } from './php'

// All options type union
export type AllLanguageOptions =
  | TypeScriptOptions
  | JavaScriptOptions
  | GoOptions
  | PythonOptions
  | RustOptions
  | JavaOptions
  | CSharpOptions
  | KotlinOptions
  | SwiftOptions
  | PhpOptions

/**
 * Type-safe language configuration using discriminated unions
 * This ensures that the options type matches the language type at compile time
 */
export type LanguageConfig =
  | { language: 'typescript'; options: TypeScriptOptions }
  | { language: 'javascript'; options: JavaScriptOptions }
  | { language: 'go'; options: GoOptions }
  | { language: 'python'; options: PythonOptions }
  | { language: 'rust'; options: RustOptions }
  | { language: 'java'; options: JavaOptions }
  | { language: 'csharp'; options: CSharpOptions }
  | { language: 'kotlin'; options: KotlinOptions }
  | { language: 'swift'; options: SwiftOptions }
  | { language: 'php'; options: PhpOptions }

/**
 * Helper type to extract options type for a specific language
 */
export type OptionsForLanguage<L extends TargetLanguage> = Extract<
  LanguageConfig,
  { language: L }
>['options']

/**
 * Type guard to check if options match the expected language
 */
export const isOptionsForLanguage = <L extends TargetLanguage>(
  _language: L,
  options: AllLanguageOptions,
): options is OptionsForLanguage<L> => {
  // Runtime check - options should have the base properties
  // The language parameter is used only for type inference
  return 'rootName' in options && typeof options.rootName === 'string'
}

/**
 * Get default options for a language (type-safe overloads)
 */
export function getDefaultOptions(language: 'typescript'): TypeScriptOptions
export function getDefaultOptions(language: 'javascript'): JavaScriptOptions
export function getDefaultOptions(language: 'go'): GoOptions
export function getDefaultOptions(language: 'python'): PythonOptions
export function getDefaultOptions(language: 'rust'): RustOptions
export function getDefaultOptions(language: 'java'): JavaOptions
export function getDefaultOptions(language: 'csharp'): CSharpOptions
export function getDefaultOptions(language: 'kotlin'): KotlinOptions
export function getDefaultOptions(language: 'swift'): SwiftOptions
export function getDefaultOptions(language: 'php'): PhpOptions
export function getDefaultOptions(language: TargetLanguage): AllLanguageOptions
export function getDefaultOptions(language: TargetLanguage): AllLanguageOptions {
  switch (language) {
    case 'typescript':
      return { ...defaultTypeScriptOptions }
    case 'javascript':
      return { ...defaultJavaScriptOptions }
    case 'go':
      return { ...defaultGoOptions }
    case 'python':
      return { ...defaultPythonOptions }
    case 'rust':
      return { ...defaultRustOptions }
    case 'java':
      return { ...defaultJavaOptions }
    case 'csharp':
      return { ...defaultCSharpOptions }
    case 'kotlin':
      return { ...defaultKotlinOptions }
    case 'swift':
      return { ...defaultSwiftOptions }
    case 'php':
      return { ...defaultPhpOptions }
  }
}

/**
 * Generate code for any language (type-safe overloads)
 */
export function generateCode(
  data: unknown,
  language: 'typescript',
  options: TypeScriptOptions,
): string
export function generateCode(
  data: unknown,
  language: 'javascript',
  options: JavaScriptOptions,
): string
export function generateCode(data: unknown, language: 'go', options: GoOptions): string
export function generateCode(data: unknown, language: 'python', options: PythonOptions): string
export function generateCode(data: unknown, language: 'rust', options: RustOptions): string
export function generateCode(data: unknown, language: 'java', options: JavaOptions): string
export function generateCode(data: unknown, language: 'csharp', options: CSharpOptions): string
export function generateCode(data: unknown, language: 'kotlin', options: KotlinOptions): string
export function generateCode(data: unknown, language: 'swift', options: SwiftOptions): string
export function generateCode(data: unknown, language: 'php', options: PhpOptions): string
export function generateCode(
  data: unknown,
  language: TargetLanguage,
  options: AllLanguageOptions,
): string
export function generateCode(
  data: unknown,
  language: TargetLanguage,
  options: AllLanguageOptions,
): string {
  switch (language) {
    case 'typescript':
      return typeScriptGenerator.generate(data, options as TypeScriptOptions)
    case 'javascript':
      return javaScriptGenerator.generate(data, options as JavaScriptOptions)
    case 'go':
      return goGenerator.generate(data, options as GoOptions)
    case 'python':
      return pythonGenerator.generate(data, options as PythonOptions)
    case 'rust':
      return rustGenerator.generate(data, options as RustOptions)
    case 'java':
      return javaGenerator.generate(data, options as JavaOptions)
    case 'csharp':
      return csharpGenerator.generate(data, options as CSharpOptions)
    case 'kotlin':
      return kotlinGenerator.generate(data, options as KotlinOptions)
    case 'swift':
      return swiftGenerator.generate(data, options as SwiftOptions)
    case 'php':
      return phpGenerator.generate(data, options as PhpOptions)
  }
}

/**
 * Type-safe code generation using discriminated union config
 * This is the preferred way to generate code when you have a LanguageConfig
 */
export const generateCodeFromConfig = (data: unknown, config: LanguageConfig): string => {
  return generateCode(data, config.language, config.options)
}

// Download code as file
export const downloadCodeAsFile = (code: string, rootName: string, extension: string): void => {
  if (!code) return

  const blob = new Blob([code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${rootName.toLowerCase()}.${extension}`
  link.click()
  URL.revokeObjectURL(url)
}
