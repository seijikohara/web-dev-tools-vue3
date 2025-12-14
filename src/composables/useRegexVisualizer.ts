import { computed, type Ref } from 'vue'
import * as regexpTree from 'regexp-tree'
import type {
  AstRegExp,
  Expression,
  Char,
  CharacterClass,
  ClassRange,
  Alternative,
  Disjunction,
  Group,
  Repetition,
  Quantifier,
  Assertion,
  Backreference,
} from 'regexp-tree/ast'

// SVG rendering constants
const CONFIG = {
  CHAR_WIDTH: 10,
  CHAR_HEIGHT: 24,
  PADDING: 8,
  CORNER_RADIUS: 4,
  LINE_HEIGHT: 30,
  CONNECTOR_LENGTH: 16,
  BRANCH_GAP: 20,
  STROKE_WIDTH: 2,
  FONT_SIZE: 14,
  FONT_FAMILY: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
} as const satisfies Record<string, number | string>

interface BoundingBox {
  width: number
  height: number
}

interface RenderResult {
  svg: string
  box: BoundingBox
}

interface ColorScheme {
  fill: string
  stroke: string
  text: string
}

// Color scheme for different node types
const COLORS = {
  char: { fill: '#e8f5e9', stroke: '#4caf50', text: '#1b5e20' },
  charClass: { fill: '#e3f2fd', stroke: '#2196f3', text: '#0d47a1' },
  group: { fill: '#fff3e0', stroke: '#ff9800', text: '#e65100' },
  quantifier: { fill: '#fce4ec', stroke: '#e91e63', text: '#880e4f' },
  assertion: { fill: '#f3e5f5', stroke: '#9c27b0', text: '#4a148c' },
  backreference: { fill: '#e0f7fa', stroke: '#00bcd4', text: '#006064' },
  meta: { fill: '#fff9c4', stroke: '#ffc107', text: '#ff6f00' },
  connector: '#666',
  background: '#fafafa',
} as const satisfies Record<string, ColorScheme | string>

/**
 * Pure function: Escape HTML special characters
 */
const escapeHtml = (str: string): string =>
  [
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#039;'],
  ].reduce((acc, [char, entity]) => {
    if (!char || !entity) return acc
    return acc.replace(new RegExp(char, 'g'), entity)
  }, str)

/**
 * Pure function: Get character label for visualization
 */
const getCharLabel = (node: Char): string => {
  if (node.kind === 'simple') {
    return node.value === ' ' ? '␣' : node.value
  }

  const metaCharLabels: Record<string, string> = {
    '\\d': '[0-9]',
    '\\D': '[^0-9]',
    '\\w': '[a-zA-Z0-9_]',
    '\\W': '[^a-zA-Z0-9_]',
    '\\s': 'whitespace',
    '\\S': 'non-whitespace',
    '.': 'any char',
    '\\n': 'newline',
    '\\r': 'carriage return',
    '\\t': 'tab',
  }

  return metaCharLabels[node.value] ?? node.value
}

/**
 * Pure function: Get quantifier label for visualization
 */
const getQuantifierLabel = (q: Quantifier): string => {
  if (q.kind === 'Range') {
    if (q.to === undefined) {
      return q.from === 0 ? '0+' : `${q.from}+`
    }
    return q.from === q.to ? `exactly ${q.from}` : `${q.from}-${q.to}`
  }

  const quantifierLabels: Record<string, string> = {
    '*': '0+',
    '+': '1+',
    '?': '0-1',
  }

  return quantifierLabels[q.kind] ?? ''
}

const renderBox = (
  content: string,
  colors: { fill: string; stroke: string; text: string },
  x: number,
  y: number,
): RenderResult => {
  const textWidth = content.length * CONFIG.CHAR_WIDTH
  const boxWidth = textWidth + CONFIG.PADDING * 2
  const boxHeight = CONFIG.CHAR_HEIGHT + CONFIG.PADDING

  const svg = `
    <g transform="translate(${x}, ${y})">
      <rect
        x="0"
        y="${-boxHeight / 2}"
        width="${boxWidth}"
        height="${boxHeight}"
        rx="${CONFIG.CORNER_RADIUS}"
        ry="${CONFIG.CORNER_RADIUS}"
        fill="${colors.fill}"
        stroke="${colors.stroke}"
        stroke-width="${CONFIG.STROKE_WIDTH}"
      />
      <text
        x="${boxWidth / 2}"
        y="0"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="${CONFIG.FONT_FAMILY}"
        font-size="${CONFIG.FONT_SIZE}"
        fill="${colors.text}"
      >${escapeHtml(content)}</text>
    </g>
  `

  return { svg, box: { width: boxWidth, height: boxHeight } }
}

const renderConnector = (x1: number, y1: number, x2: number, y2: number): string =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />`

const renderChar = (node: Char, x: number, y: number): RenderResult => {
  const label = getCharLabel(node)
  const isMeta = node.kind !== 'simple'
  return renderBox(label, isMeta ? COLORS.meta : COLORS.char, x, y)
}

const renderClassRange = (range: ClassRange): string => {
  const from = range.from.value
  const to = range.to.value
  return `${from}-${to}`
}

const renderCharacterClass = (node: CharacterClass, x: number, y: number): RenderResult => {
  const parts = node.expressions.map(expr =>
    expr.type === 'ClassRange' ? renderClassRange(expr) : expr.value,
  )

  const content = `[${node.negative ? '^' : ''}${parts.join('')}]`
  return renderBox(content, COLORS.charClass, x, y)
}

/**
 * Pure function: Get assertion label for visualization
 */
const getAssertionLabel = (node: Assertion): string => {
  if (node.kind === 'Lookahead' || node.kind === 'Lookbehind') {
    const prefix = node.kind === 'Lookahead' ? '?=' : '?<='
    const negPrefix = node.kind === 'Lookahead' ? '?!' : '?<!'
    return `(${node.negative ? negPrefix : prefix}...)`
  }

  const assertionLabels: Record<string, string> = {
    '^': 'start',
    $: 'end',
    '\\b': 'word boundary',
    '\\B': 'non-word boundary',
  }

  return assertionLabels[node.kind] ?? node.kind
}

const renderAssertion = (node: Assertion, x: number, y: number): RenderResult => {
  const label = getAssertionLabel(node)
  return renderBox(label, COLORS.assertion, x, y)
}

const renderBackreference = (node: Backreference, x: number, y: number): RenderResult => {
  const label = node.kind === 'number' ? `\\${node.reference}` : `\\k<${node.reference}>`
  return renderBox(label, COLORS.backreference, x, y)
}

const renderExpression = (node: Expression | null, x: number, y: number): RenderResult => {
  if (!node) {
    return { svg: '', box: { width: 0, height: 0 } }
  }

  switch (node.type) {
    case 'Char':
      return renderChar(node, x, y)
    case 'CharacterClass':
      return renderCharacterClass(node, x, y)
    case 'Assertion':
      return renderAssertion(node, x, y)
    case 'Backreference':
      return renderBackreference(node, x, y)
    case 'Alternative':
      return renderAlternative(node, x, y)
    case 'Disjunction':
      return renderDisjunction(node, x, y)
    case 'Group':
      return renderGroup(node, x, y)
    case 'Repetition':
      return renderRepetition(node, x, y)
    default:
      return { svg: '', box: { width: 0, height: 0 } }
  }
}

const renderAlternative = (node: Alternative, x: number, y: number): RenderResult => {
  if (node.expressions.length === 0) {
    return { svg: '', box: { width: 0, height: 0 } }
  }

  const { svgParts, currentX, maxHeight } = node.expressions.reduce<{
    svgParts: readonly string[]
    currentX: number
    maxHeight: number
  }>(
    (acc, expr, i) => {
      const result = renderExpression(expr, acc.currentX, y)
      const newSvgParts =
        i < node.expressions.length - 1 && result.box.width > 0
          ? [
              ...acc.svgParts,
              result.svg,
              renderConnector(
                acc.currentX + result.box.width,
                y,
                acc.currentX + result.box.width + CONFIG.CONNECTOR_LENGTH,
                y,
              ),
            ]
          : [...acc.svgParts, result.svg]

      const newCurrentX =
        i < node.expressions.length - 1 && result.box.width > 0
          ? acc.currentX + result.box.width + CONFIG.CONNECTOR_LENGTH
          : acc.currentX + result.box.width

      return {
        svgParts: newSvgParts,
        currentX: newCurrentX,
        maxHeight: Math.max(acc.maxHeight, result.box.height),
      }
    },
    { svgParts: [] as readonly string[], currentX: x, maxHeight: 0 },
  )

  return {
    svg: svgParts.join('\n'),
    box: { width: currentX - x, height: maxHeight },
  }
}

const renderDisjunction = (node: Disjunction, x: number, y: number): RenderResult => {
  const leftResult = renderExpression(node.left, x + CONFIG.CONNECTOR_LENGTH, y - CONFIG.BRANCH_GAP)
  const rightResult = renderExpression(
    node.right,
    x + CONFIG.CONNECTOR_LENGTH,
    y + CONFIG.BRANCH_GAP,
  )

  const maxWidth = Math.max(leftResult.box.width, rightResult.box.width)
  const totalWidth = maxWidth + CONFIG.CONNECTOR_LENGTH * 2

  // Draw branching paths
  const startX = x
  const endX = x + totalWidth
  const topY = y - CONFIG.BRANCH_GAP
  const bottomY = y + CONFIG.BRANCH_GAP

  const paths = `
    <!-- Start node -->
    <circle cx="${startX}" cy="${y}" r="4" fill="${COLORS.connector}" />
    <!-- End node -->
    <circle cx="${endX}" cy="${y}" r="4" fill="${COLORS.connector}" />
    <!-- Top branch -->
    <path d="M ${startX} ${y} Q ${startX + 8} ${y} ${startX + 8} ${topY} L ${startX + CONFIG.CONNECTOR_LENGTH} ${topY}"
          fill="none" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
    <path d="M ${startX + CONFIG.CONNECTOR_LENGTH + leftResult.box.width} ${topY} L ${endX - 8} ${topY} Q ${endX - 8} ${y} ${endX} ${y}"
          fill="none" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
    <!-- Bottom branch -->
    <path d="M ${startX} ${y} Q ${startX + 8} ${y} ${startX + 8} ${bottomY} L ${startX + CONFIG.CONNECTOR_LENGTH} ${bottomY}"
          fill="none" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
    <path d="M ${startX + CONFIG.CONNECTOR_LENGTH + rightResult.box.width} ${bottomY} L ${endX - 8} ${bottomY} Q ${endX - 8} ${y} ${endX} ${y}"
          fill="none" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
  `

  const svg = `${paths}${leftResult.svg}${rightResult.svg}`

  return {
    svg,
    box: {
      width: totalWidth,
      height: CONFIG.BRANCH_GAP * 2 + Math.max(leftResult.box.height, rightResult.box.height),
    },
  }
}

const renderGroup = (node: Group, x: number, y: number): RenderResult => {
  const innerResult = renderExpression(node.expression, x + CONFIG.PADDING * 2, y)

  const groupWidth = innerResult.box.width + CONFIG.PADDING * 4
  const groupHeight = Math.max(innerResult.box.height, CONFIG.CHAR_HEIGHT) + CONFIG.PADDING * 2

  const label = !node.capturing
    ? 'non-capturing'
    : node.name
      ? `group #${node.number} "${node.name}"`
      : `group #${node.number}`

  const svg = `
    <g transform="translate(${x}, ${y})">
      <rect
        x="0"
        y="${-groupHeight / 2}"
        width="${groupWidth}"
        height="${groupHeight}"
        rx="${CONFIG.CORNER_RADIUS}"
        ry="${CONFIG.CORNER_RADIUS}"
        fill="none"
        stroke="${COLORS.group.stroke}"
        stroke-width="${CONFIG.STROKE_WIDTH}"
        stroke-dasharray="4,2"
      />
      <text
        x="${groupWidth / 2}"
        y="${-groupHeight / 2 - 4}"
        text-anchor="middle"
        font-family="${CONFIG.FONT_FAMILY}"
        font-size="${CONFIG.FONT_SIZE - 2}"
        fill="${COLORS.group.text}"
      >${escapeHtml(label)}</text>
    </g>
    ${innerResult.svg}
  `

  return { svg, box: { width: groupWidth, height: groupHeight } }
}

const renderRepetition = (node: Repetition, x: number, y: number): RenderResult => {
  const innerResult = renderExpression(node.expression, x, y)
  const quantLabel = getQuantifierLabel(node.quantifier)
  const greedyLabel = node.quantifier.greedy ? '' : ' (lazy)'

  const labelWidth = (quantLabel.length + greedyLabel.length) * (CONFIG.CHAR_WIDTH - 2)
  const totalWidth = Math.max(innerResult.box.width, labelWidth) + CONFIG.PADDING

  // Draw loop arrow for quantifier
  const loopY = y + innerResult.box.height / 2 + 8
  const loopSvg = `
    <g>
      ${innerResult.svg}
      <!-- Quantifier loop -->
      <path
        d="M ${x + 4} ${loopY}
           L ${x + totalWidth - 4} ${loopY}
           L ${x + totalWidth - 8} ${loopY - 4}
           M ${x + totalWidth - 4} ${loopY}
           L ${x + totalWidth - 8} ${loopY + 4}"
        fill="none"
        stroke="${COLORS.quantifier.stroke}"
        stroke-width="${CONFIG.STROKE_WIDTH - 0.5}"
      />
      <text
        x="${x + totalWidth / 2}"
        y="${loopY + 14}"
        text-anchor="middle"
        font-family="${CONFIG.FONT_FAMILY}"
        font-size="${CONFIG.FONT_SIZE - 2}"
        fill="${COLORS.quantifier.text}"
      >${escapeHtml(quantLabel)}${escapeHtml(greedyLabel)}</text>
    </g>
  `

  return {
    svg: loopSvg,
    box: { width: totalWidth, height: innerResult.box.height + 30 },
  }
}

const renderDiagram = (ast: AstRegExp): string => {
  if (!ast.body) {
    return '<svg><text x="10" y="20">Empty pattern</text></svg>'
  }

  const padding = 40
  const startX = padding + 20
  const startY = 100

  // Render the main expression
  const result = renderExpression(ast.body, startX, startY)

  // Calculate total dimensions
  const totalWidth = result.box.width + padding * 2 + 60
  const totalHeight = Math.max(result.box.height + padding * 2, 200)

  // Start and end markers
  const startMarker = `
    <g>
      <circle cx="${padding}" cy="${startY}" r="6" fill="${COLORS.connector}" />
      <line x1="${padding + 6}" y1="${startY}" x2="${startX}" y2="${startY}" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
    </g>
  `

  const endX = startX + result.box.width + CONFIG.CONNECTOR_LENGTH
  const endMarker = `
    <g>
      <line x1="${startX + result.box.width}" y1="${startY}" x2="${endX - 6}" y2="${startY}" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
      <circle cx="${endX}" cy="${startY}" r="6" fill="none" stroke="${COLORS.connector}" stroke-width="${CONFIG.STROKE_WIDTH}" />
      <circle cx="${endX}" cy="${startY}" r="3" fill="${COLORS.connector}" />
    </g>
  `

  // Flags display
  const flagsDisplay = ast.flags
    ? `<text x="${totalWidth - padding}" y="20" text-anchor="end" font-family="${CONFIG.FONT_FAMILY}" font-size="${CONFIG.FONT_SIZE}" fill="#666">flags: ${ast.flags}</text>`
    : ''

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
      <style>
        text { user-select: none; }
      </style>
      <rect width="100%" height="100%" fill="${COLORS.background}" />
      ${flagsDisplay}
      ${startMarker}
      ${result.svg}
      ${endMarker}
    </svg>
  `
}

interface ParseResult {
  ast: AstRegExp | null
  error: string | null
}

export const useRegexVisualizer = (pattern: Ref<string>, flags: Ref<string>) => {
  // Use a single computed that returns both the AST and any parse error
  // This avoids the anti-pattern of mutating refs inside computed
  const parseResult = computed<ParseResult>(() => {
    if (!pattern.value) {
      return { ast: null, error: null }
    }

    try {
      // Escape forward slashes in the pattern to avoid breaking the /pattern/flags format
      const escapedPattern = pattern.value.replace(/(?<!\\)\//g, '\\/')
      const regexString = `/${escapedPattern}/${flags.value}`
      const result = regexpTree.parse(regexString)
      return { ast: result, error: null }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to parse regex'
      return { ast: null, error: errorMessage }
    }
  })

  const ast = computed(() => parseResult.value.ast)
  const parseError = computed(() => parseResult.value.error)

  const svgDiagram = computed(() => {
    if (!ast.value) {
      return null
    }
    return renderDiagram(ast.value)
  })

  const astJson = computed(() => {
    if (!ast.value) {
      return null
    }
    return JSON.stringify(ast.value, null, 2)
  })

  return {
    ast,
    svgDiagram,
    astJson,
    parseError,
  }
}
