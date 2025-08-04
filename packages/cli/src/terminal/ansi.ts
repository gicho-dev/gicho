import color from 'ansis'

export {
	type AnsiColors as AnsiColor,
	type Ansis,
	default as ansis,
	type AnsiStyles as AnsiStyle,
} from 'ansis'

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

export type AnsiBasicColor = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
export type AnsiBrightColor = `${AnsiBasicColor}Bright`

export type AnsiBaseTextColor = 'black' | 'gray' | AnsiBasicColor | AnsiBrightColor
export type AnsiBaseBgColor = `bg${Capitalize<AnsiBaseTextColor>}`

/* ----------------------------------------
 *   Constants / Methods
 * ------------------------------------- */

const ESC = '\x1B'
const CSI = `${ESC}[`

const cursor = {
	/**
	 * Returns the ANSI sequence to move the cursor to the specified position.
	 * @param x - The column number.
	 * @param y - The line number.
	 */
	to: (x: number, y?: number) => (y == null ? cursor.column(x + 1) : `${CSI}${y + 1};${x + 1}H`),

	/**
	 * Returns the ANSI sequence to move the cursor relative to its current position.
	 * @param dx - The horizontal movement amount.
	 * @param dy - The vertical movement amount.
	 */
	move: (dx: number, dy: number) =>
		(dx < 0 ? cursor.left(-dx) : dx > 0 ? cursor.right(dx) : '') +
		(dy < 0 ? cursor.up(-dy) : dy > 0 ? cursor.down(dy) : ''),

	/** Returns the ANSI sequence to move the cursor up `n` lines. */
	up: (n: number = 1) => `${CSI}${n}A`,
	/** Returns the ANSI sequence to move the cursor down `n` lines. */
	down: (n: number = 1) => `${CSI}${n}B`,
	/** Returns the ANSI sequence to move the cursor right (forward) `n` columns. */
	right: (n: number = 1) => `${CSI}${n}C`,
	/** Returns the ANSI sequence to move the cursor left (backward) `n` columns. */
	left: (n: number = 1) => `${CSI}${n}D`,
	/** Returns the ANSI sequence to move the cursor to beginning of next line, `n` lines down. */
	nextLine: (n: number = 1) => `${CSI}${n}E`,
	/** Returns the ANSI sequence to move the cursor to beginning of previous line, `n` lines up. */
	prevLine: (n: number = 1) => `${CSI}${n}F`,

	/** Returns the ANSI sequence to move the cursor to the absolute column position. */
	column: (col: number = 1) => `${CSI}${col}G`,
	/** Returns the ANSI sequence to move the cursor to the beginning of the current line. */
	lineStart: () => `${CSI}G`,
	/** Returns the ANSI sequence to move the cursor to the end of the current line. */
	lineEnd: () => `${CSI}9999G`,

	/** Returns the ANSI sequence to hide the cursor. */
	hide: () => `${CSI}?25l`,
	/** Returns the ANSI sequence to show the cursor. */
	show: () => `${CSI}?25h`,

	/** Returns the ANSI sequence to save the current cursor position. */
	save: () => `${ESC}7`,
	/** Returns the ANSI sequence to restore the saved cursor position. */
	restore: () => `${ESC}8`,
}

const scroll = {
	/** Returns the ANSI sequence to scroll the screen up `n` lines. */
	up: (n: number = 1) => `${CSI}${n}S`,
	/** Returns the ANSI sequence to scroll the screen down `n` lines. */
	down: (n: number = 1) => `${CSI}${n}T`,
} as const

const erase = {
	/** Returns the ANSI sequence to erase the screen. */
	screen: () => `${CSI}2J`,
	/** Returns the ANSI sequence to erase from the cursor to the start of the screen. */
	up: () => `${CSI}1J`,
	/** Returns the ANSI sequence to erase from the cursor to the end of the screen. */
	down: () => `${CSI}J`,

	/** Returns the ANSI sequence to erase the current line. */
	line: () => `${CSI}2K`,
	/** Returns the ANSI sequence to erase from the cursor to the start of the current line. */
	lineStart: () => `${CSI}1K`,
	/** Returns the ANSI sequence to erase from the cursor to the end of the current line. */
	lineEnd: () => `${CSI}K`,

	/** Returns the ANSI sequence to erase `n` lines and move the cursor to the start of the line. */
	lines: (n: number = 1) => {
		if (n === 1) return erase.line() + cursor.lineStart()

		let str = ''
		for (let i = 0; i < n; i++) str += erase.line() + (i < n - 1 ? cursor.up() : '')
		if (n) str += cursor.lineStart()
		return str
	},
} as const

const clear = {
	/** Returns the ANSI sequence to clear the screen. */
	screen: () => `${ESC}c`,
}

/**
 * ANSI Escape Sequences helper
 *
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 * @see https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
 */
export const ansi = {
	/** Bell (makes an audible noise) */
	BEL: '\x07',
	/** Escape (starts all the escpae sequences) */
	ESC,
	/** Control Sequence Introducer */
	CSI,

	/** Alias of `color` */
	c: color,
	/** ANSI Sequences - color */
	color,
	/** ANSI Sequences - clear */
	clear,
	/** ANSI Sequences - cursor */
	cursor,
	/** ANSI Sequences - erase */
	erase,
	/** ANSI Sequences - scroll */
	scroll,
}
