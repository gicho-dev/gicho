import type { Key } from 'node:readline'

import type { AnyTerminal } from './types'

import { sep } from 'node:path'
import { createInterface, emitKeypressEvents } from 'node:readline'
import { ReadStream } from 'node:tty'

import { isWindows } from '../env'

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

export const SYMBOLS = {
	PROMPT_CANCELED: Symbol('prompt.canceled'),
}

/* ----------------------------------------
 *   Functions
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

/* ----------------------------------------
 *   Block Input
 * ------------------------------------- */

export interface BlockInputOptions {
	term: AnyTerminal
}

/**
 * Block the input of the terminal, and return a function to unblock the input.
 *
 * @example
 * ```
 * const unblock = blockInput({ term })
 * unblock()
 * ```
 */
export function blockInput({ term }: BlockInputOptions): () => void {
	const { input } = term
	const rl = createInterface({ input, tabSize: 1 })
	emitKeypressEvents(input, rl)

	if (input instanceof ReadStream && input.isTTY) input.setRawMode(true)

	const clear = (char: string | undefined, { name, sequence }: Key): void => {
		const action = term._P.getMatchedAction([char, name, sequence])
		if (action === 'cancel') {
			term.cursorShow()
			process.exit(0)
		}

		// const dx = name === 'return' ? 0 : -1
		// const dy = name === 'return' ? 0 : 0
		// term.cursorMove(dx, dy)
		// term.clearLine(1)

		input.once('keypress', clear)
	}

	term.cursorHide()
	input.once('keypress', clear)

	return () => {
		input.off('keypress', clear)
		term.cursorShow()

		// Prevent Windows specific issue
		if (input instanceof ReadStream && input.isTTY && !isWindows) input.setRawMode(false)

		// @ts-expect-error: fix for https://github.com/nodejs/node/issues/31762#issuecomment-1441223907
		rl.terminal = false
		rl.close()
	}
}
