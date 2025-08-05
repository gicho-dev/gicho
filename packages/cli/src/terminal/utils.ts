import type { Writable } from 'node:stream'

import { WriteStream } from 'node:tty'
import { stripVTControlCharacters } from 'node:util'
import { getStringWidth } from '@gicho/core/string'

/* ----------------------------------------
 *   Constants
 * ------------------------------------- */

/**
 * Returns whether the terminal supports unicode.
 */
export const isUnicodeSupported: boolean = (() => {
	// copied from https://github.com/sindresorhus/is-unicode-supported
	// by Sindre Sorhus, MIT License

	const { env } = process
	const { TERM, TERM_PROGRAM } = env

	if (process.platform !== 'win32') return TERM !== 'linux' // Linux console (kernel)

	return (
		Boolean(env.WT_SESSION) || // Windows Terminal
		Boolean(env.TERMINUS_SUBLIME) || // Terminus (<0.2.27)
		env.ConEmuTask === '{cmd::Cmder}' || // ConEmu and cmder
		TERM_PROGRAM === 'Terminus-Sublime' ||
		TERM_PROGRAM === 'vscode' ||
		TERM === 'xterm-256color' ||
		TERM === 'alacritty' ||
		TERM === 'rxvt-unicode' ||
		TERM === 'rxvt-unicode-256color' ||
		env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
	)
})()

/* ----------------------------------------
 *   Functions
 * ------------------------------------- */

/**
 * Returns the number of columns of the given output.
 */
export function getColumns(output: Writable, defaultColumns: number = 80): number {
	return output instanceof WriteStream ? (output.columns ?? defaultColumns) : defaultColumns
}

/**
 * Returns the number of rows of the given output.
 */
export function getRows(output: Writable, defaultRows: number = 10): number {
	return output instanceof WriteStream ? (output.rows ?? defaultRows) : defaultRows
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
