import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'

import { resolve } from '../path'

export const exists = existsSync
export const mkdir = mkdirSync

/**
 * Ensure that a directory exists; create if missing.
 */
export function ensureDir(path: string): void {
	if (!exists(path)) mkdir(path, { recursive: true })
}

/**
 * Read a file as a string.
 */
export function readText(path: string, encoding: BufferEncoding = 'utf8'): string {
	return readFileSync(path, encoding)
}

/**
 * Remove given paths asynchronously.
 */
export async function removePaths(paths: string[]): Promise<PromiseSettledResult<void>[]> {
	return await Promise.allSettled(
		paths.map((path) => rm(resolve(path), { force: true, recursive: true })),
	)
}

/**
 * Remove given paths synchronously.
 */
export function removePathsSync(paths: string[]): void {
	paths.forEach((path) => rmSync(resolve(path), { force: true, recursive: true }))
}
