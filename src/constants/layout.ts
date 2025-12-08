/**
 * Layout constants shared between TypeScript and SCSS
 * These values are defined as CSS custom properties in src/assets/scss/_variables.scss
 * and can be accessed at runtime using getCSSLayoutVariable() function.
 */

/**
 * Static layout constants for SSR and build-time usage
 * These values should match the CSS custom properties defined in _variables.scss
 */
export const LAYOUT = {
  /** Mobile breakpoint in pixels */
  BREAKPOINT: 980,
  /** Sidebar width in pixels */
  SIDEBAR_WIDTH: 250,
  /** Collapsed sidebar width in pixels */
  SIDEBAR_COLLAPSED_WIDTH: 60,
  /** Topbar height in pixels */
  TOPBAR_HEIGHT: 70,
} as const

export type LayoutKey = keyof typeof LAYOUT

/**
 * Mapping of LAYOUT keys to CSS custom property names
 */
const CSS_VARIABLE_MAP: Record<LayoutKey, string> = {
  BREAKPOINT: '--layout-breakpoint',
  SIDEBAR_WIDTH: '--layout-sidebar-width',
  SIDEBAR_COLLAPSED_WIDTH: '--layout-sidebar-collapsed-width',
  TOPBAR_HEIGHT: '--layout-topbar-height',
}

/**
 * Get layout value from CSS custom property at runtime
 * Falls back to static LAYOUT constants if running in SSR or if CSS variable is not defined
 *
 * @param name - The layout constant key
 * @returns The layout value in pixels (without 'px' unit)
 *
 * @example
 * const breakpoint = getCSSLayoutVariable('BREAKPOINT') // 980
 */
export const getCSSLayoutVariable = (name: LayoutKey): number => {
  // Fallback to static value for SSR or build-time usage
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return LAYOUT[name]
  }

  try {
    const cssVarName = CSS_VARIABLE_MAP[name]
    const rootStyles = getComputedStyle(document.documentElement)
    const value = rootStyles.getPropertyValue(cssVarName).trim()

    if (!value) {
      console.warn(`CSS variable ${cssVarName} is not defined, using fallback value`)
      return LAYOUT[name]
    }

    // Parse value and remove 'px' unit
    const numericValue = Number.parseFloat(value)

    if (Number.isNaN(numericValue)) {
      console.warn(`Failed to parse CSS variable ${cssVarName}: ${value}, using fallback value`)
      return LAYOUT[name]
    }

    return numericValue
  } catch (error) {
    console.error(`Error reading CSS variable for ${name}:`, error)
    return LAYOUT[name]
  }
}
