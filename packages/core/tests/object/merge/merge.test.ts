import type { MergeDeep, MergeObjectsDeep } from '../../../src/object/merge'
import type { UnknownArray } from '../../../src/types'

import { describe, expect, expectTypeOf, test } from 'vitest'

import { createMerge, createMergeObjects, mergeConfigs } from '../../../src/object/merge'

describe('merge', () => {
	describe('createMerge - default', () => {
		const { merge } = createMerge()

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

		test('merge withcustom filterValues', () => {
			const a = { x: 1, y: 2, z: 3, arr1: [1, 2], u1: undefined, u2: null }
			const b = { x: null, y: undefined, arr1: undefined, u2: undefined }

			const { merge: mergeWithFilter } = createMerge({
				filterValues: (values) => values.filter((v) => v !== undefined),
			})

			const merged = merge(a, b)
			expect(merged).toEqual({ x: null, z: 3 })

			const mergedWithFilter = mergeWithFilter(a, b)
			expect(mergedWithFilter).toEqual({ x: null, y: 2, z: 3, arr1: [1, 2], u2: null })
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

			const { merge } = createMerge({
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

		test('type - simple merge', () => {
			interface A {
				x: number
				y: string
			}
			interface B {
				x?: number
				x2?: number
			}

			const a: A = { x: 1, y: 'hi' }
			const b: B = { x: 2 }

			const merged = merge(a, b)

			expect(merged).toEqual({ x: 2, y: 'hi' })
			expectTypeOf(merged).toEqualTypeOf<{ x: number; y: string; x2?: number }>()
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
			const obj5 = { arr1: [25, 50, 'str1'] }

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
				arr1: [1, 2, 3, 25, 50, 'str1'],
			})

			expectTypeOf(merged).toEqualTypeOf<{
				a: number
				b: boolean
				c: number
				arr1: (number | string)[]
				map1: Map<string | boolean | null, boolean | number>
				o1: { x: number; y: string; z: string }
				d: number
				map2: Map<string, number>
			}>()
		})
	})

	describe('createMergeObjects', () => {
		const { mergeObjects, mergeObjectsInto } = createMergeObjects({ symbolKeys: true })

		test('merge object with symbol keys', () => {
			const sym1 = Symbol.for('test symbol')

			const a = { a: 1, [sym1]: 2, arr1: [1, 2], o1: { x: 1, y: 2 } }
			const b = { [sym1]: 3, c: 4, arr1: ['hi'], o1: { y: 20, z: 3 }, o2: { hi: 'hello' } }

			const merged = mergeObjects(a, b)

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

		test('merge general configs', () => {
			interface Config1 {
				x: number | string
				y: number
				z1?: number
				z2?: number
				obj1: { a: string; b: boolean; arr1: string[] }
			}
			type Options1 = Partial<Config1>

			const defaultConfig: Config1 = {
				x: 1,
				y: 2,
				z1: 3,
				z2: 4,
				obj1: { a: 'hi', b: true, arr1: ['a', 'b'] },
			}
			const options: Options1 = {
				x: 2,
				z1: undefined,
				obj1: { a: 'hello', b: false, arr1: ['c', 'd'] },
			}

			const merged = mergeObjects(defaultConfig, options)
			const merged2 = mergeConfigs(defaultConfig, options)

			expect(merged).toEqual({
				x: 2,
				y: 2,
				z1: undefined, // overrides with `undefined` value (by mergeObjects)
				z2: 4,
				obj1: { a: 'hello', b: false, arr1: ['a', 'b', 'c', 'd'] },
			})
			expect(merged2).toEqual({
				x: 2,
				y: 2,
				z1: 3, // ignores explicit `undefined` value (by mergeConfigs)
				z2: 4,
				obj1: { a: 'hello', b: false, arr1: ['c', 'd'] },
			})
			expectTypeOf(merged).toEqualTypeOf<Config1>()
			expectTypeOf(merged2).toEqualTypeOf<Config1>()
		})

		test('merge with class', () => {
			class C1 {
				a: number
				constructor() {
					this.a = 1
				}
			}
			const c1 = new C1()

			expect(mergeObjects({ a: { b: 1 } }, { a: c1 }, { a: 'hi' })).toEqual({ a: 'hi' })
			expect(mergeObjectsInto({ a: { b: 1 } }, { a: c1 })).toEqual({ a: c1 })
		})

		test('merge with nullable values', () => {
			const a = { x: 1, y: 'hi', z: true, o1: { x: 1, y: 2 }, o2: { x: 3, y: 4 } }
			const b = { x: 2, y: null, z: undefined, o2: { x: 30 } }

			expect(mergeObjects(a, undefined, null, b, null, undefined)).toEqual({
				x: 2,
				y: null, // Explicitly null overrides previous merged value
				z: undefined, // Explicitly undefined overrides previous merged value
				o1: { x: 1, y: 2 },
				o2: { x: 30, y: 4 },
			})

			expect(mergeObjects(a, null)).toEqual(a)
			expect(mergeObjects(a, undefined)).toEqual(a)

			expect(mergeObjects(a, undefined, b)).toEqual({
				x: 2,
				y: null,
				z: undefined,
				o1: { x: 1, y: 2 },
				o2: { x: 30, y: 4 },
			})

			expect(mergeObjects(undefined)).toEqual({})
			expectTypeOf(mergeObjects(undefined)).toEqualTypeOf<{}>()

			expect(mergeObjects(null)).toEqual({})
			expectTypeOf(mergeObjects(null)).toEqualTypeOf<{}>()

			expect(mergeObjects(null, undefined)).toEqual({})
			expectTypeOf(mergeObjects(null, undefined)).toEqualTypeOf<{}>()

			expect(mergeObjects(null, undefined, { a: true }, undefined, null)).toEqual({ a: true })
			expectTypeOf(mergeObjects(null, undefined, { a: true }, undefined, null)).toEqualTypeOf<{
				a: boolean
			}>()

			expect(mergeObjects(null, undefined, { a: 1 }, ['a', 'b'])).toEqual({ a: 1 })
			expectTypeOf(mergeObjects(null, undefined, { a: 1 }, ['a', 'b'])).toEqualTypeOf<{
				a: number
			}>()

			expect(mergeObjects([], {})).toEqual({})
			expectTypeOf(mergeObjects([], {})).toEqualTypeOf<{}>()

			expect(mergeObjectsInto({})).toEqual({})
			expectTypeOf(mergeObjectsInto({})).toEqualTypeOf<{}>()
			expect(mergeObjectsInto({}, null)).toEqual({})
			expectTypeOf(mergeObjectsInto({}, null)).toEqualTypeOf<{}>()

			class C1 {
				a: number
				constructor() {
					this.a = 1
				}
			}
			const c1 = new C1()

			// Incorrect use cases (Limitation: value and type do not match.)
			expect(mergeObjects([], undefined, null, [1, 2])).toEqual([])
			expectTypeOf(mergeObjects([], undefined, null, [1, 2])).toEqualTypeOf<{}>()
			expect(mergeObjectsInto([], null, undefined, c1)).toEqual([])
			expectTypeOf(mergeObjectsInto([], null, undefined, c1)).toEqualTypeOf<C1>()
		})

		test('custom merger', () => {
			const { mergeObjects } = createMergeObjects({
				merger(result, key, value, ctx) {
					if (key === 'c') {
						result[key] = `haha.${value}.${ctx.namespace}`
						return true
					}
				},
			})

			const a = { a: 1, b: 2, c: 3, obj1: { c: 1 } }
			const b = { b: 20, c: 30, d: 4, obj1: { c: 'hi' } }

			const merged = mergeObjects(a, b)

			expect(merged).toEqual({
				a: 1,
				b: 20,
				c: 'haha.30.',
				d: 4,
				obj1: { c: 'haha.hi.obj1' },
			})
		})

		test('type - mergeObjects', () => {
			const a = { a: 1, b: 2, c: 3, obj1: { c: 1 } }
			const b = { b: 20, c: 30, d: 4, obj1: { c: null as string | null } }

			const merged = mergeObjects(a, undefined, null, b)

			expectTypeOf(merged).toEqualTypeOf<{
				a: number
				b: number
				c: number
				d: number
				obj1: { c: null | string }
			}>()
		})

		test('type - simple merge', () => {
			interface A {
				x: number | string
				y: string
			}
			interface B {
				x?: number
				x2?: number
			}

			const a: A = { x: 1, y: 'hi' }
			const b: B = { x: 2 }

			const merged = mergeObjects(a, b)

			expect(merged).toEqual({ x: 2, y: 'hi' })
			expectTypeOf(merged).toEqualTypeOf<{ x: number; y: string; x2?: number }>()
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

			const merged = mergeObjects(obj1, obj2, obj3, obj4, obj5)

			expect(merged).toEqual({
				a: 1,
				b: true,
				c: 3,
				d: 1,
				map1: new Map<boolean | null, number>([
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
				map1: Map<boolean | null, number>
				o1: { x: number; y: string; z: string }
				d: number
				map2: Map<string, number>
			}>()
		})
	})

	describe('common (createMerge, createMergeObjects)', () => {
		const { merge, mergeInto } = createMerge()
		const { mergeObjects, mergeObjectsInto } = createMergeObjects({ symbolKeys: true })

		test(`merge into - createMerge`, () => {
			const a = { a: 1, b: 2, c: 3 }
			const b = { b: 20, c: 30, d: 4 }
			const c = { c: 35, e: 5 }

			const expected = { a: 1, b: 20, c: 35, d: 4, e: 5 }

			const merged1 = merge(a, b, c) // no mutate a, returns new object

			expect(merged1).toEqual(expected)
			expect(merged1).not.toEqual(a)
			expect(merged1).not.toBe(a)
			expect(a).not.toEqual(expected)

			const merged2 = mergeInto(a, b, c) // mutates a, returns a

			expect(merged2).toEqual(expected)
			expect(merged2).toEqual(a)
			expect(merged2).toBe(a)
			expect(a).toEqual(expected)
		})

		test(`merge into - createMergeObjects`, () => {
			const a = { a: 1, b: 2, c: 3 }
			const b = { b: 20, c: 30, d: 4 }
			const c = { c: 35, e: 5 }

			const expected = { a: 1, b: 20, c: 35, d: 4, e: 5 }

			const merged1 = mergeObjects(a, b, c) // no mutate a, returns new object

			expect(merged1).toEqual(expected)
			expect(merged1).not.toEqual(a)
			expect(merged1).not.toBe(a)
			expect(a).not.toEqual(expected)

			const merged2 = mergeObjectsInto(a, b, c) // mutates a, returns a

			expect(merged2).toEqual(expected)
			expect(merged2).toEqual(a)
			expect(merged2).toBe(a)
			expect(a).toEqual(expected)
		})

		test(`type - MergeDeep, MergeObjectsDeep`, () => {
			type Tuple1 = [
				{ a: number; b: string; map1: Map<string, boolean>; o1: { x: 'aa'; y: 'bb' } },
				{ b: number | boolean; d?: 1 | 2; map2?: Map<string, number> },
				{ arr1: [1, 2, 3]; map1: Map<string | number, 1 | 2> },
				{ b: boolean; c?: number; map1?: Map<null | true, 3 | 4>; o1: { x: 30; z: 'zz' } },
				{ arr1: number[]; map2?: Map<string, number | boolean> },
			]

			expectTypeOf<MergeDeep<Tuple1>>().toEqualTypeOf<{
				a: number
				b: boolean
				c?: number
				d?: 1 | 2
				arr1: [1, 2, 3, ...number[]]
				map1: Map<string | number | true | null, boolean | 1 | 2 | 3 | 4>
				map2?: Map<string, number | boolean>
				o1: { x: 30; y: 'bb'; z: 'zz' }
			}>()
			expectTypeOf<MergeObjectsDeep<Tuple1>>().toEqualTypeOf<{
				a: number
				b: boolean
				c?: number
				d?: 1 | 2
				arr1: [1, 2, 3, ...number[]]
				map1: Map<true | null, 3 | 4>
				map2?: Map<string, number | boolean>
				o1: { x: 30; y: 'bb'; z: 'zz' }
			}>()
		})
	})
})
