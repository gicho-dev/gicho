import { sep } from 'node:path'

import { isUnicodeSupported } from '../../terminal'

/* ----------------------------------------
 *   Constants
 * ------------------------------------- */

export const cancelSymbol = Symbol('prompt.cancel')
export type CancelSymbol = typeof cancelSymbol

/* ----------------------------------------
 *   Internal functions
 * ------------------------------------- */

export function getCurrentStackTrace(): string[] {
	const cwd = process.cwd() + sep

	// this is not error, just use stack method.
	const stack = new Error().stack ?? ''

	return stack
		.split('\n')
		.slice(1) // first line is "Error" string, so exclude it.
		.map((l) => l.trim().replace('file://', '').replace(cwd, ''))
}

export const unicodeOr = <T>(value: T, fallback: T): T => (isUnicodeSupported ? value : fallback)
