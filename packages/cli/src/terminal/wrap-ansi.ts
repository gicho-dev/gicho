// Copied from `wrap-ansi` (MIT License) and modified to fit the project's needs
// https://github.com/sindresorhus/wrap-ansi

import { stripVTControlCharacters } from 'node:util'
import { getStringWidth } from '@gicho/core/string'

/* ----------------------------------------
 *   Constants
 * ------------------------------------- */

const ESCAPES = new Set(['\u001B', '\u009B'])

const END_CODE = 39
const ANSI_ESCAPE_BELL = '\u0007'
const ANSI_CSI = '['
const ANSI_OSC = ']'
const ANSI_SGR_TERMINATOR = 'm'
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`

const codes = new Map<number, number>([
	[0, 0],
	[1, 22],
	[2, 22],
	[3, 23],
	[4, 24],
	[53, 55],
	[7, 27],
	[8, 28],
	[9, 29],
	[30, 39],
	[31, 39],
	[32, 39],
	[33, 39],
	[34, 39],
	[35, 39],
	[36, 39],
	[37, 39],
	[90, 39],
	[91, 39],
	[92, 39],
	[93, 39],
	[94, 39],
	[95, 39],
	[96, 39],
	[97, 39],
	[40, 49],
	[41, 49],
	[42, 49],
	[43, 49],
	[44, 49],
	[45, 49],
	[46, 49],
	[47, 49],
	[100, 49],
	[101, 49],
	[102, 49],
	[103, 49],
	[104, 49],
	[105, 49],
	[106, 49],
	[107, 49],
])

const RE_ESCAPE_CODE = new RegExp(
	`\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL}`,
)

/* ----------------------------------------
 *   Internal functions
 * ------------------------------------- */

const stringWidth = (str?: string): number =>
	str ? getStringWidth(stripVTControlCharacters(str)) : 0

const wrapAnsiCode = (code: number): string =>
	`${ESCAPES.values().next().value}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`
const wrapAnsiHyperlink = (url: string): string =>
	`${ESCAPES.values().next().value}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`

// Trims spaces from a string ignoring invisible sequences
const stringVisibleTrimSpacesRight = (str: string): string => {
	const words = str.split(' ')
	let last = words.length

	while (last > 0) {
		if (stringWidth(words[last - 1]) > 0) break

		last--
	}

	if (last === words.length) return str

	return words.slice(0, last).join(' ') + words.slice(last).join('')
}

// Wrap a long word across multiple rows
// Ansi escape codes do not count towards length
function wrapWord(rows: string[], word: string, columns: number): void {
	const chars = [...word]
	const charsLen = chars.length

	let isInsideEscape = false
	let isInsideLinkEscape = false
	let visible = stringWidth(rows.at(-1))

	for (let index = 0; index < charsLen; index++) {
		const char = chars[index]
		const charLen = stringWidth(char)

		if (visible + charLen <= columns) {
			rows[rows.length - 1] += char
		} else {
			rows.push(char)
			visible = 0
		}

		if (char === '\x1B' || char === '\x9B') {
			isInsideEscape = true

			const ansiEscapeLinkCandidate = chars
				.slice(index + 1, index + 1 + ANSI_ESCAPE_LINK.length)
				.join('')
			isInsideLinkEscape = ansiEscapeLinkCandidate === ANSI_ESCAPE_LINK
		}

		if (isInsideEscape) {
			if (isInsideLinkEscape) {
				if (char === ANSI_ESCAPE_BELL) {
					isInsideEscape = false
					isInsideLinkEscape = false
				}
			} else if (char === ANSI_SGR_TERMINATOR) {
				isInsideEscape = false
			}

			continue
		}

		visible += charLen

		if (visible === columns && index < charsLen - 1) {
			rows.push('')
			visible = 0
		}
	}

	// It's possible that the last row we copy over is only
	// ansi escape characters, handle this edge-case
	if (!visible && (rows.at(-1) ?? '').length > 0 && rows.length > 1) {
		rows[rows.length - 2] += rows.pop()
	}
}

// The wrap-ansi module can be invoked in either 'hard' or 'soft' wrap mode.
//
// 'hard' will never allow a string to take up more than columns characters.
//
// 'soft' allows long words to expand past the column length.
function exec(str: string, columns: number, opts: WrapAnsiOptions = {}): string {
	if (opts.trim !== false && str.trim() === '') return ''

	let ret = ''
	let escapeCode: number | undefined
	let escapeUrl: string | undefined

	let rows = ['']

	const words = str.split(' ')
	const wordsLen = words.length

	for (let index = 0; index < wordsLen; index++) {
		const word = words[index]
		const length = stringWidth(word)

		if (opts.trim !== false) {
			rows[rows.length - 1] = rows[rows.length - 1].trimStart()
		}

		let rowLength = stringWidth(rows.at(-1))

		if (index !== 0) {
			if (rowLength >= columns && (opts.wordWrap === false || opts.trim === false)) {
				// If we start with a new word but the current row length equals the length of the columns, add a new row
				rows.push('')
				rowLength = 0
			}

			if (rowLength > 0 || opts.trim === false) {
				rows[rows.length - 1] += ' '
				rowLength++
			}
		}

		// In 'hard' wrap mode, the length of a line is never allowed to extend past 'columns'
		if (opts.hard && length > columns) {
			const remainingColumns = columns - rowLength
			const breaksStartingThisLine = 1 + Math.floor((length - remainingColumns - 1) / columns)
			const breaksStartingNextLine = Math.floor((length - 1) / columns)
			if (breaksStartingNextLine < breaksStartingThisLine) {
				rows.push('')
			}

			wrapWord(rows, word, columns)
			continue
		}

		if (rowLength + length > columns && rowLength > 0 && length > 0) {
			if (opts.wordWrap === false && rowLength < columns) {
				wrapWord(rows, word, columns)
				continue
			}

			rows.push('')
		}

		if (rowLength + length > columns && opts.wordWrap === false) {
			wrapWord(rows, word, columns)
			continue
		}

		rows[rows.length - 1] += word
	}

	if (opts.trim !== false) {
		rows = rows.map((row) => stringVisibleTrimSpacesRight(row))
	}

	const preString = rows.join('\n')
	const pre = [...preString]

	// We need to keep a separate index as `String#slice()` works on Unicode code units, while `pre` is an array of codepoints.
	let preStringIndex = 0

	const preLen = pre.length
	for (let index = 0; index < preLen; index++) {
		const char = pre[index]

		ret += char

		if (char === '\x1B' || char === '\x9B') {
			const { groups = {} } = RE_ESCAPE_CODE.exec(preString.slice(preStringIndex)) || {}
			if (groups.code !== undefined) {
				const code = Number.parseFloat(groups.code)
				escapeCode = code === END_CODE ? undefined : code
			} else if (groups.uri !== undefined) {
				escapeUrl = groups.uri.length === 0 ? undefined : groups.uri
			}
		}

		const code = codes.get(Number(escapeCode))

		if (pre[index + 1] === '\n') {
			if (escapeUrl) {
				ret += wrapAnsiHyperlink('')
			}

			if (escapeCode && code) {
				ret += wrapAnsiCode(code)
			}
		} else if (char === '\n') {
			if (escapeCode && code) {
				ret += wrapAnsiCode(escapeCode)
			}

			if (escapeUrl) {
				ret += wrapAnsiHyperlink(escapeUrl)
			}
		}

		preStringIndex += char.length
	}

	return ret
}

/* ----------------------------------------
 *   Wrap Ansi
 * ------------------------------------- */

interface WrapAnsiOptions {
	/**
	 * By default the wrap is soft, meaning long words may extend past the column width.
	 * Setting this to `true` will make it hard wrap at the column width.
	 *
	 * @default false
	 */
	readonly hard?: boolean

	/**
	 * Whitespace on all lines is removed by default.
	 * Set this option to `false` if you don't want to trim.
	 *
	 * @default true
	 */
	readonly trim?: boolean

	/**
	 * By default, an attempt is made to split words at spaces, ensuring that
	 * they don't extend past the configured columns.
	 * If wordWrap is `false`, each column will instead be completely filled splitting words as necessary.
	 *
	 * @default true
	 */
	readonly wordWrap?: boolean
}

/**
 * Hard-wraps a string to the specified column width, preserving ANSI escape codes.
 *
 * Line breaks (`\n`) will be normalized, and each line will be wrapped independently
 * based on the visible width, not the raw character count.
 *
 * @param str - The input string, which may include ANSI escape codes.
 * @param columns - The number of columns to wrap the text to.
 * @param options - Optional settings such as word break behavior.
 *
 * @example
 * ```
 * const sentence = 'I love ' + color.red('pizza') + ' and ' + color.green('broccoli') + ' very much!'
 * const wrapped = hardWrap(sentence, 10)
 *
 * console.log(wrapped)
 * ```
 */
export function wrapAnsi(str: string, columns: number, options: WrapAnsiOptions = {}): string {
	return String(str)
		.normalize()
		.replaceAll('\r\n', '\n')
		.split('\n')
		.map((line) => exec(line, columns, options))
		.join('\n')
}
