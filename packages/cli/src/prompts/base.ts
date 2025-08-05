import type { PartialDeep } from '@gicho/core/types'

import type { CancelSymbol } from './internal/utils'
import type { OutputOptions, SharedPromptConfig } from './prompts.types'

import { mergeConfigsInto } from '@gicho/core/object'

import { shared } from './internal/shared'
import { cancelSymbol } from './internal/utils'

/* ----------------------------------------
 *   Base prompt functions
 * ------------------------------------- */

export function start(message: string, options: OutputOptions = {}): void {
	const { output = shared.config.output } = options
	output.write(shared.line('base', 'start', message))
	shared.isActive = true
}

export function end(message: string, options: OutputOptions = {}): void {
	const { output = shared.config.output } = options
	output.write(shared.linePrefix() + shared.lineEnd('base', message))
	shared.isActive = false
}

export function cancel(message: string, options: OutputOptions = {}): void {
	const { output = shared.config.output } = options
	output.write(shared.linePrefix() + shared.lineEnd('base', message))
	shared.isActive = false
}

/**
 * Returns whether the given result indicates that the prompt was canceled.
 */
export function isCanceled(result: unknown): result is CancelSymbol {
	return result === cancelSymbol
}

/**
 * Updates the shared prompt config.
 */
export function updateConfig(options: PartialDeep<SharedPromptConfig>): SharedPromptConfig {
	return mergeConfigsInto(shared.config, options) as SharedPromptConfig
}
