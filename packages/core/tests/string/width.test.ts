import { stripVTControlCharacters as strip } from 'node:util'
import { describe, expect, test } from 'vitest'

import { getEastAsianWidth, getEastAsianWidthType, getStringWidth } from '../../src/string/width'

// Tests copied (with modifications) from get-east-asian-width by @sindresorhus; MIT License
// https://github.com/sindresorhus/get-east-asian-width

describe('string/width', () => {
	describe('string/width/getEastAsianWidth', () => {
		const cp = (str: string) => str.codePointAt(0)!

		const testBoth = (x: number, expectedWidth: number, expectedType: string) => {
			expect(getEastAsianWidth(x)).toBe(expectedWidth)
			expect(getEastAsianWidthType(x)).toBe(expectedType)
		}

		test('narrow', () => {
			testBoth(cp('a'), 1, 'Na')
			testBoth(cp('5'), 1, 'Na')
			testBoth(cp('~'), 1, 'Na')
			testBoth(cp('"'), 1, 'Na')
			testBoth(cp('@'), 1, 'Na')
			testBoth(cp('['), 1, 'Na')
		})

		test('wide', () => {
			testBoth(cp('字'), 2, 'W')
			testBoth(cp('밥'), 2, 'W')
		})

		test('ambiguous', () => {
			const fixture = cp('⛣')
			testBoth(fixture, 1, 'A')
			expect(getEastAsianWidth(fixture, { ambiguousAsWide: true })).toBe(2)
		})
	})

	// Tests copied (with modifications) from string-width by @sindresorhus; MIT License
	// https://github.com/sindresorhus/string-width

	describe('string/width/getStringWidth', () => {
		const is = (actual: number, expectedWidth: number, message?: string) => {
			expect(actual, message).toBe(expectedWidth)
		}
		const widthOf = (actual: string, expectedWidth: number, message?: string) => {
			expect(getStringWidth(actual), message).toBe(expectedWidth)
		}

		test('various cases', () => {
			is(getStringWidth('⛣', { ambiguousAsWide: true }), 2)
			widthOf('abcde', 5)
			widthOf('古池や', 6)
			widthOf('あいうabc', 9)
			widthOf('あいう★', 7)
			is(getStringWidth('あいう★', { ambiguousAsWide: true }), 8)
			widthOf('±', 1)
			widthOf('ノード.js', 9)
			widthOf('你好', 4)
			widthOf('안녕하세요', 10)

			widthOf('A\uD83C\uDE00BC', 5) // 'surrogate'

			widthOf(strip('\u001B[31m\u001B[39m'), 0)
			widthOf('\u001B[31m\u001B[39m', 8)
			widthOf(strip('\u001B]8;;https://github.com\u0007Click\u001B]8;;\u0007'), 5)

			widthOf('\u{231A}', 2, '⌚ default emoji presentation character (Emoji_Presentation)')
			widthOf('\u{2194}\u{FE0F}', 2, '↔️ default text presentation character rendered as emoji')
			widthOf('\u{1F469}', 2, '👩 emoji modifier base (Emoji_Modifier_Base)')
			widthOf('\u{1F469}\u{1F3FF}', 2, '👩🏿 emoji modifier base followed by a modifier')
			widthOf('\u{845B}\u{E0100}', 2, 'Variation Selectors')
			widthOf('ปฏัก', 3, 'Thai script')
			widthOf('_\u0E34', 1, 'Thai script')
			is(getStringWidth('“', { ambiguousAsWide: true }), 2)
		})

		test('ignores control characters', () => {
			widthOf(String.fromCodePoint(0), 0)
			widthOf(String.fromCodePoint(31), 0)
			widthOf(String.fromCodePoint(127), 0)
			widthOf(String.fromCodePoint(134), 0)
			widthOf(String.fromCodePoint(159), 0)
			widthOf('\u001B', 0)
		})

		test('handles combining characters', () => {
			widthOf('x\u0300', 1)
			widthOf('\u0300\u0301', 0)
			widthOf('e\u0301e', 2)
			widthOf('x\u036F', 1)
			widthOf('\u036F\u036F', 0)
		})

		test('handles ZWJ characters', () => {
			widthOf('👶', 2)
			widthOf('👶🏽', 2)
			widthOf('👩‍👩‍👦‍👦', 2)
			widthOf('👨‍❤️‍💋‍👨', 2)
		})

		test('handles zero-width characters', () => {
			widthOf('\u200B', 0)
			widthOf('x\u200Bx', 2)
			widthOf('\u200C', 0)
			widthOf('x\u200Cx', 2)
			widthOf('\u200D', 0)
			widthOf('x\u200Dx', 2)
			widthOf('\uFEFF', 0)
			widthOf('x\uFEFFx', 2)
		})

		test('handles surrogate pairs', () => {
			widthOf('\uD83D\uDE00', 2) // 😀
			widthOf('A\uD83D\uDE00B', 4)
		})

		test('handles variation selectors', () => {
			expect('\u{1F1FA}').toBe('🇺') // 2 widths
			expect('\u{1F1FA}\u{1F1F8}').toBe('🇺🇸') // 2 width

			// NOTE:
			// 2 widths corrently (this is not a bug. different from string-width package result)
			widthOf('\u{1F1FA}\uFE0F', 2) // Regional indicator symbol 'U' with variation selector
			widthOf('\u{1F1FA}\u{1F1F8}', 2) // USA Flag with variation selector

			widthOf('A\uFE0F', 1)
			widthOf('\uFE0F', 0)
		})

		test('handles edge cases', () => {
			widthOf('', 0)
			widthOf('\u200B\u200B', 0)
			widthOf('x\u200Bx\u200B', 2)
			widthOf('x\u0300x\u0300', 2)
			widthOf('\uD83D\uDE00\uFE0F', 2) // 😀 with variation selector
			widthOf('\uD83D\uDC69\u200D\uD83C\uDF93', 2) // 👩‍🎓
			widthOf('x\u1AB0x\u1AB0', 2) // Combining diacritical marks extended
			widthOf('x\u1DC0x\u1DC0', 2) // Combining diacritical marks supplement
			widthOf('x\u20D0x\u20D0', 2) // Combining diacritical marks for symbols
			widthOf('x\uFE20x\uFE20', 2) // Combining half marks
		})

		test('ignores default ignorable code points', () => {
			widthOf('\u2060', 0) // Word joiner
			widthOf('\u2061', 0) // Function application
			widthOf('\u2062', 0) // Invisible times
			widthOf('\u2063', 0) // Invisible separator
			widthOf('\u2064', 0) // Invisible plus
			widthOf('\uFEFF', 0) // Zero-width no-break space
			widthOf('x\u2060x', 2)
			widthOf('x\u2061x', 2)
			widthOf('x\u2062x', 2)
			widthOf('x\u2063x', 2)
			widthOf('x\u2064x', 2)
		})
	})
})
