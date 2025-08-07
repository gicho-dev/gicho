import EventEmitter from 'node:events'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import * as p from '../../src/prompts'
import { shared } from '../../src/prompts/internal/shared'
import { MockWritable } from '../terminal/terminal.test-utils'

describe.each(['true', 'false'])('prompts/spinner (isCI = %s)', (isCI) => {
	let origCI: string | undefined
	let output: MockWritable

	beforeAll(() => {
		origCI = process.env.CI
		process.env.CI = isCI
	})
	beforeEach(() => {
		shared.isActive = false
		output = new MockWritable()
		p.updateConfig({ output })
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.restoreAllMocks()
	})
	afterAll(() => {
		process.env.CI = origCI
	})

	describe('basic', () => {
		test('renders frames at interval', () => {
			const result = p.createSpinner()
			result.start()
			for (let i = 0; i < 4; i++) vi.advanceTimersByTime(80) // 4 frames
			result.stop()

			expect(output.buffer).toMatchSnapshot()
		})

		test('renders after another prompt elements', () => {
			p.start('Test 1')

			const result = p.createSpinner()
			result.start()
			for (let i = 0; i < 4; i++) vi.advanceTimersByTime(80) // 4 frames
			result.stop()

			expect(output.buffer).toMatchSnapshot()
		})

		test('renders timer when indicator is "timer"', () => {
			const result = p.createSpinner({ indicator: 'timer' })
			result.start('START')
			vi.advanceTimersByTime(80)
			result.stop('STOP')

			expect(output.buffer).toMatchSnapshot()
		})

		test('renders cancel symbol if code = 1', () => {
			const result = p.createSpinner()
			result.start()
			vi.advanceTimersByTime(80)
			result.stop('STOP', 1)
			vi.advanceTimersByTime(80)

			expect(output.buffer).toMatchSnapshot()
		})

		test('renders error message if code > 1', () => {
			const result = p.createSpinner()
			result.start()
			vi.advanceTimersByTime(80)
			result.stop('STOP', 2)
			vi.advanceTimersByTime(80)

			expect(output.buffer).toMatchSnapshot()
		})

		test('renders messages (with multiple lines)', () => {
			const result = p.createSpinner()
			result.start('START')
			vi.advanceTimersByTime(80)
			result.setMessage('message 1')
			vi.advanceTimersByTime(80)
			result.setMessage('Long Text\n'.repeat(5).slice(0, -1)) // need prevLine * (5- 1)
			vi.advanceTimersByTime(80)
			result.setMessage('Long Text\n'.repeat(10).slice(0, -1)) // need prevLine * (10- 1)
			vi.advanceTimersByTime(80)
			result.setMessage('message 2')
			vi.advanceTimersByTime(80)
			result.stop('STOP')
			vi.advanceTimersByTime(80)

			expect(output.buffer).toMatchSnapshot()
		})
	})

	describe('custom', () => {
		test('custom symbols and symbolColor', () => {
			const result = p.createSpinner({ symbolColor: 'red', symbols: ['🍎', '🍌', '🍇', '🍓'] })
			result.start()
			for (let i = 0; i < 4; i++) vi.advanceTimersByTime(80) // 4 frames
			result.stop()

			expect(output.buffer).toMatchSnapshot()
		})

		test('custom delay', () => {
			const result = p.createSpinner({ delay: 200 })
			result.start()
			for (let i = 0; i < 4; i++) vi.advanceTimersByTime(200) // 4 frames
			result.stop()

			expect(output.buffer).toMatchSnapshot()
		})
	})

	describe('process exit handling', () => {
		let emitter: EventEmitter

		beforeEach(() => {
			emitter = new EventEmitter()

			vi.spyOn(process, 'on').mockImplementation((e, listener) => {
				emitter.on(e, listener)
				return process
			})
			vi.spyOn(process, 'removeListener').mockImplementation((e, listener) => {
				emitter.removeListener(e, listener)
				return process
			})
		})

		afterEach(() => {
			emitter.removeAllListeners()
		})

		test('uses custom cancelMessage when SIGINT', () => {
			const result = p.createSpinner({ cancelMessage: 'Wow! Canceled!' })
			result.start('Test')
			emitter.emit('SIGINT')

			expect(output.buffer).toMatchSnapshot()
		})

		test('uses custom errorMessage when exit code 2', () => {
			const result = p.createSpinner({ errorMessage: 'Wow! Error!' })
			result.start('Test')
			emitter.emit('exit', 2)

			expect(output.buffer).toMatchSnapshot()
		})
	})

	test('can be aborted by signal', () => {
		const controller = new AbortController()
		const result = p.createSpinner({ signal: controller.signal })
		result.start('Signal Test')
		controller.abort()

		expect(output.buffer).toMatchSnapshot()
	})
})
