export type FormatOption = {
  readonly text: string
  readonly value: string
}

export const FORMAT_OPTIONS = [
  { text: '2 Spaces', value: '  ' },
  { text: '4 Spaces', value: '    ' },
  { text: '1 Tab', value: '\t' },
  { text: 'Compact', value: '' },
] satisfies FormatOption[]

export const DEFAULT_FORMAT_OPTION = FORMAT_OPTIONS[0]!.value
