import { describe, expect, test } from 'vitest'

import { split } from '../../src/object/split'

describe('split', () => {
	const fn1 = () => false

	test('split mixed-type object', () => {
		const obj = { a: 1, b: 2, c: 3, d: 4, no1: null, e: 'hi', no2: undefined, fn1 }
		const [left, right] = split(obj, ['a', 'c', 'fn1', 'no2'])
		expect(left).toEqual({ a: 1, c: 3, fn1, no2: undefined })
		expect(right).toEqual({ b: 2, d: 4, e: 'hi', no1: null })
	})

	test('split with interface', () => {
		interface Type1 {
			a: number
			b: string
			c: boolean
			d: Date
		}

		const obj: Type1 = { a: 1, b: 'hi', c: true, d: new Date() }
		const [left, right] = split(obj, ['a', 'd'])
		expect(left).toEqual({ a: 1, d: new Date() })
		expect(right).toEqual({ b: 'hi', c: true })
	})
})
