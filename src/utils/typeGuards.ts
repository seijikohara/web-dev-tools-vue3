/**
 * Return whether a value is a non-null object whose properties can be read by string key.
 *
 * Arrays also match, which mirrors the `typeof value === 'object' && value !== null` checks
 * that this guard replaces.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
