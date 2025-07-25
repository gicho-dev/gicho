import type { Readable, Writable } from 'node:stream'
import type { Direction } from 'node:tty'
import type { MergeObjectsDeep } from '@gicho/core/object'
import type { AnyRecord, LiteralUnion, PartialDeep, UnionToTuple } from '@gicho/core/types'

import type { AnsiBaseTextColor, Ansis } from './ansi'
import type { PromptAction, PromptColorKey, PromptSymbolKey } from './prompts'

/* ----------------------------------------
 *   Types - Ansi
 * ------------------------------------- */

export interface TerminalAnsi {
	/**
	 * Moves cursor to the specified position.
	 * @param x - The column number.
	 * @param y - The line number.
	 */
	cursorTo(x: number, y?: number): boolean
	/**
	 * Moves cursor relative to its current position.
	 * @param dx - The horizontal movement amount.
	 * @param dy - The vertical movement amount.
	 */
	cursorMove(dx: number, dy: number): boolean

	/** Moves cursor up `n` lines. */
	cursorUp(n?: number): boolean
	/** Moves cursor down `n` lines. */
	cursorDown(n?: number): boolean
	/** Moves cursor left (backward) `n` columns. */
	cursorLeft(n?: number): boolean
	/** Moves cursor right (forward) `n` columns. */
	cursorRight(n?: number): boolean
	/** Moves cursor to the beginning of the line. */
	cursorLineStart(): boolean
	/** Moves cursor to the end of the line. */
	cursorLineEnd(): boolean
	/** Moves cursor to beginning of next line, `n` lines down. */
	cursorNextLine(n?: number): boolean
	/** Moves cursor to beginning of previous line, `n` lines up. */
	cursorPrevLine(n?: number): boolean
	/** Hides the cursor. */
	cursorHide(): boolean
	/** Shows the cursor. */
	cursorShow(): boolean
	/** Saves the current cursor position. */
	cursorSave(): boolean
	/** Restores the saved cursor position. */
	cursorRestore(): boolean

	/** Scrolls the screen up `n` lines. */
	scrollUp(n?: number): boolean
	/** Scrolls the screen down `n` lines. */
	scrollDown(n?: number): boolean

	/**
	 * Clears the line from the cursor to the end of the line.
	 *
	 * @param [dir] The direction to clear the line.
	 *   (-1 : to the left from cursor,
	 *    0 : the entire line,
	 *    1 : to the right from cursor)
	 */
	clearLine(dir?: Direction): boolean
	/** Clears `n` lines and move cursor to the beginning of the line. */
	clearLines(n?: number): boolean
	/** Clears the screen. */
	clearScreen(): boolean
	/** Clears from the cursor to the beginning of the screen. */
	clearScreenUp(): boolean
	/** Clears from the cursor to end of the screen. */
	clearScreenDown(): boolean

	/** Resets the screen. (Hard clear) */
	resetScreen(): boolean
}

/* ----------------------------------------
 *   Types - Log
 * ------------------------------------- */

export type LogFunction = (...messages: any[]) => void
export type LogLevel = LiteralUnion<0 | 1 | 2 | 3 | 4 | 5, number>

interface LogTypeDescriptor {
	formatter?: LogMessageFormatter
	level: number
	prefix?: string
	suffix?: string
}

type LogMessageFormatter = (data: LogMessage, context: LogMessageFormatterContext) => string

interface LogMessageFormatterContext {
	baseFormatter: LogMessageFormatter
	config: TerminalConfig
}

export interface LogMessage extends Pick<LogTypeDescriptor, 'level' | 'prefix' | 'suffix'> {
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

export interface TerminalCoreLog extends BaseLogMethods {
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

export type TerminalCoreLogType = keyof TerminalCoreLog & {}

export interface TerminalLogConfig {
	formatter: LogMessageFormatter
	level: LogLevel
	types: Record<string, LogTypeDescriptor>
}

/* ----------------------------------------
 *   Types - Prompt
 * ------------------------------------- */

export interface TerminalPrompt {
	/** Prompt utils method. @internal */
	_P: {
		/** Get the matched action from the keys */
		getMatchedAction(keys: (string | undefined)[]): PromptAction | false

		/** Returns the prompt current line string with given color and symbol */
		line(
			colorKey: PromptColorKey,
			symbolKey: PromptSymbolKey,
			str?: string,
			noNewLine?: boolean,
		): string
		/** Returns the prompt current line string with given symbol string */
		lineRaw(symbol: string, str?: string, noNewLine?: boolean): string
		/** Returns the prompt upside (prefix) line string */
		linePrefix(): string
		/** Returns the prompt current line string with given color and bar symbol */
		lineBar(colorKey: PromptColorKey, str?: string, noNewLine?: boolean): string
		/** Returns the prompt current line string with given color and end symbol */
		lineEnd(colorKey: PromptColorKey, str?: string, noNewLine?: boolean): string
	}

	/** Check if the prompt is canceled */
	isCanceledPrompt(result: unknown): result is symbol

	/**
	 * Start a prompt
	 * @category Prompt
	 */
	startPrompt(message: string): void

	/**
	 * End current prompt
	 * @category Prompt
	 */
	endPrompt(message: string): void
}

export interface TerminalPromptConfig {
	actions: Set<PromptAction>
	colors: Record<PromptColorKey, AnsiBaseTextColor>
	lineGap: number
	/** Symbol/Strings for prompt elements */
	S: Record<PromptSymbolKey, string>
	shortcutKeys: Record<string, PromptAction>
}

/* ----------------------------------------
 *   Types - Terminal
 * ------------------------------------- */

export type Terminal<Ps> = Ps extends TerminalPlugin<any, any>[]
	? MergeObjectsDeep<
			[TerminalCore<ExtractPluginConfigs<Ps>>, ...UnionToTuple<ExtractPluginContext<Ps[number]>>]
		>
	: TerminalCore<TerminalConfig>
export type AnyTerminal = Terminal<[TerminalPlugin<any, any>]>

export type TerminalPlugin<TContext extends AnyRecord = AnyRecord, TConfig = {}> = (
	baseCtx: MergeObjectsDeep<[TerminalCore<MergeObjectsDeep<[TerminalConfig, TConfig]>>, TContext]>,
	cfg: MergeObjectsDeep<[TerminalConfig, TConfig]>,
) => MergeObjectsDeep<
	[Partial<TerminalCore<MergeObjectsDeep<[TerminalConfig, TConfig]>>>, TContext]
>

type ExtractPluginContext<T extends TerminalPlugin<any, any>> =
	T extends TerminalPlugin<infer TContext, any> ? TContext : never
type ExtractPluginConfig<T extends TerminalPlugin<any, any>> =
	T extends TerminalPlugin<any, infer TConfig> ? TConfig : never

type ExtractPluginConfigs<Ps extends readonly TerminalPlugin<any, any>[]> = MergeObjectsDeep<
	[TerminalConfig, ...UnionToTuple<ExtractPluginConfig<Ps[number]>>]
>

export interface TerminalCore<TConfig> extends TerminalAnsi, TerminalCoreLog, TerminalPrompt {
	/** The terminal config */
	readonly config: TConfig
	/** The terminal input stream */
	readonly input: Readable
	/** The terminal output stream */
	readonly output: Writable
	/** ANSI Color, Style Methods */
	readonly style: Ansis

	/** The number of columns of the terminal output */
	get columns(): number
	/** The number of rows of the terminal output */
	get rows(): number

	/** Update the terminal config. */
	updateConfig(options: PartialDeep<TConfig>): void
	/** Write a string to the output. */
	write(str: string): boolean
	/** Write the joined string arguments to the output. */
	writeArgs(separator?: string, ...args: string[]): boolean
	/** Write a log message to the output. */
	writeLog(type: string, messages: any[], options?: Partial<LogTypeDescriptor>): void
}

export interface TerminalConfig {
	/** The terminal input stream */
	input: Readable
	/** The terminal output stream */
	output: Writable
	/** The terminal plugins */
	plugins: TerminalPlugin<any, any>[]

	/** The terminal log config */
	log: TerminalLogConfig
	/** The terminal prompt config */
	prompt: TerminalPromptConfig

	/** Mock terminal config for testing */
	__mock: {
		columns: number
		rows: number
	}
}

export interface TerminalOptions<Ps extends readonly TerminalPlugin<any, any>[]>
	extends Omit<PartialDeep<TerminalConfig>, 'plugins'> {
	plugins?: Ps
}
