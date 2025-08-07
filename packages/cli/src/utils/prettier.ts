import { exec } from './exec'

/**
 * Format a file with Prettier.
 *
 * Use case:
 * - scripts to generate code.
 * @internal
 */
export async function formatFileWithPrettier(path: string): Promise<string> {
	return (await exec(`prettier --write "${path}"`)).stdout.toString()
}
