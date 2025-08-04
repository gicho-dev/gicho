import type { CancelSymbol } from './internal/utils'
import type { CommonPromptOptions, Prompt } from './prompt'

import { ansi } from '../terminal/ansi'
import { createPrompt } from './prompt'

/* ----------------------------------------
 *   Text Prompt Factory
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

export function createTextPrompt(opts: TextPromptOptions): TextPrompt {
	const p = createPrompt<Value, TextPrompt>({
		...opts,
		initialUserInput: opts.initialValue,
		trackValue: true,
	})
	const { options, events, setValue, shared: g } = p

	Object.assign(p, {
		getUserInputWithCursor(): string {
			const { cursorPos, state, userInput } = p

			if (state === 'completed') {
				return userInput
			}
			if (cursorPos >= userInput.length) {
				return `${userInput}${g.config.S.caret}`
			}

			const before = userInput.slice(0, cursorPos)
			const cur = userInput.at(cursorPos)
			const after = userInput.slice(cursorPos + 1)

			return `${before}${ansi.c.inverse(cur)}${after}`
		},
	})

	events.on('userInput', ({ inputValue }) => {
		setValue(inputValue)
	})
	events.on('finish', () => {
		if (!p.value) {
			p.value = options.defaultValue ?? ''
		}
	})

	return p
}

/* ----------------------------------------
 *   Text (Prompt Element)
 * ------------------------------------- */

const defaultOptions: Partial<TextPromptOptions> = {
	render(p, opts, _s) {
		const { error, state, userInput, value = '' } = p
		const { message, placeholder } = opts

		const { colors } = _s.config

		const title = _s.linePrefix() + _s.line(state, state, message)

		const placeholderText = placeholder
			? ansi.c.inverse(placeholder[0]) + ansi.c.dim(placeholder.slice(1))
			: ansi.c.inverse(ansi.c.hidden('_'))
		const input = userInput ? p.getUserInputWithCursor() : placeholderText

		switch (state) {
			case 'error':
				return title + _s.lineBar(state, input) + _s.lineEnd(state, ansi.c[colors[state]](error))
			case 'completed':
				return title + _s.lineBar('base', ansi.c.dim(value))
			case 'canceled':
				return title + _s.lineBar('base', ansi.c.strikethrough.dim(value))
			default:
				return title + _s.lineBar(state, input) + _s.lineEnd(state, '', true)
		}
	},
}

export function text(options: TextPromptOptions): Promise<Value | CancelSymbol> {
	return createTextPrompt({ ...defaultOptions, ...options }).prompt()
}
