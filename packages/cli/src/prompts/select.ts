import type { CancelSymbol } from './internal/utils'
import type { CommonPromptOptions } from './prompt'

import { color } from '../terminal/ansi'
import { getVisibleOptions } from './internal/get-visible-options'
import { Prompt } from './prompt'

/* ----------------------------------------
 *   SelectPrompt Class
 * ------------------------------------- */

interface IOption<TValue = any> {
	value: TValue
}

interface SelectPromptOptions<TValue, TOption extends IOption<TValue>>
	extends CommonPromptOptions<TValue> {
	options: TOption[]
}

export class SelectPrompt<
	T,
	TOpt extends IOption<T>,
	TOptions extends SelectPromptOptions<T, TOpt> = SelectPromptOptions<T, TOpt>,
> extends Prompt<T> {
	declare opts: TOptions

	protected selectedIndex: number

	constructor(opts: TOptions) {
		super({ ...opts, trackValue: false })

		this.selectedIndex = opts.options.findIndex((o) => o.value === opts.initialValue)
		if (this.selectedIndex === -1) this.selectedIndex = 0

		this.value = opts.options[this.selectedIndex].value

		this.on('keypress', ({ action, isCursorAction }) => {
			if (isCursorAction) {
				switch (action) {
					case 'left':
					case 'up':
						this.selectedIndex =
							this.selectedIndex === 0 ? opts.options.length - 1 : this.selectedIndex - 1
						break

					case 'right':
					case 'down':
						this.selectedIndex =
							this.selectedIndex === opts.options.length - 1 ? 0 : this.selectedIndex + 1
						break
				}
				this.value = opts.options[this.selectedIndex].value
			}
		})
	}
}

/* ----------------------------------------
 *   Select (Prompt Element)
 * ------------------------------------- */

interface Option<TValue> {
	/**
	 * The internal value of this option.
	 */
	value: TValue
	/**
	 * An optional hint to display when this option is selected.
	 */
	hint?: string
	/**
	 * An optional label to display.
	 */
	label?: string
}

interface SelectOptions<TValue> extends SelectPromptOptions<TValue, Option<TValue>> {
	message: string
	options: Option<TValue>[]
	/**
	 * The maximum number of lines to display in the prompt.
	 */
	maxVisibleLines?: number
	render?(this: SelectPrompt<TValue, Option<TValue>, SelectOptions<TValue>>): string
}

const defaultOptions: Partial<SelectOptions<unknown>> = {
	render() {
		const { _s, selectedIndex, state, output } = this
		const { maxVisibleLines, message, options } = this.opts

		const { colors, S } = _s.config

		const _opt = (
			option: Option<unknown>,
			state: 'default' | 'focused' | 'selected' | 'canceled',
		): string => {
			const label = option.label ?? String(option.value)

			switch (state) {
				case 'focused':
					return `${color[colors.focused](S.radio1)} ${label}${option.hint ? ` ${color.dim(option.hint)}` : ''}`
				case 'selected':
					return color.dim(label)
				case 'canceled':
					return color.strikethrough.dim(label)
				default:
					return `${color.dim(S.radio0)} ${color.dim(label)}`
			}
		}

		const title = _s.linePrefix() + _s.line(state, state, message)

		switch (state) {
			case 'completed':
				return title + _s.lineBar('base', _opt(options[selectedIndex], 'selected'))
			case 'canceled':
				return title + _s.lineBar('base', _opt(options[selectedIndex], state))
			default: {
				const items = getVisibleOptions({
					cursorIndex: this.selectedIndex,
					limit: maxVisibleLines,
					options,
					output,
					render: (opt, focused) => _s.lineBar(state, _opt(opt, focused ? 'focused' : 'default')),
					renderOverflow: () => _s.lineBar(state, color.dim('...')),
				}).join('')
				return title + items + _s.lineEnd(state, '', true)
			}
		}
	},
}

export function select<TValue>(
	options: SelectOptions<TValue>,
): Promise<Option<TValue> | CancelSymbol> {
	return new SelectPrompt({ ...defaultOptions, ...options }).prompt() as Promise<
		Option<TValue> | CancelSymbol
	>
}
