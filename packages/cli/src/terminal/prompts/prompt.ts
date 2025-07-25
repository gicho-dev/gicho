import type { Key, ReadLine } from 'node:readline'
import type { Writable } from 'node:stream'
import type { LiteralStringUnion } from '@gicho/core/types'

import type { AnyTerminal } from '../types'

import { createInterface } from 'node:readline'
import { ReadStream, WriteStream } from 'node:tty'
import wrapAnsi from 'wrap-ansi'

import { SYMBOLS } from '../terminal.internal'

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
				if (item.once) cleanUpFns.push(index)
			})

			for (let i = cleanUpFns.length; i--; ) callbacks.splice(cleanUpFns[i], 1)
		},
		on: (eventName, handler) => setSubscriber(eventName, { handler }),
		once: (eventName, handler) => setSubscriber(eventName, { handler, once: true }),
	}
}

/* ----------------------------------------
 *   Prompt
 * ------------------------------------- */

export interface Prompt<TValue, TOptions = any> {
	options: TOptions

	cursorPos: number
	error: string
	events: PromptEventEmitter<TValue>
	rl?: ReadLine
	state: PromptState
	terminal: AnyTerminal
	userInput: string
	value: TValue

	close(newState?: PromptState): void
	prompt(): Promise<TValue | symbol>
	setValue(value: TValue): void
	shouldIgnoreKey: (char: string | undefined, key: Key) => boolean
	render(ctx: this, opts: TOptions, term: AnyTerminal): string
}

export interface CommonPromptOptions<TValue, TSelf extends Prompt<TValue> = Prompt<TValue>> {
	initialValue?: TValue
	render?(ctx: TSelf, opts: TSelf['options'], term: AnyTerminal): string
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
	term: AnyTerminal,
): TSelf {
	const { initialUserInput, trackValue, ...opts } = options as PromptOptions<TValue>

	const { input, output, write } = term
	if (!opts.render) throw new Error('Prompt render function is not implemented')

	const events = createPromptEventEmitter<TValue>()
	let prevFrame = ''

	const ctx: Prompt<TValue> = {
		options: opts,
		events,
		render: opts.render ?? (() => ''),
		terminal: term,

		// initial states
		cursorPos: 0,
		error: '',
		state: 'initial',
		userInput: '',
		value: opts.initialValue as TValue,

		close(newState) {
			if (newState) ctx.state = newState

			input.unpipe()
			input.off('keypress', onKeypress)
			// write('\n')
			setInputRawMode(false)

			if (ctx.rl) {
				ctx.rl.close()
				ctx.rl = undefined
			}

			events.emit('close', { state: ctx.state, value: ctx.value })
			events.clear()
		},

		prompt() {
			return new Promise((resolve) => {
				const { signal } = opts

				if (signal) {
					if (signal.aborted) {
						ctx.close('canceled')
						return resolve(SYMBOLS.PROMPT_CANCELED)
					}

					signal.addEventListener('abort', () => ctx.close('canceled'), { once: true })
				}

				ctx.rl = createInterface({
					input,
					tabSize: 2,
					prompt: '',
					escapeCodeTimeout: 50,
					terminal: true,
				})
				ctx.rl.prompt()

				if (initialUserInput !== undefined) setUserInput(initialUserInput, true)

				input.on('keypress', onKeypress)
				setInputRawMode(true)
				output.on('resize', _render)

				_render()

				events.once('close', ({ state, value }) => {
					term.cursorShow()
					output.off('resize', _render)
					setInputRawMode(false)

					resolve(state === 'completed' ? value : SYMBOLS.PROMPT_CANCELED)
				})
			})
		},

		setValue(value) {
			ctx.value = value
			events.emit('value', { value })
		},

		shouldIgnoreKey: (char) => char === '\t',
	}

	const onKeypress = (char: string | undefined, key: Key): void => {
		const { rl } = ctx
		if (!rl) return

		const action = term._P.getMatchedAction([char, key.name, key.sequence])
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

		if (action === 'cancel') ctx.state = 'canceled'

		if (trackValue && !isEnterAction) {
			if (ctx.shouldIgnoreKey(char, key)) rl.write(null, { ctrl: true, name: 'h' })

			setUserInput(rl.line)
			ctx.cursorPos = rl.cursor
		}

		if (ctx.state === 'error') ctx.state = 'active'

		if (isEnterAction) {
			const problem = opts.validate?.(ctx.value)
			if (problem) {
				ctx.error = problem instanceof Error ? problem.message : problem
				ctx.state = 'error'
				rl.write(ctx.userInput)
			}

			if (ctx.state !== 'error') ctx.state = 'completed'
		}

		if (ctx.state === 'completed' || ctx.state === 'canceled') {
			events.emit('finish', { state: ctx.state, value: ctx.value })
		}
		_render()
		if (ctx.state === 'completed' || ctx.state === 'canceled') ctx.close()
	}

	const _render = (): void => {
		const frame = hardWrap(ctx.render(ctx, opts, term) ?? '', output)
		if (frame === prevFrame) return

		if (ctx.state === 'initial') {
			term.cursorHide()
			ctx.state = 'active'
		} else {
			const diff = getDiffLines(prevFrame, frame)

			const lines = hardWrap(prevFrame, output).split('\n').length - 1
			term.cursorPrevLine(lines)

			if (diff.length === 1) {
				const diffLineNum = diff[0]
				term.cursorMove(0, diffLineNum)
				term.clearLines(1)
				const lines = frame.split('\n')
				write(lines[diffLineNum])
				prevFrame = frame
				term.cursorMove(0, lines.length - diffLineNum - 1)
				return
			} else if (diff.length > 1) {
				const diffLineNum = diff[0]
				term.cursorMove(0, diffLineNum)
				term.clearScreenDown()
				const lines = frame.split('\n')
				const newLines = lines.slice(diffLineNum)
				write(newLines.join('\n'))
				prevFrame = frame
				return
			}

			term.clearScreenDown()
		}

		write(frame)
		prevFrame = frame
	}

	const setInputRawMode = (mode: boolean): void => {
		if (input instanceof ReadStream) input.setRawMode(mode)
	}

	const setUserInput = (value = '', write?: boolean): void => {
		ctx.userInput = value
		events.emit('userInput', { inputValue: value })

		if (write && trackValue) {
			ctx.rl?.write(value)
			ctx.cursorPos = ctx.rl?.cursor ?? 0
		}
	}

	return ctx as TSelf
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

	for (let i = 0; i < maxLen; i++) if (aLines[i] !== bLines[i]) diff.push(i)

	return diff
}

function hardWrap(str: string, output: Writable): string {
	const cols = output instanceof WriteStream && output.columns ? output.columns : 80
	return wrapAnsi(str, cols, { hard: true, trim: false })
}
