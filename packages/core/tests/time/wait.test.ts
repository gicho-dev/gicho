import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { wait, waitSeconds } from '../../src/time'

describe('wait', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.useRealTimers()
	})

	describe('wait', () => {
		test('resolves after milliseconds', async () => {
			const fn = vi.fn()

			wait(500).then(fn)

			expect(fn).not.toHaveBeenCalled()
			await vi.advanceTimersByTimeAsync(200)
			expect(fn).not.toHaveBeenCalled()
			await vi.advanceTimersByTimeAsync(300)

			expect(fn).toHaveBeenCalledOnce()
		})
	})

	describe('waitSeconds', () => {
		test('resolves after seconds', async () => {
			const fn = vi.fn()

			waitSeconds(0.2).then(fn)

			expect(fn).not.toHaveBeenCalled()
			await vi.advanceTimersByTimeAsync(100)
			expect(fn).not.toHaveBeenCalled()
			await vi.advanceTimersByTimeAsync(100)

			expect(fn).toHaveBeenCalledOnce()
		})
	})
})
