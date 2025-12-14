// Editor modes for code syntax highlighting
export type EditorMode =
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'scss'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'sql'
  | 'python'
  | 'java'
  | 'php'
  | 'ruby'
  | 'golang'
  | 'rust'
  | 'c_cpp'
  | 'csharp'
  | 'plain_text'

// JSON value type for type inference
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

// Type information extracted from JSON
export interface TypeInfo {
  name: string
  isArray: boolean
  isObject: boolean
  isPrimitive: boolean
  children?: Record<string, TypeInfo>
  arrayItemType?: TypeInfo
}

// Base options shared by all generators
export interface BaseGeneratorOptions {
  rootName: string
  optionalProperties: boolean
}

// TypeScript specific options
export interface TypeScriptOptions extends BaseGeneratorOptions {
  useInterface: boolean
  useExport: boolean
  useReadonly: boolean
  strictNullChecks: boolean
}

// JavaScript specific options
export interface JavaScriptOptions extends BaseGeneratorOptions {
  useClass: boolean
  useJSDoc: boolean
  useES6: boolean
  generateFactory: boolean
  generateValidator: boolean
}

// Go specific options
export interface GoOptions extends BaseGeneratorOptions {
  usePointers: boolean
  omitEmpty: boolean
  useJsonTag: boolean
}

// Python style type
export type PythonStyle = 'dataclass' | 'typeddict'

// Python specific options
export interface PythonOptions extends BaseGeneratorOptions {
  style: PythonStyle
  // dataclass options
  useFrozen: boolean
  useSlots: boolean
  useKwOnly: boolean
  // typeddict options
  useTotal: boolean
}

// Legacy type aliases for backward compatibility
export type PythonDataclassOptions = PythonOptions
export type PythonTypedDictOptions = PythonOptions

// Rust specific options
export interface RustOptions extends BaseGeneratorOptions {
  deriveSerde: boolean
  deriveDebug: boolean
  deriveClone: boolean
  deriveDefault: boolean
  useBox: boolean
}

// Java serialization library
export type JavaSerializationLibrary = 'none' | 'jackson' | 'gson' | 'moshi'

// Java class style
export type JavaClassStyle = 'record' | 'pojo' | 'lombok' | 'immutables'

// Java specific options
export interface JavaOptions extends BaseGeneratorOptions {
  packageName: string
  classStyle: JavaClassStyle
  serializationLibrary: JavaSerializationLibrary
  useValidation: boolean
  generateBuilder: boolean
  generateEquals: boolean
  useOptional: boolean
}

// C# specific options
export interface CSharpOptions extends BaseGeneratorOptions {
  useRecords: boolean
  useNullableReferenceTypes: boolean
  useSystemTextJson: boolean
  useNewtonsoft: boolean
  generateDataContract: boolean
}

// Kotlin specific options
export type KotlinSerializationLibrary = 'none' | 'kotlinx' | 'gson' | 'moshi' | 'jackson'

export interface KotlinOptions extends BaseGeneratorOptions {
  useDataClass: boolean
  serializationLibrary: KotlinSerializationLibrary
  useDefaultValues: boolean
}

// Swift specific options
export interface SwiftOptions extends BaseGeneratorOptions {
  useStruct: boolean
  useCodingKeys: boolean
  useOptionalProperties: boolean
}

// PHP specific options
export interface PhpOptions extends BaseGeneratorOptions {
  useStrictTypes: boolean
  useReadonlyProperties: boolean
  useConstructorPromotion: boolean
  namespace: string
}

// Union of all language options
export type LanguageOptions =
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

// Supported target languages
export type TargetLanguage = LanguageOptions['language']

// Language metadata for UI
export interface LanguageInfo {
  value: TargetLanguage
  label: string
  extension: string
  icon: string
  editorMode: EditorMode
}

// Code generator interface
export interface CodeGenerator<T extends BaseGeneratorOptions> {
  generate(data: unknown, options: T): string
  getDefaultOptions(): T
}

// Language option definitions for UI
export const LANGUAGE_INFO = {
  typescript: {
    value: 'typescript',
    label: 'TypeScript',
    extension: 'ts',
    icon: 'pi pi-code',
    editorMode: 'typescript',
  },
  javascript: {
    value: 'javascript',
    label: 'JavaScript',
    extension: 'js',
    icon: 'pi pi-code',
    editorMode: 'javascript',
  },
  go: {
    value: 'go',
    label: 'Go',
    extension: 'go',
    icon: 'pi pi-code',
    editorMode: 'plain_text',
  },
  python: {
    value: 'python',
    label: 'Python',
    extension: 'py',
    icon: 'pi pi-code',
    editorMode: 'python',
  },
  rust: {
    value: 'rust',
    label: 'Rust',
    extension: 'rs',
    icon: 'pi pi-code',
    editorMode: 'rust',
  },
  java: {
    value: 'java',
    label: 'Java',
    extension: 'java',
    icon: 'pi pi-code',
    editorMode: 'java',
  },
  csharp: {
    value: 'csharp',
    label: 'C#',
    extension: 'cs',
    icon: 'pi pi-code',
    editorMode: 'csharp',
  },
  kotlin: {
    value: 'kotlin',
    label: 'Kotlin',
    extension: 'kt',
    icon: 'pi pi-code',
    editorMode: 'plain_text',
  },
  swift: {
    value: 'swift',
    label: 'Swift',
    extension: 'swift',
    icon: 'pi pi-code',
    editorMode: 'plain_text',
  },
  php: {
    value: 'php',
    label: 'PHP',
    extension: 'php',
    icon: 'pi pi-code',
    editorMode: 'php',
  },
} as const satisfies Record<TargetLanguage, LanguageInfo>

export const LANGUAGE_OPTIONS = Object.values(LANGUAGE_INFO)

// Python style options for UI
export const PYTHON_STYLE_OPTIONS = [
  { value: 'dataclass', label: 'dataclass', description: '@dataclass decorator' },
  { value: 'typeddict', label: 'TypedDict', description: 'TypedDict class' },
] as const satisfies readonly { value: PythonStyle; label: string; description: string }[]
