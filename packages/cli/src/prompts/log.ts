import type { LogMessage, LogMethods, LogType, LogTypeDescriptor } from './prompts.types'

import { mergeConfigs } from '@gicho/core/object'

import { shared } from './internal/shared'

interface LogReturn extends LogMethods {
	write(type: string, messages: any[], options?: Partial<LogTypeDescriptor>): void
}

export const log: LogReturn = (() => {
	const ctx = {
		write(type, messages, options = {}) {
			const { log: logCfg, output } = shared.config

			const logTypeConfig = mergeConfigs(logCfg.types[type], options)
			const { formatter = logCfg.formatter, level, ...rest } = logTypeConfig
			const logData: LogMessage = {
				messages,
				level,
				type,
				...rest,
			}

			if (level > logCfg.level) return

			const message = formatter(logData, { baseFormatter: logCfg.formatter, config: shared.config })
			output.write(`${message}\n`)
			shared.isActive = true
		},
	} as LogReturn

	for (const type in shared.config.log.types) {
		ctx[type as LogType] = (...args) => ctx.write(type, args)
	}

	return ctx
})()
