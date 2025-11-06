/**
 * Default ACE editor options
 */
export const DEFAULT_EDITOR_OPTIONS = {
  fontSize: 14,
  showPrintMargin: false,
  showGutter: true,
  highlightActiveLine: true,
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true,
  tabSize: 2,
  wrap: false,
} as const

/**
 * Available editor themes
 */
export const EDITOR_THEMES = [
  'monokai',
  'github',
  'tomorrow',
  'twilight',
  'xcode',
  'solarized_dark',
  'solarized_light',
] as const

/**
 * Available editor modes
 */
export const EDITOR_MODES = [
  'json',
  'javascript',
  'typescript',
  'html',
  'css',
  'scss',
  'xml',
  'yaml',
  'markdown',
  'sql',
  'python',
  'java',
  'php',
  'ruby',
  'golang',
  'rust',
  'c_cpp',
  'csharp',
  'plain_text',
] as const

export type EditorTheme = (typeof EDITOR_THEMES)[number]
export type EditorMode = (typeof EDITOR_MODES)[number]
