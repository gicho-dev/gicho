import { execSync } from './exec'

/**
 * Format a file with Prettier.
 *
 * Use case:
 * - scripts to generate code.
 * @internal
 */
export function formatFileWithPrettier(path: string): string {
	return execSync(`prettier --write "${path}"`)
}
