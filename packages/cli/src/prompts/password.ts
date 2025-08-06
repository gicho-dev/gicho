import type { CancelSymbol } from './internal/utils'
import type { CommonPromptOptions } from './prompt'

import { color } from '../terminal/ansi'
import { unicodeOr } from './internal/utils'
import { Prompt } from './prompt'

/* ----------------------------------------
 *   PasswordPrompt Class
 * ------------------------------------- */

type Value = string

interface PasswordPromptOptions extends CommonPromptOptions<Value> {
	/**
	 * The character to mask the password with.
	 * @default '*'
	 */
	mask?: string
}

export class PasswordPrompt<
	TOptions extends PasswordPromptOptions = PasswordPromptOptions,
> extends Prompt<Value> {
	declare opts: TOptions

	constructor(options: TOptions) {
		super({
			...options,
			trackValue: true,
		})

		this.opts.mask = options.mask ?? '*'

		this.on('userInput', ({ inputValue }) => {
			this.setValue(inputValue)
		})
	}

	get cursor(): number {
		return this.cursorPos
	}

	get maskedValue(): string {
		return (this.opts.mask as string).repeat(this.value.length)
	}

	protected getUserInputWithCursor(): string {
		const { _s, cursorPos, state, userInput } = this

		const masked = this.maskedValue

		if (state === 'completed' || state === 'canceled') {
			return masked
		}
		if (cursorPos >= userInput.length) {
			return `${masked}${_s.config.S.caret}`
		}

		const before = masked.slice(0, cursorPos)
		const cur = masked[cursorPos]
		const after = masked.slice(cursorPos + 1)

		return `${before}${color.inverse(cur)}${after}`
	}
}

/* ----------------------------------------
 *   Password (Prompt Element)
 * ------------------------------------- */

interface PasswordOptions extends PasswordPromptOptions {
	/**
	 * The character to mask the password with.
	 * @default '▪' (fallback to '*')
	 */
	mask?: string
	message: string
	render?(this: PasswordPrompt<PasswordOptions>): string
}

const defaultOptions: Partial<PasswordOptions> = {
	mask: unicodeOr('▪', '*'),

	render() {
		const { _s, error, state } = this
		const { message } = this.opts

		const { colors } = _s.config

		const title = _s.linePrefix() + _s.line(state, state, message)
		const input = this.getUserInputWithCursor()
		const masked = this.maskedValue

		switch (state) {
			case 'error':
				return title + _s.lineBar(state, input) + _s.lineEnd(state, color[colors[state]](error))
			case 'completed':
				return title + _s.lineBar('base', color.dim(masked))
			case 'canceled':
				return title + _s.lineBar('base', color.strikethrough.dim(masked))
			default:
				return title + _s.lineBar(state, input) + _s.lineEnd(state, '', true)
		}
	},
}

export function password(options: PasswordOptions): Promise<Value | CancelSymbol> {
	return new PasswordPrompt({ ...defaultOptions, ...options }).prompt()
}
