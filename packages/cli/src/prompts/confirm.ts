import type { CancelSymbol } from './internal/utils'
import type { CommonPromptOptions } from './prompt'

import { color } from '../terminal'
import { Prompt } from './prompt'

/* ----------------------------------------
 *   ConfirmPrompt Class
 * ------------------------------------- */

type Value = boolean

interface ConfirmPromptOptions extends CommonPromptOptions<Value> {}

export class ConfirmPrompt<
	TOptions extends ConfirmPromptOptions = ConfirmPromptOptions,
> extends Prompt<Value> {
	declare opts: TOptions

	constructor(opts: ConfirmPromptOptions) {
		super({ ...opts, trackValue: false })

		this.on('keypress', ({ confirmed, isCursorAction }) => {
			if (typeof confirmed === 'boolean') {
				this.value = confirmed
				this.close('completed')
			}

			if (isCursorAction) this.value = !this.value
		})
	}
}

/* ----------------------------------------
 *   Confirm (Prompt Element)
 * ------------------------------------- */

interface ConfirmOptions extends ConfirmPromptOptions {
	active?: string
	inactive?: string
	message: string
	render?(this: ConfirmPrompt<ConfirmOptions>): string
}

const defaultOptions: Partial<ConfirmOptions> = {
	active: 'Yes',
	inactive: 'No',
	initialValue: true,

	render() {
		const { _s, state, value } = this
		const { active, inactive, message } = this.opts

		const { colors, S } = _s.config

		const title = _s.linePrefix() + _s.line(state, state, message)
		const valueText = value ? active : inactive

		switch (state) {
			case 'completed':
				return title + _s.lineBar('base', color.dim(valueText))
			case 'canceled':
				return title + _s.lineBar('base', color.strikethrough.dim(valueText))

			default: {
				const y = value
					? `${color[colors.focused](S.radio1)} ${active}`
					: `${color[colors.focused](S.radio0)} ${color.dim(active)}`
				const n = !value
					? `${color[colors.focused](S.radio1)} ${inactive}`
					: `${color[colors.focused](S.radio0)} ${color.dim(inactive)}`
				const sp = color.dim('/')

				return title + _s.lineBar(state, `${y} ${sp} ${n}`) + _s.lineEnd(state, '', true)
			}
		}
	},
}

export function confirm(options: ConfirmOptions): Promise<Value | CancelSymbol> {
	return new ConfirmPrompt({ ...defaultOptions, ...options }).prompt()
}
