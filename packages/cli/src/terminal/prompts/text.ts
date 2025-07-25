import type { AnyTerminal, TerminalPlugin } from '../types'
import type { CommonPromptOptions, Prompt } from './prompt'

import { createPrompt } from './prompt'

/* ----------------------------------------
 *   Text Prompt
 * ------------------------------------- */

type Value = string

interface TextPrompt extends Prompt<Value, TextPromptOptions> {
	getUserInputWithCursor(): string
}

interface TextPromptOptions extends CommonPromptOptions<Value, TextPrompt> {
	defaultValue?: Value
	message: string
	placeholder?: string
}

export function createTextPrompt(opts: TextPromptOptions, term: AnyTerminal): TextPrompt {
	const { style } = term
	const { S } = term.config.prompt

	const ctx = createPrompt<Value, TextPrompt>(
		{ ...opts, initialUserInput: opts.initialValue, trackValue: true },
		term,
	)
	const { options, events, setValue } = ctx

	Object.assign(ctx, {
		getUserInputWithCursor(): string {
			const { cursorPos, state, userInput } = ctx

			if (state === 'completed') return userInput
			if (cursorPos >= userInput.length) return `${userInput}${S.caret}`

			const before = userInput.slice(0, cursorPos)
			const cur = userInput.at(cursorPos)
			const after = userInput.slice(cursorPos + 1)

			return `${before}${style.inverse(cur)}${after}`
		},
	})

	events.on('userInput', ({ inputValue }) => {
		setValue(inputValue)
	})
	events.on('finish', () => {
		if (!ctx.value) ctx.value = options.defaultValue ?? ''
	})

	return ctx
}

/* ----------------------------------------
 *   Terminal Text Prompt
 * ------------------------------------- */

interface TerminalTextPrompt {
	text(options: TextPromptOptions): Promise<Value | symbol>
}

interface TerminalTextPromptOptions extends Pick<TextPromptOptions, 'render'> {}

const defaultTextPromptOptions: TerminalTextPromptOptions = {
	render(ctx, opts, term) {
		const { error, state, userInput, value = '' } = ctx
		const { message, placeholder } = opts

		const { style, _P } = term
		const { colors } = term.config.prompt

		const title = _P.linePrefix() + _P.line(state, state, message)

		const placeholderText = placeholder
			? style.inverse(placeholder[0]) + style.dim(placeholder.slice(1))
			: style.inverse(style.hidden('_'))
		const input = userInput ? ctx.getUserInputWithCursor() : placeholderText

		switch (state) {
			case 'error':
				return title + _P.lineBar(state, input) + _P.lineEnd(state, style[colors[state]](error))
			case 'completed':
				return title + _P.lineBar('base', style.dim(value))
			case 'canceled':
				return title + _P.lineBar('base', style.strikethrough.dim(value))
			default:
				return title + _P.lineBar(state, input) + _P.lineEnd(state, '', true)
		}
	},
}

export function promptText(
	baseOptions?: TerminalTextPromptOptions,
): TerminalPlugin<TerminalTextPrompt> {
	const baseOpts = { ...defaultTextPromptOptions, ...baseOptions }

	return (term) => ({
		text: (options) => createTextPrompt({ ...baseOpts, ...options }, term).prompt(),
	})
}
