import type { MergeDeep } from '../../../src/object/merge'
import type { UnknownArray } from '../../../src/types'

import { describe, expect, expectTypeOf, test } from 'vitest'

import { createMerge, createMergeObject } from '../../../src/object/merge'

describe('merge / mergeObject', () => {
	describe('merge - default', () => {
		const merge = createMerge()

		test('merge map', () => {
			const a = new Map<string, unknown>([
				['a', 1],
				['b', 2],
				['ref', { x: 1, y: 2 }],
			])
			const b = new Map<string, unknown>([
				['b', 20],
				['c', 3],
				['ref', { x: 20 }],
			])

			const merged = merge(a, b)

			expect(merged).toEqual(
				new Map<string, unknown>([
					['a', 1],
					['b', 20],
					['c', 3],
					['ref', { x: 20 }],
				]),
			)
			expect(a.get('b')).toBe(2)
			expect(b.get('b')).toBe(20)

			// not cloned - by design
			;(merged.get('ref') as { x: number }).x = 30
			expect((b.get('ref') as any).x).toBe(30)
		})

		test('merge set', () => {
			const a = new Set([1, 2, 3])
			const b = new Set([4, 5, 1, 6])

			const merged = merge(a, b)

			expect(merged).toEqual(new Set([1, 2, 3, 4, 5, 6]))
		})

		test('cuatom merge with complex object and check meta data', () => {
			const sym = Symbol(20)
			const a = {
				x: false,
			}
			const b = {
				x: { a: 1, c: 1, [sym]: 1, d: { d2: 'hi' }, arr1: [{ a: { a2: { a3: 1 } } }] },
			}
			const c = {
				x: {
					a: 2,
					b: 2,
					d: { 'h-1': true, d2: 'hi2' },
					[sym]: 2,
					arr1: [{ a: { a2: { a3: 2 } } }],
				},
			}

			const arr: {
				t: 'others' | 'one'
				key?: PropertyKey
				namespace: string
				parentValues?: UnknownArray
			}[] = []

			const merge = createMerge({
				mergeHandlers: {
					mergeOthers: (values, ctx) => {
						const { key, namespace, parentValues } = ctx
						arr.push({ t: 'others', key, namespace, parentValues })
						return values.at(-1)
					},
					mergeOne: (value, ctx) => {
						const { key, namespace, parentValues } = ctx
						arr.push({ t: 'one', key, namespace, parentValues })
						return value
					},
				},
			})

			const merged = merge(a, b, c)

			expect(merged).toEqual({
				x: {
					a: 2,
					b: 2,
					c: 1,
					d: { d2: 'hi2', 'h-1': true },
					[sym]: 2,
					arr1: [{ a: { a2: { a3: 1 } } }, { a: { a2: { a3: 2 } } }],
				},
			})

			const parentValues = [b.x, c.x]
			const parentValues2 = [b.x.d, c.x.d]
			expect(arr).toEqual([
				{ t: 'others', key: 'a', namespace: 'x.a', parentValues },
				{ t: 'one', key: 'c', namespace: 'x.c', parentValues },
				{ t: 'others', key: 'd2', namespace: 'x.d.d2', parentValues: parentValues2 },
				{ t: 'one', key: 'h-1', namespace: 'x.d.h-1', parentValues: parentValues2 },
				{ t: 'others', key: sym, namespace: 'x.Symbol(20)', parentValues },
				{ t: 'one', key: 'b', namespace: 'x.b', parentValues },
			])
		})

		test('merge with mix types of objects', () => {
			const obj1 = { a: 1, b: 'hi', map1: new Map([['a', true]]), o1: { x: 'aa', y: 'bb' } }
			const obj2 = { b: 2, d: 1, map2: new Map([['b', 2]]) }
			const obj3 = {
				arr1: [1, 2, 3],
				map1: new Map([
					['a', 1],
					['b', 2],
				]),
			}
			const obj4 = {
				b: true,
				c: 3,
				map1: new Map([
					[null, 3],
					[true, 4],
				]),
				o1: { x: 30, z: 'zz' },
			}
			const obj5 = { arr1: [25, 50] }

			const merged = merge(obj1, obj2, obj3, obj4, obj5)

			expect(merged).toEqual({
				a: 1,
				b: true,
				c: 3,
				d: 1,
				map1: new Map<boolean | string | null, number>([
					['a', 1],
					['b', 2],
					[null, 3],
					[true, 4],
				]),
				map2: new Map([['b', 2]]),
				o1: { x: 30, y: 'bb', z: 'zz' },
				arr1: [1, 2, 3, 25, 50],
			})

			expectTypeOf(merged).toEqualTypeOf<{
				a: number
				b: boolean
				c: number
				arr1: number[]
				map1: Map<string | boolean | null, boolean | number>
				o1: { x: number; y: string; z: string }
				d: number
				map2: Map<string, number>
			}>()

			const a123: MergeDeep<
				[
					{ a: number; b: string; map1: Map<string, boolean>; o1: { x: 'aa'; y: 'bb' } },
					{ b: number | boolean; d?: 1 | 2; map2?: Map<string, number> },
					{ arr1: [1, 2, 3]; map1: Map<string | number, 1 | 2> },
					{ b: boolean; c?: number; map1?: Map<null | true, 3 | 4>; o1: { x: 30; z: 'zz' } },
					{ arr1: number[] },
				]
			> = {
				a: 1,
				b: false,
				c: 3,
				arr1: [1, 2, 3, 90, 100, -10],
				map1: new Map([
					['a', 1],
					['b', 2],
				]),
				o1: { x: 30, y: 'bb', z: 'zz' },
			}
			a123.map1?.set(null, 3)
			a123.arr1.push()
		})
	})

	describe('mergeObject', () => {
		const mergeObject = createMergeObject({ symbolKeys: true })

		test('merge object with symbol keys', () => {
			const sym1 = Symbol.for('test symbol')

			const a = { a: 1, [sym1]: 2, arr1: [1, 2], o1: { x: 1, y: 2 } }
			const b = { [sym1]: 3, c: 4, arr1: ['hi'], o1: { y: 20, z: 3 }, o2: { hi: 'hello' } }

			const merged = mergeObject(a, b)

			expect(merged).toEqual({
				a: 1,
				[Symbol.for('test symbol')]: 3,
				c: 4,
				arr1: [1, 2, 'hi'],
				o1: {
					x: 1,
					y: 20,
					z: 3,
				},
				o2: { hi: 'hello' },
			})
		})

		test('custom merger', () => {
			const mergeObject = createMergeObject({
				merger(result, key, value, ctx) {
					if (key === 'c') {
						result[key] = `haha.${value}.${ctx.namespace}`
						return true
					}
				},
			})

			const a = { a: 1, b: 2, c: 3, obj1: { c: 1 } }
			const b = { b: 20, c: 30, d: 4, obj1: { c: 'hi' } }

			const merged = mergeObject(a, b)

			expect(merged).toEqual({
				a: 1,
				b: 20,
				c: 'haha.30.',
				d: 4,
				obj1: { c: 'haha.hi.obj1' },
			})
		})
	})
})
