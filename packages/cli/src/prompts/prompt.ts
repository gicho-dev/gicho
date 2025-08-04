import type { Key, ReadLine } from 'node:readline'
import type { Writable } from 'node:stream'
import type { LiteralStringUnion } from '@gicho/core/types'

import type { SharedPromptContext } from './internal/shared'
import type { CancelSymbol } from './internal/utils'
import type { BasePromptOptions } from './prompts.types'

import { createInterface } from 'node:readline'
import { ReadStream, WriteStream } from 'node:tty'
import wrapAnsi from 'wrap-ansi'

import { ansi } from '../terminal'
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
 *   Prompt Event Emitter
 * ------------------------------------- */

interface PromptEventEmitter<TValue> {
	/** Clear all listeners */
	clear(): void
	/** Emit an event with data */
	emit<K extends PromptEventName>(eventName: K, context: PromptEventMap<TValue>[K]): void
	/** Subscribe to an event */
	on<K extends PromptEventName>(eventName: K, handler: PromptEventHandler<K, TValue>): void
	/** Subscribe to an event once */
	once<K extends PromptEventName>(eventName: K, handler: PromptEventHandler<K, TValue>): void
}

type PromptEventHandler<K extends PromptEventName, TValue> = (
	event: PromptEventMap<TValue>[K],
) => void

interface PromptEventListenerItem<K extends PromptEventName, TValue> {
	handler: PromptEventHandler<K, TValue>
	once?: boolean
}

function createPromptEventEmitter<TValue>(): PromptEventEmitter<TValue> {
	const listeners = new Map<PromptEventName, PromptEventListenerItem<PromptEventName, TValue>[]>()

	const setSubscriber = <K extends PromptEventName>(
		eventName: K,
		item: PromptEventListenerItem<K, TValue>,
	): void => {
		const callbacks = listeners.get(eventName) ?? []
		callbacks.push(item as PromptEventListenerItem<PromptEventName, TValue>)
		listeners.set(eventName, callbacks)
	}

	return {
		clear: () => listeners.clear(),
		emit: (eventName, context) => {
			const callbacks = listeners.get(eventName) ?? []
			const cleanUpFns: number[] = []

			callbacks.forEach((item, index) => {
				item.handler(context)
				if (item.once) {
					cleanUpFns.push(index)
				}
			})

			for (let i = cleanUpFns.length; i--; ) {
				callbacks.splice(cleanUpFns[i], 1)
			}
		},
		on: (eventName, handler) => setSubscriber(eventName, { handler }),
		once: (eventName, handler) => setSubscriber(eventName, { handler, once: true }),
	}
}

/* ----------------------------------------
 *   Prompt
 * ------------------------------------- */

export interface Prompt<TValue, TOptions = any> {
	shared: SharedPromptContext
	options: TOptions

	cursorPos: number
	error: string
	events: PromptEventEmitter<TValue>
	rl?: ReadLine
	state: PromptState
	userInput: string
	value: TValue

	close(newState?: PromptState): void
	prompt(): Promise<TValue | CancelSymbol>
	setValue(value: TValue): void
	shouldIgnoreKey: (char: string | undefined, key: Key) => boolean
	render(ctx: this, opts: TOptions, p: SharedPromptContext): string
}

export interface CommonPromptOptions<TValue, TSelf extends Prompt<TValue> = Prompt<TValue>>
	extends BasePromptOptions {
	initialValue?: TValue
	render?(ctx: TSelf, opts: TSelf['options'], p: SharedPromptContext): string
	signal?: AbortSignal
	validate?(value: TValue): string | Error | undefined
}

interface PromptInternalOptions {
	initialUserInput?: string
	trackValue: boolean
}

interface PromptOptions<TValue, TSelf extends Prompt<TValue> = Prompt<TValue>>
	extends CommonPromptOptions<TValue, TSelf>,
		PromptInternalOptions {}

export function createPrompt<TValue, TSelf extends Prompt<TValue> = Prompt<TValue>>(
	options: PromptOptions<TValue, TSelf>,
): TSelf {
	const { initialUserInput, trackValue, ...opts } = options as PromptOptions<TValue>

	const { input = shared.config.input, output = shared.config.output } = opts
	if (!opts.render) throw new Error('Prompt render function is not implemented')

	const events = createPromptEventEmitter<TValue>()
	let prevFrame = ''

	const p: Prompt<TValue> = {
		shared,
		options: opts,
		events,
		render: opts.render ?? (() => ''),

		// initial states
		cursorPos: 0,
		error: '',
		state: 'initial',
		userInput: '',
		value: opts.initialValue as TValue,

		close(newState) {
			if (newState) p.state = newState

			input.unpipe()
			input.off('keypress', onKeypress)
			// write('\n')
			setInputRawMode(false)

			if (p.rl) {
				p.rl.close()
				p.rl = undefined
			}

			events.emit('close', { state: p.state, value: p.value })
			events.clear()
		},

		prompt() {
			return new Promise((resolve) => {
				const { signal } = opts

				if (signal) {
					if (signal.aborted) {
						p.close('canceled')
						return resolve(cancelSymbol)
					}

					signal.addEventListener('abort', () => p.close('canceled'), { once: true })
				}

				p.rl = createInterface({
					escapeCodeTimeout: 50,
					input,
					prompt: '',
					tabSize: 2,
					terminal: true,
				})
				p.rl.prompt()

				if (initialUserInput !== undefined) {
					setUserInput(initialUserInput, true)
				}

				input.on('keypress', onKeypress)
				setInputRawMode(true)
				output.on('resize', _render)

				_render()

				events.once('close', ({ state, value }) => {
					output.write(ansi.cursor.show())
					output.off('resize', _render)
					setInputRawMode(false)

					resolve(state === 'completed' ? value : cancelSymbol)
				})
			})
		},

		setValue(value) {
			p.value = value
			events.emit('value', { value })
		},

		shouldIgnoreKey: (char) => char === '\t',
	}

	const onKeypress = (char: string | undefined, key: Key): void => {
		const { rl } = p
		if (!rl) return

		const action = shared.getMatchedAction([char, key.name, key.sequence])
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

		events.emit('keypress', keyInfo)

		if (action === 'cancel') p.state = 'canceled'

		if (trackValue && !isEnterAction) {
			if (p.shouldIgnoreKey(char, key)) {
				rl.write(null, { ctrl: true, name: 'h' })
			}

			setUserInput(rl.line)
			p.cursorPos = rl.cursor
		}

		if (p.state === 'error') p.state = 'active'

		if (isEnterAction) {
			const problem = opts.validate?.(p.value)
			if (problem) {
				p.error = problem instanceof Error ? problem.message : problem
				p.state = 'error'
				rl.write(p.userInput)
			}

			if (p.state !== 'error') p.state = 'completed'
		}

		if (p.state === 'completed' || p.state === 'canceled') {
			events.emit('finish', { state: p.state, value: p.value })
		}
		_render()
		if (p.state === 'completed' || p.state === 'canceled') {
			p.close()
		}
	}

	const _render = (): void => {
		const frame = hardWrap(p.render(p, opts, shared) ?? '', output)
		if (frame === prevFrame) return

		if (p.state === 'initial') {
			output.write(ansi.cursor.hide())
			p.state = 'active'
		} else {
			const diff = getDiffLines(prevFrame, frame)

			const lines = hardWrap(prevFrame, output).split('\n').length - 1
			output.write(ansi.cursor.prevLine(lines))

			if (diff.length === 1) {
				const diffLineNum = diff[0]
				output.write(ansi.cursor.move(0, diffLineNum))
				output.write(ansi.erase.lines(1))
				const lines = frame.split('\n')
				output.write(lines[diffLineNum])
				prevFrame = frame
				output.write(ansi.cursor.move(0, lines.length - diffLineNum - 1))
				return
			} else if (diff.length > 1) {
				const diffLineNum = diff[0]
				output.write(ansi.cursor.move(0, diffLineNum))
				output.write(ansi.erase.down())
				const lines = frame.split('\n')
				const newLines = lines.slice(diffLineNum)
				output.write(newLines.join('\n'))
				prevFrame = frame
				return
			}

			output.write(ansi.erase.down())
		}

		output.write(frame)
		prevFrame = frame
	}

	const setInputRawMode = (mode: boolean): void => {
		if (input instanceof ReadStream) input.setRawMode(mode)
	}

	const setUserInput = (value = '', write?: boolean): void => {
		p.userInput = value
		events.emit('userInput', { inputValue: value })

		if (write && trackValue) {
			p.rl?.write(value)
			p.cursorPos = p.rl?.cursor ?? 0
		}
	}

	return p as TSelf
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
	return wrapAnsi(str, cols, { hard: true, trim: false })
}
