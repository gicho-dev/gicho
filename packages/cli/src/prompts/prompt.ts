import type { Key, ReadLine } from 'node:readline'
import type { Readable, Writable } from 'node:stream'
import type { LiteralStringUnion } from '@gicho/core/types'

import type { SharedPromptContext } from './internal/shared'
import type { CancelSymbol } from './internal/utils'
import type { BasePromptOptions } from './prompts.types'

import { createInterface } from 'node:readline'
import { ReadStream, WriteStream } from 'node:tty'

import { ansi, wrapAnsi } from '../terminal'
import { shared } from './internal/shared'
import { cancelSymbol } from './internal/utils'

// Inspired by `@clack/core`, `@clack/prompts` (https://github.com/bombshell-dev/clack)

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

export type PromptAction = LiteralStringUnion<
	'enter' | 'ok' | 'cancel' | 'up' | 'down' | 'left' | 'right' | 'space'
>

export type PromptColorKey = 'base' | 'focused' | PromptState
export type PromptSymbolKey =
	| 'caret'
	| 'spacer'
	| 'start'
	| 'bar'
	| 'end'
	| 'checkbox0'
	| 'checkbox1'
	| 'checkbox2'
	| 'radio0'
	| 'radio1'
	| PromptState

export type PromptState = 'initial' | 'active' | 'completed' | 'canceled' | 'error'

interface PromptEventMap<TValue> {
	close: { state: PromptState; value: TValue }
	finish: { state: PromptState; value: TValue }
	keypress: PromptKeypressEvent
	userInput: { inputValue: string }
	value: { value: TValue }
}
type PromptEventName = keyof PromptEventMap<any>

type PromptEventHandler<K extends PromptEventName, TValue> = (
	event: PromptEventMap<TValue>[K],
) => void

interface PromptEventListenerItem<K extends PromptEventName, TValue> {
	handler: PromptEventHandler<K, TValue>
	once?: boolean
}

interface PromptKeypressEvent {
	action: PromptAction | false
	char?: string
	confirmed?: boolean
	isCursorAction: boolean
	key: Key
	keyName?: string
	lowerCasedChar?: string
}

/* ----------------------------------------
 *   Prompt
 * ------------------------------------- */

export interface CommonPromptOptions<TValue> extends BasePromptOptions {
	initialValue?: TValue
	render?(this: unknown): string
	signal?: AbortSignal
	validate?(value: TValue): string | Error | undefined
}

interface PromptInternalOptions {
	initialUserInput?: string
	trackValue: boolean
}

interface PromptOptions<TValue> extends CommonPromptOptions<TValue>, PromptInternalOptions {}

/* ----------------------------------------
 *   Prompt (Abstract) Class
 * ------------------------------------- */
export abstract class Prompt<TValue> {
	readonly opts: CommonPromptOptions<TValue>

	private _prevFrame = ''
	private readonly _initialUserInput: string
	private readonly _trackValue: boolean

	protected readonly _s: SharedPromptContext
	protected render: (this: this) => string

	protected input: Readable
	protected output: Writable
	protected rl?: ReadLine

	protected cursorPos = 0
	protected error = ''
	protected state: PromptState = 'initial'
	protected userInput = ''
	protected value: TValue

	constructor(options: PromptOptions<TValue>) {
		const { initialUserInput, trackValue, ...opts } = options

		this._initialUserInput = initialUserInput ?? ''
		this._trackValue = trackValue

		if (!opts.render) throw new Error('Prompt render function is not implemented')

		this._s = shared
		this.opts = options

		this.input = opts.input ?? shared.config.input
		this.output = opts.output ?? shared.config.output

		this.value = opts.initialValue as TValue

		this.close = this.close.bind(this)
		this.onKeypress = this.onKeypress.bind(this)
		this.renderFrame = this.renderFrame.bind(this)

		this.render = opts.render.bind(this)
	}

	// #region -- Event Emitter

	private _listeners = new Map<
		PromptEventName,
		PromptEventListenerItem<PromptEventName, TValue>[]
	>()

	private _setSubscriber<K extends PromptEventName>(
		eventName: K,
		item: PromptEventListenerItem<K, TValue>,
	): void {
		const callbacks = this._listeners.get(eventName) ?? []
		callbacks.push(item as PromptEventListenerItem<PromptEventName, TValue>)
		this._listeners.set(eventName, callbacks)
	}

	/**
	 * Clear all listeners
	 */
	protected clearListeners(): void {
		this._listeners.clear()
	}

	/**
	 * Emit an event with data
	 */
	protected emit<K extends PromptEventName>(
		eventName: K,
		context: PromptEventMap<TValue>[K],
	): void {
		const callbacks = this._listeners.get(eventName) ?? []
		const cleanUpFns: number[] = []

		callbacks.forEach((item, index) => {
			item.handler.call(this, context)
			if (item.once) {
				cleanUpFns.push(index)
			}
		})

		for (let i = cleanUpFns.length; i--; ) {
			callbacks.splice(cleanUpFns[i], 1)
		}
	}

	/**
	 * Subscribe to an event
	 */
	protected on<K extends PromptEventName>(
		eventName: K,
		handler: PromptEventHandler<K, TValue>,
	): void {
		this._setSubscriber(eventName, { handler })
	}

	/**
	 * Subscribe to an event once
	 */
	protected once<K extends PromptEventName>(
		eventName: K,
		handler: PromptEventHandler<K, TValue>,
	): void {
		this._setSubscriber(eventName, { handler, once: true })
	}

	// #endregion -- Event Emitter

	close(newState?: PromptState): void {
		if (newState) this.state = newState

		this.input.unpipe()
		this.input.off('keypress', this.onKeypress)
		// write('\n')
		this.setInputRawMode(false)

		if (this.rl) {
			this.rl.close()
			this.rl = undefined
		}

		this.emit('close', { state: this.state, value: this.value })
		this.clearListeners()
	}

	prompt(): Promise<TValue | CancelSymbol> {
		return new Promise((resolve) => {
			const { input, output } = this
			const { signal } = this.opts

			if (signal) {
				if (signal.aborted) {
					this.close('canceled')
					return resolve(cancelSymbol)
				}

				signal.addEventListener('abort', () => this.close('canceled'), { once: true })
			}

			this.rl = createInterface({
				escapeCodeTimeout: 50,
				input,
				prompt: '',
				tabSize: 2,
				terminal: true,
			})
			this.rl.prompt()

			if (this._initialUserInput !== undefined) {
				this.setUserInput(this._initialUserInput, true)
			}

			input.on('keypress', this.onKeypress)
			this.setInputRawMode(true)
			output.on('resize', this.renderFrame)

			this.renderFrame()

			this.once('close', ({ state, value }) => {
				output.write(ansi.cursor.show())
				output.off('resize', this.renderFrame)
				this.setInputRawMode(false)

				resolve(state === 'completed' ? value : cancelSymbol)
			})
		})
	}

	protected setValue(value: TValue): void {
		this.value = value
		this.emit('value', { value })
	}

	protected shouldIgnoreKey(char: string | undefined, _key: Key): boolean {
		return char === '\t'
	}

	// #region -- Internal

	private onKeypress(char: string | undefined, key: Key): void {
		const { rl } = this
		if (!rl) return

		const action = this._s.getMatchedAction([char, key.name, key.sequence])
		const isEnterAction = action === 'enter'
		const lowerCasedChar = char?.toLowerCase()

		const keyInfo: PromptKeypressEvent = {
			action,
			char,
			confirmed: lowerCasedChar === 'y' ? true : lowerCasedChar === 'n' ? false : undefined,
			isCursorAction: action && CURSOR_ACTIONS.has(action),
			key,
			lowerCasedChar,
			keyName: key.name,
		}

		this.emit('keypress', keyInfo)

		if (action === 'cancel') this.state = 'canceled'

		if (this._trackValue && !isEnterAction) {
			if (this.shouldIgnoreKey(char, key)) {
				rl.write(null, { ctrl: true, name: 'h' })
			}

			this.cursorPos = rl.cursor
			this.setUserInput(rl.line)
		}

		if (this.state === 'error') this.state = 'active'

		if (isEnterAction) {
			const problem = this.opts.validate?.(this.value)
			if (problem) {
				this.error = problem instanceof Error ? problem.message : problem
				this.state = 'error'

				rl.write(this.userInput)
				this.cursorPos = rl.cursor
			}

			if (this.state !== 'error') this.state = 'completed'
		}

		if (this.state === 'completed' || this.state === 'canceled') {
			this.emit('finish', { state: this.state, value: this.value })
		}
		this.renderFrame()
		if (this.state === 'completed' || this.state === 'canceled') {
			this.close()
		}
	}

	private renderFrame(): void {
		const { output } = this

		const frame = hardWrap(this.render() ?? '', output)

		if (frame === this._prevFrame) return

		if (this.state === 'initial') {
			output.write(ansi.cursor.hide())
			this.state = 'active'
		} else {
			const diff = getDiffLines(this._prevFrame, frame)
			const lineCount = hardWrap(this._prevFrame, output).split('\n').length - 1
			output.write(ansi.cursor.prevLine(lineCount))

			if (diff.length === 1) {
				const diffLineNum = diff[0]
				output.write(ansi.cursor.move(0, diffLineNum))
				output.write(ansi.erase.lines(1))
				const lines = frame.split('\n')
				output.write(lines[diffLineNum])
				this._prevFrame = frame
				output.write(ansi.cursor.move(0, lines.length - diffLineNum - 1))
				return
			} else if (diff.length > 1) {
				const diffLineNum = diff[0]
				output.write(ansi.cursor.move(0, diffLineNum))
				output.write(ansi.erase.down())
				const lines = frame.split('\n')
				const newLines = lines.slice(diffLineNum)
				output.write(newLines.join('\n'))
				this._prevFrame = frame
				return
			}

			output.write(ansi.erase.down())
		}

		output.write(frame)
		this._prevFrame = frame
	}

	private setInputRawMode(mode: boolean): void {
		if (this.input instanceof ReadStream) this.input.setRawMode(mode)
	}

	private setUserInput(value = '', write?: boolean): void {
		this.userInput = value
		this.emit('userInput', { inputValue: value })

		if (write && this._trackValue && this.rl) {
			this.rl.write(this.userInput)
			this.cursorPos = this.rl.cursor
		}
	}

	// #endregion -- Internal
}

/* ----------------------------------------
 *   Internal utils
 * ------------------------------------- */

const CURSOR_ACTIONS = new Set(['up', 'down', 'left', 'right', 'space'])

function getDiffLines(a: string, b: string): number[] {
	const diff: number[] = []
	if (a === b) return diff

	const aLines = a.split('\n')
	const bLines = b.split('\n')
	const maxLen = Math.max(aLines.length, bLines.length)

	for (let i = 0; i < maxLen; i++) {
		if (aLines[i] !== bLines[i]) {
			diff.push(i)
		}
	}

	return diff
}

function hardWrap(str: string, output: Writable): string {
	const cols = output instanceof WriteStream && output.columns ? output.columns : 80
	return wrapAnsi(str, cols, { hard: true, trim: false, wordWrap: false })
}
