import type { Readable, Writable } from 'node:stream'
import type { LiteralUnion } from '@gicho/core/types'

import type { AnsiBaseTextColor } from '../terminal'
import type { PromptAction, PromptColorKey, PromptSymbolKey } from './prompt'

/* ----------------------------------------
 *   Shared Config
 * ------------------------------------- */

export interface SharedPromptConfig extends Required<BasePromptOptions> {
	actions: Set<PromptAction>
	colors: Record<PromptColorKey, AnsiBaseTextColor>
	fallbackColumns: number
	lineGap: number
	log: LogConfig
	/** Symbol/Strings for prompt elements */
	S: Record<PromptSymbolKey, string>
	shortcutKeys: Record<string, PromptAction>
}

/* ----------------------------------------
 *   Base
 * ------------------------------------- */

export interface BasePromptOptions extends InputOptions, OutputOptions {}

export interface InputOptions {
	input?: Readable
}
export interface OutputOptions {
	output?: Writable
}

/* ----------------------------------------
 *   Log
 * ------------------------------------- */

export type LogFunction = (...messages: any[]) => void
export type LogLevel = LiteralUnion<0 | 1 | 2 | 3 | 4 | 5, number>

export interface LogTypeDescriptor {
	formatter?: LogMessageFormatter
	level: number
	prefix?: string
	symbol?: string
	suffix?: string
}

type LogMessageFormatter = (data: LogMessage, context: LogMessageFormatterContext) => string

interface LogMessageFormatterContext {
	baseFormatter: LogMessageFormatter
	config: SharedPromptConfig
}

export interface LogMessage
	extends Pick<LogTypeDescriptor, 'level' | 'prefix' | 'suffix' | 'symbol'> {
	messages: any[]
	type: string
}

export interface BaseLogMethods {
	/**
	 * Display log messages.
	 * Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to `printf(3)` (the arguments are all passed to `util.format()`).
	 *
	 * @example
	 * ```ts
	 * log('Hello, world!')                 // => Hello, world!
	 * log('Add - %d + %d = %d', 2, 3, 5)   // => Add - 2 + 3 = 5
	 * ```
	 */
	log(...messages: any[]): void
	/** Display info messages */
	info(...messages: any[]): void
	/** Display warning messages */
	warn(...messages: any[]): void
	/** Display error messages */
	error(...messages: any[]): void
}

export interface LogMethods extends BaseLogMethods {
	/** Display debug messages */
	debug(...messages: any[]): void
	/** Display fatal messages */
	fatal(...messages: any[]): void
	/** Display failure messages */
	failure(...messages: any[]): void
	/** Display success messages */
	success(...messages: any[]): void
	/** Display trace messages */
	trace(...messages: any[]): void
	/** Display verbose messages */
	verbose(...messages: any[]): void
}

export type LogType = keyof LogMethods & {}

export interface LogConfig {
	formatter: LogMessageFormatter
	level: LogLevel
	types: Record<string, LogTypeDescriptor>
}
