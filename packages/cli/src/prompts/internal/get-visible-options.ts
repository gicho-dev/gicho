import type { OutputOptions } from '../prompts.types'

import { color, getRows } from '../../terminal'

export interface GetVisibleOptionsParams<TOption> extends OutputOptions {
	cursorIndex: number
	limit?: number
	options: TOption[]
	render: (option: TOption, focused: boolean) => string
	renderOverflow?: (where: 'top' | 'bottom') => string
}

const MARGIN_LINES = 4
const MIN_VISIBLE_LINES = 4 // less than 4 lines feels visually cramped and awkward

export const getVisibleOptions = <TOption>(opts: GetVisibleOptionsParams<TOption>): string[] => {
	const {
		cursorIndex,
		limit = Infinity,
		options,
		output = process.stdout,
		renderOverflow = () => color.dim('...'),
		render,
	} = opts

	const availableLines = Math.max(getRows(output, 10) - MARGIN_LINES, 0)
	const maxVisibleLines = Math.min(availableLines, Math.max(limit, MIN_VISIBLE_LINES))

	const optionsLength = options.length
	const start =
		cursorIndex <= 2
			? 0
			: cursorIndex >= maxVisibleLines - 3
				? Math.min(cursorIndex - (maxVisibleLines - 3), optionsLength - maxVisibleLines)
				: cursorIndex - 2
	const end = start + maxVisibleLines

	const showTopEllipsis = maxVisibleLines < optionsLength && start > 0
	const showBottomEllipsis = maxVisibleLines < optionsLength && end < optionsLength

	return options.slice(start, end).map((option, i, arr) => {
		const isTopEllipsis = i === 0 && showTopEllipsis
		const isBottomEllipsis = i === arr.length - 1 && showBottomEllipsis

		if (isTopEllipsis) return renderOverflow('top')
		if (isBottomEllipsis) return renderOverflow('bottom')

		return render(option, i + start === cursorIndex)
	})
}
