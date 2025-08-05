import { stripVTControlCharacters } from 'node:util'
import { describe, expect, test } from 'vitest'

import { ansi, wrapAnsi } from '../../src/terminal'

const color = ansi.c

describe('terminal/wrapAnsi', () => {
	const is = (a: unknown, b: unknown) => {
		expect(a).toBe(b)
	}

	const fixture = `The quick brown ${color.red('fox jumped over ')}the lazy ${color.green('dog and then ran away with the unicorn.')}`
	const fixture2 = '12345678\n901234567890'
	const fixture3 = '12345678\n901234567890 12345'
	const fixture4 = '12345678\n'
	const fixture5 = '12345678\n '

	test('wraps string at 20 characters', () => {
		const result = wrapAnsi(fixture, 20)

		expect(result).toBe(
			'The quick brown \u001B[31mfox\u001B[39m\n\u001B[31mjumped over \u001B[39mthe lazy\n\u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the\u001B[39m\n\u001B[32municorn.\u001B[39m',
		)
		expect(
			stripVTControlCharacters(result)
				.split('\n')
				.every((line) => line.length <= 20),
		).toBe(true)
	})

	test('wraps string at 30 characters', () => {
		const result = wrapAnsi(fixture, 30)

		expect(result).toBe(
			'The quick brown \u001B[31mfox jumped\u001B[39m\n\u001B[31mover \u001B[39mthe lazy \u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the unicorn.\u001B[39m',
		)
		expect(
			stripVTControlCharacters(result)
				.split('\n')
				.every((line) => line.length <= 30),
		).toBe(true)
	})

	test('does not break strings longer than "cols" characters', () => {
		const result = wrapAnsi(fixture, 5, { hard: false })

		expect(result).toBe(
			'The\nquick\nbrown\n\u001B[31mfox\u001B[39m\n\u001B[31mjumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32municorn.\u001B[39m',
		)
		expect(
			stripVTControlCharacters(result)
				.split('\n')
				.some((line) => line.length > 5),
		).toBe(true)
	})

	// test('handles colored string that wraps on to multiple lines', () => {
	// 	const result = wrapAnsi(`${color.green('hello world')} hey!`, 5, { hard: false })
	// 	const lines = result.split('\n')
	// 	t.true(hasAnsi(lines[0]))
	// 	t.true(hasAnsi(lines[1]))
	// 	t.false(hasAnsi(lines[2]))
	// })

	test('does not prepend newline if first string is greater than "cols"', () => {
		const result = wrapAnsi(`${color.green('hello')}-world`, 5, { hard: false })
		expect(result.split('\n').length).toBe(1)
	})

	describe('hard', () => {
		test('breaks strings longer than "cols" characters', () => {
			const result = wrapAnsi(fixture, 5, { hard: true })

			is(
				result,
				'The\nquick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32munico\u001B[39m\n\u001B[32mrn.\u001B[39m',
			)
			is(
				stripVTControlCharacters(result)
					.split('\n')
					.every((line) => line.length <= 5),
				true,
			)
		})

		test('removes last row if it contained only ansi escape codes', () => {
			const result = wrapAnsi(color.green('helloworld'), 2, { hard: true })
			expect(
				stripVTControlCharacters(result)
					.split('\n')
					.every((x) => x.length === 2),
			).toBe(true)
		})

		test('does not prepend newline if first word is split', () => {
			const result = wrapAnsi(`${color.green('hello')}world`, 5, { hard: true })
			expect(result.split('\n').length).toBe(2)
		})

		test('takes into account line returns inside input', () => {
			expect(wrapAnsi(fixture2, 10, { hard: true })).toBe('12345678\n9012345678\n90')
		})
	})

	test('word wrapping', () => {
		expect(wrapAnsi(fixture3, 15)).toBe('12345678\n901234567890\n12345')
	})

	test('no word-wrapping', () => {
		const result = wrapAnsi(fixture3, 15, { wordWrap: false })
		expect(result).toBe('12345678\n901234567890 12\n345')

		const result2 = wrapAnsi(fixture3, 5, { wordWrap: false })
		expect(result2).toBe('12345\n678\n90123\n45678\n90 12\n345')

		const rsult3 = wrapAnsi(fixture5, 5, { wordWrap: false })
		expect(rsult3).toBe('12345\n678\n')

		const result4 = wrapAnsi(fixture, 5, { wordWrap: false })
		expect(result4).toBe(
			'The q\nuick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe l\nazy \u001B[32md\u001B[39m\n\u001B[32mog an\u001B[39m\n\u001B[32md the\u001B[39m\n\u001B[32mn ran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe u\u001B[39m\n\u001B[32mnicor\u001B[39m\n\u001B[32mn.\u001B[39m',
		)
	})

	test('no word-wrapping and no trimming', () => {
		const result = wrapAnsi(fixture3, 13, { wordWrap: false, trim: false })
		expect(result).toBe('12345678\n901234567890 \n12345')

		const result2 = wrapAnsi(fixture4, 5, { wordWrap: false, trim: false })
		expect(result2).toBe('12345\n678\n')

		const result3 = wrapAnsi(fixture5, 5, { wordWrap: false, trim: false })
		expect(result3).toBe('12345\n678\n ')

		const result4 = wrapAnsi(fixture, 5, { wordWrap: false, trim: false })
		expect(result4).toBe(
			'The q\nuick \nbrown\n \u001B[31mfox \u001B[39m\n[31mjumpe[39m\n[31md ove[39m\n[31mr \u001B[39mthe\n lazy\n \u001B[32mdog \u001B[39m\n[32mand t[39m\n[32mhen r[39m\n[32man aw[39m\n[32may wi[39m\n[32mth th[39m\n[32me uni[39m\n[32mcorn.\u001B[39m',
		)
	})

	test('supports fullwidth characters', () => {
		expect(wrapAnsi('안녕하세', 4, { hard: true })).toBe('안녕\n하세')
	})

	test('supports unicode surrogate pairs', () => {
		expect(wrapAnsi('a\uD83C\uDE00bc', 2, { hard: true })).toBe('a\n\uD83C\uDE00\nbc')
		expect(wrapAnsi('a\uD83C\uDE00bc\uD83C\uDE00d\uD83C\uDE00', 2, { hard: true })).toBe(
			'a\n\uD83C\uDE00\nbc\n\uD83C\uDE00\nd\n\uD83C\uDE00',
		)
	})

	test('#23, properly wraps whitespace with no trimming', () => {
		expect(wrapAnsi('   ', 2, { trim: false })).toBe('  \n ')
		expect(wrapAnsi('   ', 2, { trim: false, hard: true })).toBe('  \n ')
	})

	test('#24, trims leading and trailing whitespace only on actual wrapped lines and only with trimming', () => {
		expect(wrapAnsi('   foo   bar   ', 3)).toBe('foo\nbar')
		expect(wrapAnsi('   foo   bar   ', 6)).toBe('foo\nbar')
		expect(wrapAnsi('   foo   bar   ', 42)).toBe('foo   bar')
		expect(wrapAnsi('   foo   bar   ', 42, { trim: false })).toBe('   foo   bar   ')
	})

	test('#24, trims leading and trailing whitespace inside a color block only on actual wrapped lines and only with trimming', () => {
		expect(wrapAnsi(color.blue('   foo   bar   '), 6)).toBe(color.blue('foo\nbar'))
		expect(wrapAnsi(color.blue('   foo   bar   '), 42)).toBe(color.blue('foo   bar'))
		expect(wrapAnsi(color.blue('   foo   bar   '), 42, { trim: false })).toBe(
			color.blue('   foo   bar   '),
		)
	})

	test('#25, properly wraps whitespace between words with no trimming', () => {
		expect(wrapAnsi('foo bar', 3)).toBe('foo\nbar')
		expect(wrapAnsi('foo bar', 3, { hard: true })).toBe('foo\nbar')
		expect(wrapAnsi('foo bar', 3, { trim: false })).toBe('foo\n \nbar')
		expect(wrapAnsi('foo bar', 3, { trim: false, hard: true })).toBe('foo\n \nbar')
	})

	test('#26, does not multiplicate leading spaces with no trimming', () => {
		expect(wrapAnsi(' a ', 10, { trim: false })).toBe(' a ')
		expect(wrapAnsi('   a ', 10, { trim: false })).toBe('   a ')
	})

	test('#27, does not remove spaces in line with ansi escapes when no trimming', () => {
		expect(wrapAnsi(color.bgGreen(` ${color.black('OK')} `), 100, { trim: false })).toBe(
			color.bgGreen(` ${color.black('OK')} `),
		)
		expect(wrapAnsi(color.bgGreen(`  ${color.black('OK')} `), 100, { trim: false })).toBe(
			color.bgGreen(`  ${color.black('OK')} `),
		)
		expect(wrapAnsi(color.bgGreen(' hello '), 10, { hard: true, trim: false })).toBe(
			color.bgGreen(' hello '),
		)
	})

	test('#35, wraps hyperlinks, preserving clickability in supporting terminals', () => {
		const result1 = wrapAnsi(
			'Check out \u001B]8;;https://www.example.com\u0007my website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.',
			16,
			{ hard: true },
		)
		expect(result1).toBe(
			'Check out \u001B]8;;https://www.example.com\u0007my\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007website\u001B]8;;\u0007, it is\n\u001B]8;;https://www.example.com\u0007supercalifragili\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007sticexpialidocio\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007us\u001B]8;;\u0007.',
		)

		const result2 = wrapAnsi(
			`Check out \u001B]8;;https://www.example.com\u0007my \uD83C\uDE00 ${color.bgGreen('website')}\u001B]8;;\u0007, it ${color.bgRed('is \u001B]8;;https://www.example.com\u0007super\uD83C\uDE00califragilisticexpialidocious\u001B]8;;\u0007')}.`,
			16,
			{ hard: true },
		)
		expect(result2).toBe(
			'Check out \u001B]8;;https://www.example.com\u0007my 🈀\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007\u001B[42mwebsite\u001B[49m\u001B]8;;\u0007, it \u001B[41mis\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007super🈀califragi\u001B]8;;\u0007\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007listicexpialidoc\u001B]8;;\u0007\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007ious\u001B]8;;\u0007\u001B[49m.',
		)
	})

	test('covers non-SGR/non-hyperlink ansi escapes', () => {
		expect(wrapAnsi('Hello, \u001B[1D World!', 8)).toBe('Hello,\u001B[1D\nWorld!')
		expect(wrapAnsi('Hello, \u001B[1D World!', 8, { trim: false })).toBe(
			'Hello, \u001B[1D \nWorld!',
		)
	})

	test('#39, normalizes newlines', () => {
		expect(wrapAnsi('foobar\r\nfoobar\r\nfoobar\nfoobar', 3, { hard: true })).toBe(
			'foo\nbar\nfoo\nbar\nfoo\nbar\nfoo\nbar',
		)
		expect(wrapAnsi('foo bar\r\nfoo bar\r\nfoo bar\nfoo bar', 3)).toBe(
			'foo\nbar\nfoo\nbar\nfoo\nbar\nfoo\nbar',
		)
	})
})
