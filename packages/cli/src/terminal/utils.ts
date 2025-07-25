import type { Writable } from 'node:stream'

import { WriteStream } from 'node:tty'
import { stripVTControlCharacters } from 'node:util'
import { getStringWidth } from '@gicho/core/string'

/** Returns the number of columns of the given output. */
export function getColumns(output: Writable, defaultColumns: number = 80): number {
	return output instanceof WriteStream ? (output.columns ?? defaultColumns) : defaultColumns
}

/**
 * Returns the number of visual (wrapped) lines for the given string and terminal width (columns).
 */
export function getWrappedLineCount(str: string, columns: number): number {
	let len = 0
	for (const line of str.split('\n')) {
		const width = getStringWidth(stripVTControlCharacters(line))
		len += width > columns ? Math.ceil(width / columns) : 1
	}
	return len
}
