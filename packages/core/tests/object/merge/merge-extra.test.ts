import { describe, expect, test } from 'vitest'

import { createMerge, createMergeObjects } from '../../../src/object/merge'

// based on https://github.com/TehShrike/deepmerge test cases

describe('merge-extra', () => {
	const { merge: _merge } = createMerge()
	const { merge: _mergeObjects } = createMergeObjects({ symbolKeys: true })

	for (const fn of [_merge, _mergeObjects]) {
		const merge = fn
		const fnName = fn === _merge ? 'merge' : 'mergeObjects'

		test('add keys in target that do not exist at the root', () => {
			const a = {}
			const b = { key1: 'value1', key2: 'value2' }

			const merged = merge(a, b)

			expect(a).toEqual({}) // merge should be immutable
			expect(merged).toEqual(b)
		})

		test('merge existing simple keys in target at the roots', () => {
			const a = { key1: 'value1', key3: 'value3' }
			const b = { key1: 'changed', key2: 'value2' }

			const expected = {
				key1: 'changed',
				key2: 'value2',
				key3: 'value3',
			}

			expect(a).toEqual({ key1: 'value1', key3: 'value3' })
			expect(merge(a, b)).toEqual(expected)
		})

		test('merge nested objects into target', () => {
			const a = {
				key1: {
					subkey1: 'value1',
					subkey2: 'value2',
				},
			}
			const b = {
				key1: {
					subkey1: 'changed',
					subkey3: 'added',
				},
			}

			const expected = {
				key1: {
					subkey1: 'changed',
					subkey2: 'value2',
					subkey3: 'added',
				},
			}

			expect(a).toEqual({
				key1: {
					subkey1: 'value1',
					subkey2: 'value2',
				},
			})
			expect(merge(a, b)).toEqual(expected)
		})

		test('replace simple key with nested object in target', () => {
			const a = {
				key1: 'value1',
				key2: 'value2',
			}
			const b = {
				key1: {
					subkey1: 'subvalue1',
					subkey2: 'subvalue2',
				},
			}

			const expected = {
				key1: {
					subkey1: 'subvalue1',
					subkey2: 'subvalue2',
				},
				key2: 'value2',
			}

			expect(a).toEqual({ key1: 'value1', key2: 'value2' })
			expect(merge(a, b)).toEqual(expected)
		})

		test('should add nested object in target', () => {
			const a = {
				a: {},
			}
			const b = {
				b: {
					c: {},
				},
			}

			const expected = {
				a: {},
				b: {
					c: {},
				},
			}

			expect(merge(a, b)).toEqual(expected)
		})

		test('should not clone source and target', () => {
			const a = {
				a: {
					d: 'bar',
				},
			}
			const b = {
				b: {
					c: 'foo',
				},
			}

			const expected = {
				a: {
					d: 'bar',
				},
				b: {
					c: 'foo',
				},
			}

			const merged = merge(a, b)

			expect(merged).toEqual(expected)

			expect(merged.a).toBe(a.a)
			expect(merged.b).toBe(b.b)
		})

		test('should replace object with simple key in target', () => {
			const a = {
				key1: {
					subkey1: 'subvalue1',
					subkey2: 'subvalue2',
				},
				key2: 'value2',
			}
			const b = { key1: 'value1' }

			const expected = { key1: 'value1', key2: 'value2' }

			expect(a).toEqual({
				key1: {
					subkey1: 'subvalue1',
					subkey2: 'subvalue2',
				},
				key2: 'value2',
			})
			expect(merge(a, b)).toEqual(expected)
		})

		test('should replace objects with arrays', () => {
			const a = { key1: { subkey: 'one' } }
			const b = { key1: ['subkey'] }

			const expected = { key1: ['subkey'] }

			expect(merge(a, b)).toEqual(expected)
		})

		test('should replace arrays with objects', () => {
			const a = { key1: ['subkey'] }
			const b = { key1: { subkey: 'one' } }

			const expected = { key1: { subkey: 'one' } }

			expect(merge(a, b)).toEqual(expected)
		})

		test('should replace object with primitive', () => {
			const a = { key1: new Date() }
			const b = 'test'

			const expected = 'test'

			expect(merge(a, b)).toEqual(expected)
		})

		test('should replace Date with RegExp', () => {
			const a = new Date()
			const b = /a/g
			const expected = /a/g

			expect(merge(a, b)).toEqual(expected)
		})

		test('should replace dates with arrays', () => {
			const a = { key1: new Date() }
			const b = { key1: ['subkey'] }
			const expected = { key1: ['subkey'] }

			expect(merge(a, b)).toEqual(expected)
		})

		test('should replace null with arrays', () => {
			const a = {
				key1: null,
			}
			const b = {
				key1: ['subkey'],
			}

			const expected = {
				key1: ['subkey'],
			}

			expect(merge(a, b)).toEqual(expected)
		})

		if (fnName === 'merge') {
			test('should work on simple array', () => {
				const a = ['one', 'two']
				const b = ['one', 'three']

				const expected = ['one', 'two', 'one', 'three']

				expect(merge(a, b)).toEqual(expected)
				expect(Array.isArray(merge(a, b))).toBe(true)
			})

			test('should work on another simple array', () => {
				const a = ['a1', 'a2', 'c1', 'f1', 'p1']
				const b = ['t1', 's1', 'c2', 'r1', 'p2', 'p3']

				const expected = ['a1', 'a2', 'c1', 'f1', 'p1', 't1', 's1', 'c2', 'r1', 'p2', 'p3']
				expect(a).toEqual(['a1', 'a2', 'c1', 'f1', 'p1'])
				expect(merge(a, b)).toEqual(expected)
				expect(Array.isArray(merge(a, b))).toBe(true)
			})
		}

		test('should work on array properties', () => {
			const a = {
				key1: ['one', 'two'],
			}
			const b = {
				key1: ['one', 'three'],
				key2: ['four'],
			}

			const expected = {
				key1: ['one', 'two', 'one', 'three'],
				key2: ['four'],
			}

			expect(merge(a, b)).toEqual(expected)
			expect(Array.isArray(merge(a, b).key1)).toBe(true)
			expect(Array.isArray(merge(a, b).key2)).toBe(true)
		})

		test('should work on array properties with NOT cloned', () => {
			const a = {
				key1: ['one', 'two'],
			}
			const b = {
				key1: ['one', 'three'],
				key2: ['four'],
			}

			expect(a).toEqual({ key1: ['one', 'two'] })
			const merged = merge(a, b)
			expect(merged.key1).not.toBe(b.key1)
			expect(merged.key1).not.toBe(a.key1)
			expect(merged.key2).toBe(b.key2) // not cloned (by design)
		})

		if (fnName === 'merge') {
			test('should work on array of objects', () => {
				const a = [{ key1: ['one', 'two'] }, { key3: ['four'] }]
				const b = [{ key1: ['one', 'three'], key2: ['one'] }, { key3: ['five'] }]

				const expected = [
					{ key1: ['one', 'two'] },
					{ key3: ['four'] },
					{ key1: ['one', 'three'], key2: ['one'] },
					{ key3: ['five'] },
				]

				expect(merge(a, b)).toEqual(expected)
				expect(Array.isArray(merge(a, b))).toBe(true) // result should be an array
				expect(Array.isArray(merge(a, b)[0].key1)).toBe(true) // subkey should be an array too
			})

			test('should work on array of objects with NOT cloned', () => {
				const a = [{ key1: ['one', 'two'] }, { key3: ['four'] }]
				const b = [{ key1: ['one', 'three'], key2: ['one'] }, { key3: ['five'] }]

				const expected = [
					{ key1: ['one', 'two'] },
					{ key3: ['four'] },
					{ key1: ['one', 'three'], key2: ['one'] },
					{ key3: ['five'] },
				]

				const merged = merge(a, b)
				expect(merged).toEqual(expected)
				expect(Array.isArray(merge(a, b))).toBe(true) // result should be an array
				expect(Array.isArray(merge(a, b)[0].key1)).toBe(true) // subkey should be an array too
				expect(merged[0].key1).not.toBe(b[0].key1)
				expect(merged[0].key1).toBe(a[0].key1) // NOT cloned (by design)
				expect((merged[0] as any).key2).not.toBe((b[0] as any).key2)
				expect(merged[1].key3).not.toBe(b[1].key3)
				expect(merged[1].key3).toBe(a[1].key3) // NOT cloned (by design)
			})
		}

		test('should treat regular expressions like primitive values', () => {
			const a = { key1: /abc/ }
			const b = { key1: /efg/ }
			const expected = { key1: /efg/ }

			expect(merge(a, b)).toEqual(expected)
			expect(merge(a, b).key1.test('efg')).toBe(true)
		})

		test(
			'should treat regular expressions like primitive values and should not' +
				' clone even with clone option',
			() => {
				const a = { key1: /abc/ }
				const b = { key1: /efg/ }

				const merged = merge(a, b)

				expect(merged.key1).toBe(b.key1)
			},
		)

		test('should treat dates like primitives', () => {
			const monday = new Date('2016-09-27T01:08:12.761Z')
			const tuesday = new Date('2016-09-28T01:18:12.761Z')

			const a = {
				key: monday,
			}
			const b = {
				key: tuesday,
			}

			const expected = {
				key: tuesday,
			}
			const merged = merge(a, b)

			expect(merged).toEqual(expected)
			merged.key
			expect(merged.key.valueOf()).toBe(tuesday.valueOf())
		})

		test('should treat dates like primitives and should not clone even with clone option', () => {
			const monday = new Date('2016-09-27T01:08:12.761Z')
			const tuesday = new Date('2016-09-28T01:18:12.761Z')

			const a = {
				key: monday,
			}
			const b = {
				key: tuesday,
			}

			const merged = merge(a, b)

			expect(merged.key).toBe(tuesday)
		})

		if (fnName === 'merge') {
			test('should work on array with null in it', () => {
				const a: unknown[] = []
				const b = [null]

				const expected = [null]

				expect(merge(a, b)).toEqual(expected)
			})
		}

		test("should NOT clone array's element if it is object", () => {
			const obj = { key: 'yup' }
			const a: unknown[] = []
			const b = [obj]

			const merged = merge(a, b)

			expect(merged[0]).toBe(obj) // NOT cloned (by design)
			expect((merged[0] as { key: string }).key).toBe('yup')
		})

		test('should NOT clone an array property when there is no target array', () => {
			const someObject = {}
			const a = {}
			const b = { ary: [someObject] }
			const merged = merge(a, b)

			expect(merged).toEqual({ ary: [{}] })
			expect(merged.ary[0]).toBe(someObject) // NOT cloned (by design)
		})

		test('should overwrite values when property is initialised but undefined', () => {
			const a1 = { value: [] }
			const a2 = { value: null }
			const a3 = { value: 2 }

			const b = { value: undefined }

			function hasUndefinedProperty(o: any) {
				expect(Object.hasOwn(o, 'value')).toBe(true)
				expect(typeof o.value).toBe('undefined')
			}

			hasUndefinedProperty(merge(a1, b))
			hasUndefinedProperty(merge(a2, b))
			hasUndefinedProperty(merge(a3, b))
		})

		test('should overwrite null with the source', () => {
			const expected = { a: 'string' }
			const merged = merge(null, { a: 'string' })

			expect(merged).toEqual(expected)
		})

		if (fnName === 'merge') {
			test('dates should copy correctly in an array', () => {
				const monday = new Date('2016-09-27T01:08:12.761Z')
				const tuesday = new Date('2016-09-28T01:18:12.761Z')

				const a = [monday, 'dude']
				const b = [tuesday, 'lol']

				const expected = [monday, 'dude', tuesday, 'lol']
				const merged = merge(a, b)

				expect(merged).toEqual(expected)
			})

			test('merging objects with own __proto__ in target', () => {
				const payload = '{"__proto__":{"admin":true}}'

				const malicious = JSON.parse(payload)
				const user = {} as any

				const merged = merge(malicious, user)

				expect(({} as any).a0, 'Safe POJO').not.toBe(true)
				expect(malicious.a0, 'Safe x input').not.toBe(true)
				expect(user.a0, 'Safe y input').not.toBe(true)
				expect(merged.a0, 'Safe output').not.toBe(true)

				expect(JSON.stringify(merged)).toBe(payload)
				expect((merged as any).admin).toBeFalsy() // the destination should have an unmodified prototype
			})
		}

		test('merging objects with own prototype in target', () => {
			const user = {}
			const malicious = JSON.parse('{ "prototype": { "admin": true } }')
			const merged = merge(malicious, user)
			expect((merged as any).admin).toBeFalsy() // the destination should have an unmodified prototype
		})

		test('merging objects with own __proto__ in source', () => {
			const user = {} as any
			const malicious = JSON.parse('{ "__proto__": { "admin": true } }')
			const merged = merge(user, malicious)

			expect(({} as any).a0, 'Safe POJO').not.toBe(true)
			expect(malicious.a0, 'Safe x input').not.toBe(true)
			expect(user.a0, 'Safe y input').not.toBe(true)
			expect(merged.a0, 'Safe output').not.toBe(true)

			expect((merged as any).admin).toBeFalsy() // the destination should have an unmodified prototype
		})

		test('merging objects with own prototype in source', () => {
			const user = {}
			const malicious = JSON.parse('{ "prototype": { "admin": true } }')
			const merged = merge(user, malicious)
			expect((merged as any).admin).toBeFalsy() // the destination should have an unmodified prototype
		})

		test('merging objects with plain and non-plain properties in target', () => {
			const parent = {
				parentKey: 'should be undefined',
			}

			const a = Object.create(parent)
			;(a as any).plainKey = 'should be replaced'

			const b = {
				parentKey: 'foo',
				plainKey: 'bar',
				newKey: 'baz',
			}

			const merged = merge(a, b)
			expect((merged as any).parentKey).toBe('foo') // source의 값이 우선됨
			expect((merged as any).plainKey).toBe('bar') // enumerable own properties of target should be merged
			expect((merged as any).newKey).toBe('baz') // properties not yet on target should be merged
		})

		test('merging objects with null prototype', () => {
			const a = Object.create(null)
			const b = Object.create(null)
			;(a as any).wheels = 4
			;(a as any).trunk = { toolbox: ['hammer'] }
			;(b as any).trunk = { toolbox: ['wrench'] }
			;(b as any).engine = 'v8'
			const expected = {
				wheels: 4,
				engine: 'v8',
				trunk: {
					toolbox: ['hammer', 'wrench'],
				},
			}

			expect(expected).toEqual(merge(a, b))
		})

		/* ----------------------------------------
		 *   Symbol keys
		 * ------------------------------------- */

		describe('symbol keys', () => {
			test('copy symbol keys in target that do not exist on the target', () => {
				const mySymbol = Symbol('test')
				const a = {}
				const b = { [mySymbol]: 'value1' }

				const merged = merge(a, b)

				expect(merged[mySymbol]).toBe('value1')
				expect(Object.getOwnPropertySymbols(merged)).toEqual(Object.getOwnPropertySymbols(b))
			})

			test('copy symbol keys in target that do exist on the target', () => {
				const mySymbol = Symbol('test')
				const a = { [mySymbol]: 'wat' }
				const b = { [mySymbol]: 'value1' }

				const merged = merge(a, b)

				expect(merged[mySymbol]).toBe('value1')
			})

			test('does not copy enumerable symbol keys in source', () => {
				const mySymbol = Symbol('test')
				const a = { [mySymbol]: 'wat' }
				const b = {}

				Object.defineProperty(b, mySymbol, {
					value: 'value1',
					writable: false,
					enumerable: false,
				})

				const merged = merge(a, b)

				expect(merged[mySymbol]).toBe('wat')
			})
		})
	}
})
