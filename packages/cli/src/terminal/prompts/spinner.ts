import type { RequiredByKeys } from '@gicho/core/types'

import type { AnsiBaseTextColor } from '../ansi'
import type { TerminalPlugin } from '../types'

import { isCI } from '../../env'
import { blockInput, unicodeOr } from '../terminal.internal'
import { getWrappedLineCount } from '../utils'

export interface TerminalSpinner {
	/** Prompt spinner */
	spinner(options?: TerminalSpinnerOptions): {
		start(message?: string): void
		stop(message?: string, code?: number): void
		message(message?: string): void
		get isCanceled(): boolean
	}
}
type FnReturn = ReturnType<TerminalSpinner['spinner']>

export interface TerminalSpinnerOptions {
	cancelMessage?: string
	delay?: number
	errorMessage?: string
	indicator?: 'dots' | 'timer'
	onCancel?: () => void
	signal?: AbortSignal
	symbolColor?: AnsiBaseTextColor
	symbols?: string[]
}

const defaultSpinnerOptions: TerminalSpinnerOptions = {
	cancelMessage: 'Canceled',
	delay: unicodeOr(80, 120),
	errorMessage: 'Something went wrong',
	indicator: 'dots',
	symbolColor: 'cyan',
	symbols: unicodeOr(['◒', '◐', '◓', '◑'], ['|', '/', '-', '\\']),
	// symbols: unicodeOr(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], ['|', '/', '-', '\\']),
}

export function promptSpinner(
	baseOptions: TerminalSpinnerOptions = {},
): TerminalPlugin<TerminalSpinner> {
	return (term, cfg) => ({
		spinner: (options = {}) => {
			const opts = { ...defaultSpinnerOptions, ...baseOptions, ...options }
			const { indicator, symbolColor, symbols } = opts as RequiredByKeys<
				TerminalSpinnerOptions,
				'symbols' | 'symbolColor'
			>

			const { _P, style, write } = term
			const { colors, S } = cfg.prompt

			const CI = isCI()

			let unblock: () => void
			let isActive = false
			let isCanceled = false
			let msg = ''
			let prevLineCount: number = 0
			let prevMsg: string | undefined
			let startTime: number
			let frameId: NodeJS.Timeout

			const handlers = {
				error: () => handlers.exit(2),
				signal: () => handlers.exit(1),
				exit: (code: number) => {
					const msg = code > 1 ? opts.errorMessage : opts.cancelMessage
					isCanceled = code === 1
					if (isActive) {
						stop(msg, code)
						if (isCanceled) opts.onCancel?.()
					}
				},
			}

			const registerHooks = (): void => {
				// Reference: https://nodejs.org/api/process.html#event-uncaughtexception
				process.on('uncaughtExceptionMonitor', handlers.error)
				// Reference: https://nodejs.org/api/process.html#event-unhandledrejection
				process.on('unhandledRejection', handlers.error)

				// Reference Signal Events: https://nodejs.org/api/process.html#signal-events
				process.on('SIGINT', handlers.signal)
				process.on('SIGTERM', handlers.signal)
				if (opts.signal) opts.signal.addEventListener('abort', handlers.signal)

				process.on('exit', handlers.exit)
			}

			const clearHooks = (): void => {
				process.off('uncaughtExceptionMonitor', handlers.error)
				process.off('unhandledRejection', handlers.error)

				process.off('SIGINT', handlers.signal)
				process.off('SIGTERM', handlers.signal)
				if (opts.signal) opts.signal.removeEventListener('abort', handlers.signal)

				process.off('exit', handlers.exit)
			}

			const clearPrevMessage = (): void => {
				if (prevMsg === undefined) return
				if (CI) return void write('\n')

				if (prevLineCount > 1) {
					term.cursorPrevLine(prevLineCount - 1)
				} else {
					term.cursorLineStart()
				}
				term.clearScreenDown()

				// Note:
				// if _prevLineCount is greater than the number of visible output rows,
				// lines that have scrolled into the buffer cannot be cleared.
			}

			const formatTimer = (start: number): string => {
				const duration = (performance.now() - start) / 1000
				const mins = Math.floor(duration / 60)
				const secs = Math.floor(duration % 60)
				return mins > 0 ? `[${mins}m ${secs}s]` : `[${secs}s]`
			}

			const start: FnReturn['start'] = (message = '') => {
				isActive = true

				unblock = blockInput({ term })

				msg = removeTrailingDots(message)
				startTime = performance.now()

				write(_P.linePrefix())

				let frameIndex = 0
				let indicatorTimer = 0
				registerHooks()

				frameId = setInterval(() => {
					if (CI && msg === prevMsg) return

					clearPrevMessage()
					prevMsg = msg

					const frameChar = style[symbolColor](symbols[frameIndex])

					let str
					if (CI) {
						str = _P.lineRaw(frameChar, `${msg}...`, true)
					} else if (indicator === 'timer') {
						str = _P.lineRaw(frameChar, `${msg} ${formatTimer(startTime)}`, true)
					} else {
						const loadingDots = '.'.repeat(Math.floor(indicatorTimer)).slice(0, 3)
						str = _P.lineRaw(frameChar, `${msg}${loadingDots}`, true)
					}

					prevLineCount = getWrappedLineCount(str, term.columns)
					write(str)

					frameIndex += 1
					if (frameIndex === symbols.length) frameIndex = 0

					indicatorTimer = indicatorTimer < 4 ? indicatorTimer + 0.25 : 0
				}, opts.delay)
			}

			const stop: FnReturn['stop'] = (message = '', code = 0) => {
				isActive = false
				clearInterval(frameId)
				clearPrevMessage()

				const symbol =
					code === 0
						? style[colors.completed](S.completed)
						: code === 1
							? style[colors.canceled](S.canceled)
							: style.red(S.error)

				msg = message ?? msg

				if (indicator === 'timer') {
					write(_P.lineRaw(symbol, `${msg} ${formatTimer(startTime)}`))
				} else {
					write(_P.lineRaw(symbol, msg))
				}

				clearHooks()
				unblock()
			}

			return {
				start,
				stop,

				message: (message) => {
					msg = removeTrailingDots(message ?? msg)
				},

				get isCanceled() {
					return isCanceled
				},
			}
		},
	})
}

/* ----------------------------------------
 *   Internal utils
 * ------------------------------------- */

const removeTrailingDots = (str?: string): string => str?.replace(/\.+\s*$/, '') ?? ''
