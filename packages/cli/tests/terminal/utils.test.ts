import { stripVTControlCharacters } from 'node:util'
import { describe, expect, test } from 'vitest'

import { getWrappedLineCount } from '../../src/terminal/utils'

describe('terminal/utils', () => {
	describe('getWrappedLineCount', () => {
		const ch1 = (width: number, base: string = 'a', baseWidth = 1) => {
			return base.repeat(Math.ceil(width / baseWidth)).slice(0, width)
		}

		test('basic', () => {
			const col80 = 80

			expect(getWrappedLineCount(ch1(79), col80)).toBe(1)
			expect(getWrappedLineCount(ch1(80), col80)).toBe(1)
			expect(getWrappedLineCount(ch1(81), col80)).toBe(2)
			expect(getWrappedLineCount(ch1(159), col80)).toBe(2)
			expect(getWrappedLineCount(ch1(160), col80)).toBe(2)
			expect(getWrappedLineCount(ch1(161), col80)).toBe(3)
		})

		test('with unicodes and vt control characters ', () => {
			const w10 = stripVTControlCharacters('가1😀 a\x1b[1m字~') // width: 10

			expect(getWrappedLineCount(`${w10.repeat(8)}`, 80), 'width 80').toBe(1)
			expect(getWrappedLineCount(`${w10.repeat(8)}+`, 80), 'width 81').toBe(2)
			expect(getWrappedLineCount(`${w10.repeat(16)}`.slice(0, -1), 80), 'width 159').toBe(2)
			expect(getWrappedLineCount(`${w10.repeat(16)}`, 80), 'width 160').toBe(2)
			expect(getWrappedLineCount(`${w10.repeat(16)}a`, 80), 'width 161').toBe(3)
			expect(getWrappedLineCount(`${w10.repeat(16)}밥`, 80), 'width 162').toBe(3)
		})
	})
})
