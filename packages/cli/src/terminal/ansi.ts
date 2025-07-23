export {
	type AnsiColors as AnsiColor,
	type Ansis,
	type AnsiStyles as AnsiStyle,
	default as ansiStyle,
} from 'ansis'

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

export type AnsiBasicColor = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
export type AnsiBrightColor = `${AnsiBasicColor}Bright`

export type AnsiBaseTextColor = 'black' | 'gray' | AnsiBasicColor | AnsiBrightColor
export type AnsiBaseBgColor = `bg${Capitalize<AnsiBaseTextColor>}`

/* ----------------------------------------
 *   ANSI Sequences Constants / Methods
 * ------------------------------------- */

export const BEL = '\x07'
export const ESC = '\x1B'
export const CSI = `${ESC}[`

export const ansiCursor = {
	to: (x: number, y?: number) => (y == null ? ansiCursor.x(x + 1) : ansiCursor.xy(x + 1, y + 1)),
	move: (dx: number, dy: number) =>
		(dx < 0 ? ansiCursor.left(-dx) : dx > 0 ? ansiCursor.right(dx) : '') +
		(dy < 0 ? ansiCursor.up(-dy) : dy > 0 ? ansiCursor.down(dy) : ''),

	up: (n: number = 1) => `${CSI}${n}A` as const,
	down: (n: number = 1) => `${CSI}${n}B` as const,
	right: (n: number = 1) => `${CSI}${n}C` as const,
	left: (n: number = 1) => `${CSI}${n}D` as const,
	nextLine: (n: number = 1) => `${CSI}${n}E` as const,
	prevLine: (n: number = 1) => `${CSI}${n}F` as const,
	x: (n: number = 1) => `${CSI}${n}G` as const,
	xy: (x?: number, y?: number) => `${CSI}${y ?? ''};${x ?? ''}H` as const,

	lineStart: `${CSI}G`,
	lineEnd: `${CSI}99999G`,

	hide: `${CSI}?25l`,
	show: `${CSI}?25h`,
	save: `${ESC}7`,
	restore: `${ESC}8`,
} as const

export const ansiScroll = {
	up: (n: number = 1) => `${CSI}${n}S` as const,
	down: (n: number = 1) => `${CSI}${n}T` as const,
} as const

export const ansiErase = {
	screen: `${CSI}2J`,
	up: `${CSI}1J`,
	down: `${CSI}J`,

	line: `${CSI}2K`,
	lineStart: `${CSI}1K`,
	lineEnd: `${CSI}K`,

	lines: (n: number = 1) => {
		if (n === 1) return ansiErase.line + ansiCursor.lineStart

		let str = ''
		for (let i = 0; i < n; i++) str += ansiErase.line + (i < n - 1 ? ansiCursor.up() : '')
		if (n) str += ansiCursor.lineStart
		return str
	},

	// low-level ANSI sequence
	reset: `${ESC}c`,
} as const
