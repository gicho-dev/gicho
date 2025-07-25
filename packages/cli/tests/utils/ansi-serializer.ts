import type { SnapshotSerializer } from 'vitest'

/* ----------------------------------------
 *   Custom Ansi Snapshot serializer
 * ------------------------------------- */

const cursorCodes = {
	'?25l': 'hide',
	'?25h': 'show',
	'7': 'save',
	'8': 'restore',
} as const
const repeatableCursorCodes = {
	A: 'up',
	B: 'down',
	C: 'right',
	D: 'left',
	E: 'nextLine',
	F: 'prevLine',
	G: 'x',
	S: 'scrollUp',
	T: 'scrollDown',
} as const
const eraseCodes = {
	'2J': 'screen',
	'1J': 'up',
	'0J': 'down',
	J: 'down',
	'2K': 'line',
	'1K': 'lineStart',
	'0K': 'lineEnd',
	K: 'lineEnd',
	c: 'reset',
} as const

const colorCodes = {
	1: 'bold',
	2: 'dim',
	3: 'italic',
	4: 'underline',
	5: 'blink',
	7: 'inverse',
	8: 'hidden',
	9: 'strikethrough',
	30: 'black',
	31: 'red',
	32: 'green',
	33: 'yellow',
	34: 'blue',
	35: 'magenta',
	36: 'cyan',
	37: 'white',
	40: 'bgBlack',
	41: 'bgRed',
	42: 'bgGreen',
	43: 'bgYellow',
	44: 'bgBlue',
	45: 'bgMagenta',
	46: 'bgCyan',
	47: 'bgWhite',
	90: 'brightBlack',
	91: 'brightRed',
	92: 'brightGreen',
	93: 'brightYellow',
	94: 'brightBlue',
	95: 'brightMagenta',
	96: 'brightCyan',
	97: 'brightWhite',
	100: 'bgBrightBlack',
	101: 'bgBrightRed',
	102: 'bgBrightGreen',
	103: 'bgBrightYellow',
	104: 'bgBrightBlue',
	105: 'bgBrightMagenta',
	106: 'bgBrightCyan',
	107: 'bgBrightWhite',
}

/* eslint-disable no-control-regex */
const pattern = /\x1B([78]|\[(?:\?25[lh]|\d+;\d+H|[\d;]*[a-zA-Z]))/g
const colorPattern = /^(?<code>[0-9;]+)m/
const repeatedPattern = /^(?<count>\d*)(?<code>[a-zA-Z])$/
const lineColumnPattern = /^(?<line>\d+);(?<column>\d+)H$/

function replaceAnsiCodes(str: string): string {
	let result = str.replaceAll(pattern, (str, codeOrPrefixed: string) => {
		const code = codeOrPrefixed.startsWith('[') ? codeOrPrefixed.slice(1) : codeOrPrefixed

		if (code in cursorCodes) {
			return `{CURSOR:${cursorCodes[code as never]}}`
		}
		if (code in eraseCodes) {
			return `{ERASE:${eraseCodes[code as never]}}`
		}

		const repeatMatch = code.match(repeatedPattern)
		if (repeatMatch?.groups) {
			const count = repeatMatch.groups.count || '1'
			const key = repeatMatch.groups.code
			if (key in repeatableCursorCodes) {
				return `{CURSOR:${repeatableCursorCodes[key as never]} * ${count}}`
			}
		}

		const lineColumnMatch = code.match(lineColumnPattern)
		if (lineColumnMatch) {
			const lineNumber = lineColumnMatch.groups?.line
			const lineColumn = lineColumnMatch.groups?.column
			return `{CURSOR:moveTo L${lineNumber}:C${lineColumn}}`
		}

		const colorMatch = code.match(colorPattern)
		if (colorMatch) {
			const colorCode = colorMatch.groups?.code

			// reset colors / styles
			if (colorCode === '0' || colorCode === '39' || colorCode === '49') return `{${colorCode}x}`

			const color = colorCodes[colorCode as never]

			return `{${colorCode}${color ?? ''}}`
		}

		return str
	})

	result = result.replace(/\n/g, '\\n')

	return result
}

export default {
	serialize(val: string, config, indentation, depth, refs, printer) {
		const newVal = replaceAnsiCodes(val)

		return printer(
			newVal,
			{ ...config, plugins: config.plugins.filter((p) => p !== this) },
			indentation,
			depth,
			refs,
		)
	},

	test(val) {
		return typeof val === 'string' && (val.includes('\n') || val.includes('\x1b'))
	},
} satisfies SnapshotSerializer
