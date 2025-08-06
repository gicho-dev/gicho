import type { Awaitable, Voidable } from '@gicho/core/types'

import type { CreateSpinnerOptions, Spinner } from './create-spinner'

import { createSpinner } from './create-spinner'

export interface Task {
	/**
	 * If `enabled` is `false`, the task will be skipped.
	 * @default true
	 */
	enabled?: boolean
	/** Task title. */
	title: string
	/** Task function. */
	task(context: TaskFnContext): Awaitable<Voidable<string>>
}

interface TaskFnContext {
	setMessage: Spinner['setMessage']
}

/**
 * Executes a list of tasks sequentially with spinner feedback.
 *
 * - Each task is displayed with a spinner while running.
 * - Skips tasks explicitly marked as `enabled: false`.
 * - Spinner shows the task title while running and updates with result message when done.
 */
export async function runTasks(tasks: Task[], opts?: CreateSpinnerOptions): Promise<void> {
	for (const task of tasks) {
		if (task.enabled === false) continue

		const { setMessage, start, stop } = createSpinner(opts)
		start(task.title)
		const result = await task.task({ setMessage })
		stop(result || task.title)
	}
}
