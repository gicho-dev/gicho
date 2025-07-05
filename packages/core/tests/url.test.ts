import type { SearchParamsArray, SearchParamsObject } from '../src/url'

import { describe, expect, test } from 'vitest'

import { copyURLSearchParams, toURLSearchParams } from '../src/url'

describe('url', () => {
	describe('copyURLSearchParams()', () => {
		test('copy URLSearchParams', async () => {
			const source = new URLSearchParams('a=1&b=2&c=3&a=11')
			const target = new URLSearchParams('a=100')

			copyURLSearchParams(source, target)
			expect(target.toString()).toEqual('a=1&b=2&c=3&a=11')
		})

		test('copy URLSearchParams with clearTarget false', async () => {
			const source = new URLSearchParams('a=1&b=2&c=3&a=11')
			const target = new URLSearchParams('a=100&b=200')

			copyURLSearchParams(source, target, false)
			expect(target.toString()).toEqual('a=100&b=200&a=1&b=2&c=3&a=11')
		})
	})

	describe('toURLSearchParams()', () => {
		test('string to URLSearchParams', async () => {
			const search = 'a=1&b=2'

			const result1 = toURLSearchParams(search).toString()
			const result2 = toURLSearchParams(`?${search}`).toString()
			expect(result1).toEqual(search)
			expect(result2).toEqual(search)
		})

		test('array to URLSearchParams', async () => {
			const arr: SearchParamsArray = [
				['a', 'value'],
				['b', true],
				['c', false],
				['d', null],
				['e', 123],
				['e', undefined],
				['e', 321],
				['f2', ['hello', 77, 'hi']],
				['a', 'str'],
			]

			const result = toURLSearchParams(arr).toString()
			expect(result).toEqual('a=value&b=true&c=false&e=123&e=321&f2=hello&f2=77&f2=hi&a=str')
		})

		test('object to URLSearchParams', async () => {
			let obj: SearchParamsObject = {
				a: 'value',
				b: true,
				c: false,
				d: null,
				e: 123,
				f2: ['hello', 77, 'hi'],
			}
			obj = { ...obj, e: undefined }
			obj = { ...obj, a: 'str', e: 123 }

			const result = toURLSearchParams(obj).toString()
			expect(result).toEqual('a=str&b=true&c=false&e=123&f2=hello&f2=77&f2=hi')
		})

		test('URLSearchParams to URLSearchParams', async () => {
			const params = new URLSearchParams('a=1&b=2&c=3')

			const result = toURLSearchParams(params)
			expect(result).toEqual(params)
		})
	})
})
