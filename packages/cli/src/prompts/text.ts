import type { CancelSymbol } from './internal/utils'
import type { CommonPromptOptions } from './prompt'

import { ansi } from '../terminal/ansi'
import { Prompt } from './prompt'

/* ----------------------------------------
 *   TextPrompt Class
 * ------------------------------------- */

type Value = string

interface TextPromptOptions extends CommonPromptOptions<Value> {
	defaultValue?: Value
}

export class TextPrompt<
	TOptions extends TextPromptOptions = TextPromptOptions,
> extends Prompt<Value> {
	declare opts: TOptions

	constructor(options: TOptions) {
		super({
			...options,
			initialUserInput: options.initialValue,
			trackValue: true,
		})

		this.on('userInput', ({ inputValue }) => {
			this.setValue(inputValue)
		})

		this.on('finish', () => {
			if (!this.value) {
				this.value = options.defaultValue ?? ''
			}
		})
	}

	protected getUserInputWithCursor(): string {
		const { _s, cursorPos, state, userInput } = this

		if (state === 'completed') {
			return userInput
		}
		if (cursorPos >= userInput.length) {
			return `${userInput}${_s.config.S.caret}`
		}

		const before = userInput.slice(0, cursorPos)
		const cur = userInput.at(cursorPos)
		const after = userInput.slice(cursorPos + 1)

		return `${before}${ansi.c.inverse(cur)}${after}`
	}
}

/* ----------------------------------------
 *   Text (Prompt Element)
 * ------------------------------------- */

interface TextOptions extends TextPromptOptions {
	message: string
	placeholder?: string
	render?(this: TextPrompt<TextOptions>): string
}

const defaultOptions: Partial<TextOptions> = {
	render() {
		const { _s, error, state, value = '' } = this
		const { message, placeholder } = this.opts

		const { colors } = _s.config

		const title = _s.linePrefix() + _s.line(state, state, message)

		const placeholderText = placeholder
			? ansi.c.inverse(placeholder[0]) + ansi.c.dim(placeholder.slice(1))
			: ansi.c.inverse(ansi.c.hidden('_'))
		const input = this.userInput ? this.getUserInputWithCursor() : placeholderText

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

export function text(options: TextOptions): Promise<Value | CancelSymbol> {
	return new TextPrompt({ ...defaultOptions, ...options }).prompt()
}
