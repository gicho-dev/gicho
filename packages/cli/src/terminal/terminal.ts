import type {
	LogMessage,
	Terminal,
	TerminalAnsi,
	TerminalConfig,
	TerminalCoreLogType,
	TerminalLogConfig,
	TerminalOptions,
	TerminalPlugin,
	TerminalPrompt,
	TerminalPromptConfig,
} from './types'

import { WriteStream } from 'node:tty'
import { formatWithOptions } from 'node:util'
import { mergeConfigs, mergeConfigsInto } from '@gicho/core/object'

import { ansiCursor, ansiErase, ansiScroll, ansiStyle } from './ansi'
import { getCurrentStackTrace, SYMBOLS, unicodeOr } from './terminal.internal'

/* ----------------------------------------
 *   Terminal Ansi
 * ------------------------------------- */

const terminalAnsiMethods: TerminalPlugin<TerminalAnsi> = (ctx) => {
	return {
		/* ---------- Cursor ---------- */

		cursorTo: (x, y) => ctx.write(ansiCursor.to(x, y)),
		cursorMove: (dx, dy) => ctx.write(ansiCursor.move(dx, dy)),

		cursorUp: (n = 1) => ctx.write(ansiCursor.up(n)),
		cursorDown: (n = 1) => ctx.write(ansiCursor.down(n)),
		cursorLeft: (n = 1) => ctx.write(ansiCursor.left(n)),
		cursorRight: (n = 1) => ctx.write(ansiCursor.right(n)),
		cursorLineStart: () => ctx.write(ansiCursor.lineStart),
		cursorLineEnd: () => ctx.write(ansiCursor.lineEnd),
		cursorNextLine: (n = 1) => ctx.write(ansiCursor.nextLine(n)),
		cursorPrevLine: (n = 1) => ctx.write(ansiCursor.prevLine(n)),
		cursorHide: () => ctx.write(ansiCursor.hide),
		cursorShow: () => ctx.write(ansiCursor.show),
		cursorSave: () => ctx.write(ansiCursor.save),
		cursorRestore: () => ctx.write(ansiCursor.restore),

		/* ---------- Scroll ---------- */

		scrollUp: (n = 1) => ctx.write(ansiScroll.up(n)),
		scrollDown: (n = 1) => ctx.write(ansiScroll.down(n)),

		/* ---------- Clear ---------- */

		clearLine: (dir = 0) =>
			ctx.write(dir === -1 ? ansiErase.lineStart : dir === 1 ? ansiErase.lineEnd : ansiErase.line),
		clearLines: (n = 1) => (n < 1 ? false : ctx.write(ansiErase.lines(n))),

		clearScreen: () => ctx.write(ansiErase.screen),
		clearScreenUp: () => ctx.write(ansiErase.up),
		clearScreenDown: () => ctx.write(ansiErase.down),

		resetScreen: () => ctx.write(ansiErase.reset),
	}
}

/* ----------------------------------------
 *   Terminal Log
 * ------------------------------------- */

const defaultTerminalLogConfig: TerminalLogConfig = {
	formatter(data) {
		const messages = data.messages || []
		const message = messages[0]
		const args = messages.slice(1)

		const prefix = data.prefix ? `${data.prefix} ` : ''
		const suffix = data.suffix ?? ''
		const content = prefix + formatWithOptions({ colors: true }, message, ...args) + suffix

		return content
	},

	level: 3,

	types: {
		// Level 0
		fatal: {
			level: 0,
			prefix: ansiStyle.bgRed(` FATAL `),
			suffix: `\n`,
		},
		error: {
			level: 0,
			prefix: ansiStyle.bgRed(` ERROR `),
			suffix: `\n`,
		},
		// Level 1
		warn: {
			level: 1,
			prefix: ansiStyle.bgYellow(' WARN '),
		},

		// Level 2
		log: {
			level: 2,
		},

		// Level 3
		failure: {
			level: 3,
			prefix: unicodeOr('❌', 'x'),
		},
		info: {
			level: 3,
			prefix: unicodeOr('ℹ️ ', 'i'),
		},
		success: {
			level: 3,
			prefix: unicodeOr('✅', 'x'),
		},

		// Level 4
		debug: {
			level: 4,
			prefix: unicodeOr('⚙', 'D'),
		},

		// Level 5
		trace: {
			level: 5,
			prefix: '→',
			formatter: (data, ctx) => {
				const _message = ctx.config.log.formatter(data, ctx)

				const indent = ' '.repeat(2)

				const stackLines =
					indent +
					getCurrentStackTrace()
						.map((line) =>
							line
								.replace(/^at +/, (m) => ansiStyle.gray(m))
								.replace(/\((.+)\)/, (_, m) => `(${ansiStyle.cyan(m)})`),
						)
						.join(`\n${indent}`)

				return `${_message}\n${stackLines}\n`
			},
		},

		// Level `Verbose` (Infinity)
		verbose: {
			level: Number.POSITIVE_INFINITY,
			prefix: ansiStyle.bgGray(' VERBOSE '),
		},
	},
}

/* ----------------------------------------
 *   Terminal Prompt
 * ------------------------------------- */

const defaultTerminalPromptConfig: TerminalPromptConfig = {
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

const terminalPromptMethods: TerminalPlugin<TerminalPrompt> = (ctx, cfg) => {
	const { style, write } = ctx

	return {
		_P: {
			getMatchedAction: (keys) => {
				for (const key of keys) {
					if (typeof key === 'string') {
						const action = cfg.prompt.actions.has(key) ? key : cfg.prompt.shortcutKeys[key]
						if (action) return action
					}
				}
				return false
			},

			line: (colorKey, symbolKey, str, noNewLine) => {
				const { colors, S } = cfg.prompt
				const symbolText = style[colors[colorKey]](S[symbolKey])
				return `${symbolText}${str ? `${S.spacer}${str}` : ''}${noNewLine ? '' : '\n'}`
			},
			lineRaw: (symbol, str, noNewLine) => {
				const { S } = cfg.prompt
				return `${symbol}${str ? `${S.spacer}${str}` : ''}${noNewLine ? '' : '\n'}`
			},

			linePrefix: () => {
				const { colors, lineGap, S } = cfg.prompt
				return `${style[colors.base](S.bar)}\n`.repeat(lineGap)
			},
			lineBar: (colorKey, str, noNewLine) => ctx._P.line(colorKey, 'bar', str, noNewLine),
			lineEnd: (colorKey, str, noNewLine) => ctx._P.line(colorKey, 'end', str, noNewLine),
		},

		isCanceledPrompt: (result: unknown): result is symbol => result === SYMBOLS.PROMPT_CANCELED,

		startPrompt(message = '') {
			write(ctx._P.line('base', 'start', message))
		},

		endPrompt(message = '') {
			write(ctx._P.linePrefix() + ctx._P.lineEnd('base', message))
		},
	}
}

/* ----------------------------------------
 *   Terminal (Core)
 * ------------------------------------- */

const defaultConfig: TerminalConfig = {
	input: process.stdin,
	output: process.stdout,
	plugins: [],

	log: defaultTerminalLogConfig,
	prompt: defaultTerminalPromptConfig,

	__mock: {
		columns: 80,
		rows: 24,
	},
}

/**
 * Create a terminal object with plugins
 */
export function createTerminal<Ps extends readonly TerminalPlugin<any, any>[]>(
	options: TerminalOptions<Ps> = {},
): Terminal<Ps> {
	const config = mergeConfigs(defaultConfig, options) as TerminalConfig
	const { input, output, plugins, log: logCfg } = config

	const ctx = {
		config,
		input,
		output,
		style: ansiStyle,

		get columns() {
			return output instanceof WriteStream ? output.columns : config.__mock.columns
		},
		get rows() {
			return output instanceof WriteStream ? output.rows : 0
		},

		updateConfig: (options) => {
			mergeConfigsInto(config, options)
		},

		write: (str) => output.write(str),
		writeArgs: (separator = '', ...args) => output.write(args.join(separator)),
	} as Terminal<[]>

	Object.assign(ctx, terminalAnsiMethods(ctx, config))
	Object.assign(ctx, terminalPromptMethods(ctx, config))

	const writeLog: Terminal<Ps>['writeLog'] = (type, messages, options) => {
		const logTypeConfig = mergeConfigs(options, logCfg.types[type])
		const { formatter = logCfg.formatter, level, prefix, suffix } = logTypeConfig
		const logData: LogMessage = {
			messages,
			level,
			prefix,
			suffix,
			type,
		}

		if (level > logCfg.level) return

		const message = formatter(logData, { baseFormatter: logCfg.formatter, config })
		ctx.write(`${message}\n`)
	}

	for (const type in logCfg.types) {
		ctx[type as TerminalCoreLogType] = (...args) => writeLog(type, args)
	}

	for (const plugin of plugins) Object.assign(ctx, plugin(ctx, config))

	return ctx as Terminal<Ps>
}
