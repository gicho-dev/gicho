import { findFile } from '../fs'
import { LOCK_FILES, PACKAGE_JSON_FILE } from './package'

export const WORKSPACE_FILES = ['pnpm-workspace.yaml', 'turbo.json', 'lerna.json', 'rush.json']

/**
 * Detects the root path of the workspace from a given directory.
 */
export function detectWorkspaceRoot(from: string): string {
	const testPaths = [WORKSPACE_FILES, LOCK_FILES, PACKAGE_JSON_FILE]

	for (const path of testPaths) {
		try {
			const detected = findFile(path, { from })
			if (detected) return detected
		} catch {}
	}

	throw new Error(`Cannot detect workspace root from ${from}`)
}
