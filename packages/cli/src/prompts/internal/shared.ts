import type { PromptAction, PromptColorKey, PromptSymbolKey } from '../prompt'
import type { SharedPromptConfig } from '../prompts.types'

import { color } from '../../terminal'
import { getCurrentStackTrace, unicodeOr } from './utils'

/** Shared config for prompt elements */
const config: SharedPromptConfig = {
	input: process.stdin,
	output: process.stdout,

	actions: new Set(['cancel', 'ok', 'up', 'down', 'left', 'right', 'space']),

	colors: {
		base: 'gray',

		initial: 'cyan',
		active: 'cyan',
		completed: 'green',
		canceled: 'red',
		error: 'yellow',

		focused: 'green',
	},

	fallbackColumns: 80,
	// log: logConfig,

	logLevel: 3,
	logTypes: {
		// Level 0
		fatal: {
			level: 0,
			prefix: `${color.bgRed(` FATAL `)} `,
			symbol: unicodeOr(color.red('■'), 'x'),
		},
		error: {
			level: 0,
			prefix: `${color.bgRed(` ERROR `)} `,
			symbol: unicodeOr(color.red('■'), 'x'),
		},
		// Level 1
		warn: {
			level: 1,
			prefix: `${color.bgYellow(' WARN ')} `,
			symbol: unicodeOr(color.yellow('▲'), '!'),
		},

		// Level 2
		log: {
			level: 2,
		},

		// Level 3
		failure: {
			level: 3,
			symbol: unicodeOr(color.red('✖'), 'x'),
		},
		info: {
			level: 3,
			symbol: unicodeOr(color.blue('✱'), '!'),
		},
		success: {
			level: 3,
			symbol: unicodeOr(color.green('✔'), 'v'),
		},

		// Level 4
		debug: {
			level: 4,
			symbol: unicodeOr('⚙', 'D'),
		},

		// Level 5
		trace: {
			level: 5,
			symbol: unicodeOr('→', '-'),
			formatter: (data, ctx) => {
				const indent = ' '.repeat(2)

				return (
					ctx.baseFormatter(data, ctx) +
					shared.lineBar('base') +
					getCurrentStackTrace()
						.map((line) => {
							line = line
								.replace(/^at +/, (m) => color.gray(m))
								.replace(/\((.+)\)/, (_, m) => `(${color.cyan(m)})`)

							return shared.lineBar('base', indent + line)
						})
						.join('')
				)
			},
		},

		// Level `Verbose` (Infinity)
		verbose: {
			level: Infinity,
			prefix: `${color.bgGray(' VERBOSE ')} `,
		},
	},

	lineGap: 1,

	S: {
		caret: unicodeOr('█', '_'),
		spacer: ' '.repeat(2),

		start: unicodeOr('╭', 'p'), // '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏', ●
		bar: unicodeOr('┆', '|'),
		end: unicodeOr('╰', 'b'),

		initial: unicodeOr('●', '*'),
		active: unicodeOr('●', '*'),
		completed: unicodeOr('✔', 'v'),
		canceled: unicodeOr('✕', 'x'),
		error: unicodeOr('▲', 'x'),

		checkbox0: unicodeOr('□', '[ ]'), // checkbox
		checkbox1: unicodeOr('□', '[•]'), // checkbox focused
		checkbox2: unicodeOr('■', '[+]'), // checkbox selected
		radio0: unicodeOr('○', ' '), // radio
		radio1: unicodeOr('⦿', '>'), // radio focused(selected) ◉
	},

	shortcutKeys: {
		return: 'enter',
		escape: 'cancel',
		'\x03': 'cancel',
		h: 'left',
		j: 'down',
		k: 'up',
		l: 'right',
		y: 'ok',
	},
}

export type SharedPromptContext = typeof shared

/** Shared context for prompt elements */
export const shared = {
	_isActive: false,

	/** Shared config for prompt elements */
	config,

	get isActive() {
		return shared._isActive
	},
	set isActive(value: boolean) {
		shared._isActive = value
	},

	/** Get the matched action from the keys */
	getMatchedAction(keys: (string | undefined)[]): PromptAction | false {
		for (const key of keys) {
			if (typeof key === 'string') {
				const action = config.actions.has(key) ? key : config.shortcutKeys[key]
				if (action) return action
			}
		}
		return false
	},

	/** Returns the prompt current line string with given color and symbol */
	line(
		colorKey: PromptColorKey,
		symbolKey: PromptSymbolKey,
		str?: string,
		noNewLine?: boolean,
	): string {
		const { colors, S } = config
		const symbolText = color[colors[colorKey]](S[symbolKey])
		return `${symbolText}${str ? `${S.spacer}${str}` : ''}${noNewLine ? '' : '\n'}`
	},

	/** Returns the prompt current line string with given symbol string */
	lineRaw(symbol: string, str?: string, noNewLine?: boolean): string {
		const { S } = config
		return `${symbol}${str ? `${S.spacer}${str}` : ''}${noNewLine ? '' : '\n'}`
	},

	/** Returns the prompt upside (prefix) line string */
	linePrefix(): string {
		const { colors, lineGap, S } = config
		return `${color[colors.base](S.bar)}\n`.repeat(lineGap)
	},

	/** Returns the prompt current line string with given color and bar symbol */
	lineBar(colorKey: PromptColorKey, str?: string, noNewLine?: boolean): string {
		return shared.line(colorKey, 'bar', str, noNewLine)
	},

	/** Returns the prompt current line string with given color and end symbol */
	lineEnd(colorKey: PromptColorKey, str?: string, noNewLine?: boolean): string {
		return shared.line(colorKey, 'end', str, noNewLine)
	},
}
