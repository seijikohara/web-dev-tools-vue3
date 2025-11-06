/**
 * Common format options for code formatters (JSON, XML, etc.)
 */
export type FormatOption = {
  text: string
  value: string
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { text: '2 Spaces', value: '  ' },
  { text: '4 Spaces', value: '    ' },
  { text: '1 Tab', value: '\t' },
  { text: 'Compact', value: '' },
]

/**
 * Default format option (2 spaces)
 */
export const DEFAULT_FORMAT_OPTION = FORMAT_OPTIONS[0]!.value
