/**
 * Determines whether the current environment is a CI server.
 */
export const isCI = (): boolean => process.env.CI === 'true'

/**
 * Determines whether the current environment is Windows.
 */
export const isWindows = process.platform.startsWith('win')
