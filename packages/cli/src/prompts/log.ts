import type { RequiredByKeys } from '@gicho/core/types'

import type {
	LogMessage,
	LogMessageFormatter,
	LogMethods,
	LogType,
	LogTypeDescriptor,
} from './prompts.types'

import { formatWithOptions } from 'node:util'
import { mergeConfigs } from '@gicho/core/object'

import { ansi } from '../terminal'
import { shared } from './internal/shared'

interface LogOptions extends Pick<LogTypeDescriptor, 'formatter'>, Partial<LogMessage> {
	baseFormatter?: LogMessageFormatter
	/**
	 * The type of log message.
	 * @default 'log'
	 */
	type?: LogType
}

interface LogReturn extends LogMethods {
	write(options: LogOptions): void
}

const defaultConfig: LogOptions = {
	baseFormatter: (opts, { shared: _s }) => {
		const {
			messages = [],
			symbol = ansi.c[_s.config.colors.base](_s.config.S.bar),
			prefix = '',
			suffix = '',
		} = opts

		const message = messages[0]
		const args = messages.slice(1)

		const body = (prefix + formatWithOptions({ colors: true }, message, ...args) + suffix)
			.split('\n')
			.map((line, i) => (i ? _s.lineBar('base', line, true) : line))
			.join('\n')

		return (_s.isActive ? _s.linePrefix() : '') + _s.lineRaw(symbol, body)
	},

	type: 'log',
}

export const log: LogReturn = (() => {
	const _s = shared

	const ctx = {
		write(options) {
			const cfg = _s.config
			const { output } = cfg

			const type = options.type || 'log'

			const opts = mergeConfigs(defaultConfig, cfg.logTypes[type], options) as RequiredByKeys<
				LogOptions,
				'baseFormatter' | 'formatter' | 'level' | 'messages' | 'type'
			>

			const { baseFormatter, formatter = baseFormatter, ...logData } = opts

			if (opts.level > cfg.logLevel) return

			output.write(formatter(logData, { baseFormatter, shared: _s }))
			_s.isActive = true
		},
	} as LogReturn

	// no redefinition logic implemented after initial definition of log methods
	for (const type in _s.config.logTypes) {
		ctx[type as LogType] = (...messages) => ctx.write({ type: type as LogType, messages })
	}

	return ctx
})()
