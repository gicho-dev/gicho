import type { CancelSymbol } from './internal/utils'
import type { CommonPromptOptions, Prompt } from './prompt'

import { ansi } from '../terminal'
import { createPrompt } from './prompt'

/* ----------------------------------------
 *   Confirm Prompt Factory
 * ------------------------------------- */

type Value = boolean

interface ConfirmPrompt extends Prompt<Value, ConfirmPromptOptions> {}

interface ConfirmPromptOptions extends CommonPromptOptions<Value, ConfirmPrompt> {
	active?: string
	inactive?: string
	message: string
}

export function createConfirmPrompt(opts: ConfirmPromptOptions): ConfirmPrompt {
	const p = createPrompt<Value, ConfirmPrompt>({ ...opts, trackValue: false })

	p.events.on('keypress', ({ confirmed, isCursorAction }) => {
		if (typeof confirmed === 'boolean') {
			p.value = confirmed
			p.close('completed')
		}

		if (isCursorAction) p.value = !p.value
	})

	return p
}

/* ----------------------------------------
 *   Confirm (Prompt Element)
 * ------------------------------------- */

const defaultOptions: Partial<ConfirmPromptOptions> = {
	active: 'Yes',
	inactive: 'No',
	initialValue: true,

	render(p, opts, _s) {
		const { state, value } = p
		const { active, inactive, message } = opts

		const { colors, S } = _s.config

		const title = _s.linePrefix() + _s.line(state, state, message)
		const valueText = value ? active : inactive

		switch (state) {
			case 'completed':
				return title + _s.lineBar('base', ansi.c.dim(valueText))
			case 'canceled':
				return title + _s.lineBar('base', ansi.c.strikethrough.dim(valueText))

			default: {
				const y = value
					? `${ansi.c[colors.focused](S.radio1)} ${active}`
					: `${ansi.c[colors.focused](S.radio0)} ${ansi.c.dim(active)}`
				const n = !value
					? `${ansi.c[colors.focused](S.radio1)} ${inactive}`
					: `${ansi.c[colors.focused](S.radio0)} ${ansi.c.dim(inactive)}`
				const sp = ansi.c.dim('/')

				return title + _s.lineBar(state, `${y} ${sp} ${n}`) + _s.lineEnd(state, '', true)
			}
		}
	},
}

export function confirm(options: ConfirmPromptOptions): Promise<Value | CancelSymbol> {
	return createConfirmPrompt({ ...defaultOptions, ...options }).prompt()
}
