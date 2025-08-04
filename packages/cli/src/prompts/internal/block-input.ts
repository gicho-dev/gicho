import type { Key } from 'node:readline'

import type { BasePromptOptions } from '../prompts.types'

import { createInterface, emitKeypressEvents } from 'node:readline'
import { ReadStream } from 'node:tty'

import { isWindows } from '../../env'
import { ansi } from '../../terminal'
import { shared } from './shared'

export interface BlockInputOptions extends BasePromptOptions {}

/**
 * Block the input of the terminal, and return a function to unblock the input.
 *
 * @example
 * ```
 * const unblock = blockInput({ term })
 * unblock()
 * ```
 */
export function blockInput(options: BlockInputOptions = {}): () => void {
	const { input = shared.config.input, output = shared.config.output } = options

	const rl = createInterface({ input, tabSize: 1 })
	emitKeypressEvents(input, rl)

	if (input instanceof ReadStream && input.isTTY) input.setRawMode(true)

	const clear = (char: string | undefined, { name, sequence }: Key): void => {
		const action = shared.getMatchedAction([char, name, sequence])
		if (action === 'cancel') {
			output.write(ansi.cursor.show())
			process.exit(0)
		}

		// const dx = name === 'return' ? 0 : -1
		// const dy = name === 'return' ? 0 : 0
		// term.cursorMove(dx, dy)
		// term.clearLine(1)

		input.once('keypress', clear)
	}

	output.write(ansi.cursor.hide())
	input.once('keypress', clear)

	return () => {
		input.off('keypress', clear)
		output.write(ansi.cursor.show())

		// Prevent Windows specific issue
		if (input instanceof ReadStream && input.isTTY && !isWindows) input.setRawMode(false)

		// @ts-expect-error: fix for https://github.com/nodejs/node/issues/31762#issuecomment-1441223907
		rl.terminal = false
		rl.close()
	}
}
