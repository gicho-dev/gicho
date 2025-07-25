import type { AnyTerminal, TerminalPlugin } from '../types'
import type { CommonPromptOptions, Prompt } from './prompt'

import { createPrompt } from './prompt'

/* ----------------------------------------
 *   Confirm Prompt
 * ------------------------------------- */

type Value = boolean

interface ConfirmPrompt extends Prompt<Value, ConfirmPromptOptions> {
	getUserInputWithCursor(): string
}

interface ConfirmPromptOptions extends CommonPromptOptions<Value, ConfirmPrompt> {
	active?: string
	inactive?: string
	message: string
}

export function createConfirmPrompt(opts: ConfirmPromptOptions, term: AnyTerminal): ConfirmPrompt {
	const ctx = createPrompt<Value, ConfirmPrompt>({ ...opts, trackValue: false }, term)

	ctx.events.on('keypress', ({ confirmed, isCursorAction }) => {
		if (typeof confirmed === 'boolean') {
			ctx.value = confirmed
			ctx.close('completed')
		}

		if (isCursorAction) ctx.value = !ctx.value
	})

	return ctx
}

/* ----------------------------------------
 *   Terminal Confirm Prompt
 * ------------------------------------- */

interface TerminalConfirmPrompt {
	confirm(options: ConfirmPromptOptions): Promise<Value | symbol>
}

interface TerminalConfirmPromptOptions
	extends Pick<ConfirmPromptOptions, 'active' | 'inactive' | 'initialValue' | 'render'> {}

const defaultConfirmPromptOptions: TerminalConfirmPromptOptions = {
	active: 'Yes',
	inactive: 'No',
	initialValue: true,

	render(ctx, opts, term) {
		const { state, value } = ctx
		const { active, inactive, message } = opts

		const { style, _P } = term
		const { colors, S } = term.config.prompt

		const title = _P.linePrefix() + _P.line(state, state, message)
		const valueText = value ? active : inactive

		switch (state) {
			case 'completed':
				return title + _P.lineBar('base', style.dim(valueText))
			case 'canceled':
				return title + _P.lineBar('base', style.strikethrough.dim(valueText))

			default: {
				const y = value
					? `${style[colors.focused](S.radio1)} ${active}`
					: `${style[colors.focused](S.radio0)} ${style.dim(active)}`
				const n = !value
					? `${style[colors.focused](S.radio1)} ${inactive}`
					: `${style[colors.focused](S.radio0)} ${style.dim(inactive)}`
				const sp = style.dim('/')

				return title + _P.lineBar(state, `${y} ${sp} ${n}`) + _P.lineEnd(state, '', true)
			}
		}
	},
}

export function promptConfirm(
	baseOptions?: TerminalConfirmPromptOptions,
): TerminalPlugin<TerminalConfirmPrompt> {
	const baseOpts = { ...defaultConfirmPromptOptions, ...baseOptions }

	return (term) => ({
		confirm: (options) => createConfirmPrompt({ ...baseOpts, ...options }, term).prompt(),
	})
}
