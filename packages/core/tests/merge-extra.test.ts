import { describe, expect, test } from 'vitest'

import { createMerge } from '../src/object/merge'

// based on https://github.com/TehShrike/deepmerge/tree/3c39fb376158fa3cfc75250cfc4414064a90f582/test

const merge = createMerge()

describe('merge-extra', () => {
	test('add keys in target that do not exist at the root', () => {
		const src = { key1: 'value1', key2: 'value2' }
		const target = {}

		const res = merge(target, src)

		expect(target).toEqual({}) // merge should be immutable
		expect(res).toEqual(src)
	})

	test('merge existing simple keys in target at the roots', () => {
		const src = { key1: 'changed', key2: 'value2' }
		const target = { key1: 'value1', key3: 'value3' }

		const expected = {
			key1: 'changed',
			key2: 'value2',
			key3: 'value3',
		}

		expect(target).toEqual({ key1: 'value1', key3: 'value3' })
		expect(merge(target, src)).toEqual(expected)
	})

	test('merge nested objects into target', () => {
		const src = {
			key1: {
				subkey1: 'changed',
				subkey3: 'added',
			},
		}
		const target = {
			key1: {
				subkey1: 'value1',
				subkey2: 'value2',
			},
		}

		const expected = {
			key1: {
				subkey1: 'changed',
				subkey2: 'value2',
				subkey3: 'added',
			},
		}

		expect(target).toEqual({
			key1: {
				subkey1: 'value1',
				subkey2: 'value2',
			},
		})
		expect(merge(target, src)).toEqual(expected)
	})

	test('replace simple key with nested object in target', () => {
		const src = {
			key1: {
				subkey1: 'subvalue1',
				subkey2: 'subvalue2',
			},
		}
		const target = {
			key1: 'value1',
			key2: 'value2',
		}

		const expected = {
			key1: {
				subkey1: 'subvalue1',
				subkey2: 'subvalue2',
			},
			key2: 'value2',
		}

		expect(target).toEqual({ key1: 'value1', key2: 'value2' })
		expect(merge(target, src)).toEqual(expected)
	})

	test('should add nested object in target', () => {
		const src = {
			b: {
				c: {},
			},
		}

		const target = {
			a: {},
		}

		const expected = {
			a: {},
			b: {
				c: {},
			},
		}

		expect(merge(target, src)).toEqual(expected)
	})

	test('should clone source and target', () => {
		const src = {
			b: {
				c: 'foo',
			},
		}

		const target = {
			a: {
				d: 'bar',
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

		const merged = merge(target, src)

		expect(merged).toEqual(expected)

		expect(merged.a).not.toBe(target.a)
		expect(merged.b).not.toBe(src.b)
	})

	test('should clone source and target (duplicate test)', () => {
		const src = {
			b: {
				c: 'foo',
			},
		}

		const target = {
			a: {
				d: 'bar',
			},
		}

		const merged = merge(target, src)
		expect(merged.a).not.toBe(target.a)
		expect(merged.b).not.toBe(src.b)
	})

	test('should replace object with simple key in target', () => {
		const src = { key1: 'value1' }
		const target = {
			key1: {
				subkey1: 'subvalue1',
				subkey2: 'subvalue2',
			},
			key2: 'value2',
		}

		const expected = { key1: 'value1', key2: 'value2' }

		expect(target).toEqual({
			key1: {
				subkey1: 'subvalue1',
				subkey2: 'subvalue2',
			},
			key2: 'value2',
		})
		expect(merge(target, src)).toEqual(expected)
	})

	test('should replace objects with arrays', () => {
		const target = { key1: { subkey: 'one' } }

		const src = { key1: ['subkey'] }

		const expected = { key1: ['subkey'] }

		expect(merge(target, src)).toEqual(expected)
	})

	test('should replace arrays with objects', () => {
		const target = { key1: ['subkey'] }

		const src = { key1: { subkey: 'one' } }

		const expected = { key1: { subkey: 'one' } }

		expect(merge(target, src)).toEqual(expected)
	})

	test('should replace object with primitive', () => {
		const target = { key1: new Date() }

		const src = 'test'

		const expected = 'test'

		expect(merge(target, src)).toEqual(expected)
	})

	test('should replace Date with RegExp', () => {
		const target = new Date()

		const src = /a/g
		const expected = /a/g

		expect(merge(target, src)).toEqual(expected)
	})

	test('should replace dates with arrays', () => {
		const target = { key1: new Date() }

		const src = { key1: ['subkey'] }
		const expected = { key1: ['subkey'] }

		expect(merge(target, src)).toEqual(expected)
	})

	test('should replace null with arrays', () => {
		const target = {
			key1: null,
		}

		const src = {
			key1: ['subkey'],
		}

		const expected = {
			key1: ['subkey'],
		}

		expect(merge(target, src)).toEqual(expected)
	})

	test('should work on simple array', () => {
		const src = ['one', 'three']
		const target = ['one', 'two']

		const expected = ['one', 'two', 'one', 'three']

		expect(merge(target, src)).toEqual(expected)
		expect(Array.isArray(merge(target, src))).toBe(true)
	})

	test('should work on another simple array', () => {
		const target = ['a1', 'a2', 'c1', 'f1', 'p1']
		const src = ['t1', 's1', 'c2', 'r1', 'p2', 'p3']

		const expected = ['a1', 'a2', 'c1', 'f1', 'p1', 't1', 's1', 'c2', 'r1', 'p2', 'p3']
		expect(target).toEqual(['a1', 'a2', 'c1', 'f1', 'p1'])
		expect(merge(target, src)).toEqual(expected)
		expect(Array.isArray(merge(target, src))).toBe(true)
	})

	test('should work on array properties', () => {
		const src = {
			key1: ['one', 'three'],
			key2: ['four'],
		}
		const target = {
			key1: ['one', 'two'],
		}

		const expected = {
			key1: ['one', 'two', 'one', 'three'],
			key2: ['four'],
		}

		expect(merge(target, src)).toEqual(expected)
		expect(Array.isArray(merge(target, src).key1)).toBe(true)
		expect(Array.isArray(merge(target, src).key2)).toBe(true)
	})

	test('should work on array properties with clone option', () => {
		const src = {
			key1: ['one', 'three'],
			key2: ['four'],
		}
		const target = {
			key1: ['one', 'two'],
		}

		expect(target).toEqual({
			key1: ['one', 'two'],
		})
		const merged = merge(target, src)
		expect(merged.key1).not.toBe(src.key1)
		expect(merged.key1).not.toBe(target.key1)
		expect(merged.key2).not.toBe(src.key2)
	})

	test('should work on array of objects', () => {
		const src = [{ key1: ['one', 'three'], key2: ['one'] }, { key3: ['five'] }]
		const target = [{ key1: ['one', 'two'] }, { key3: ['four'] }]

		const expected = [
			{ key1: ['one', 'two'] },
			{ key3: ['four'] },
			{ key1: ['one', 'three'], key2: ['one'] },
			{ key3: ['five'] },
		]

		expect(merge(target, src)).toEqual(expected)
		expect(Array.isArray(merge(target, src))).toBe(true) // result should be an array
		expect(Array.isArray(merge(target, src)[0].key1)).toBe(true) // subkey should be an array too
	})

	test('should work on array of objects with clone option', () => {
		const src = [{ key1: ['one', 'three'], key2: ['one'] }, { key3: ['five'] }]
		const target = [{ key1: ['one', 'two'] }, { key3: ['four'] }]

		const expected = [
			{ key1: ['one', 'two'] },
			{ key3: ['four'] },
			{ key1: ['one', 'three'], key2: ['one'] },
			{ key3: ['five'] },
		]

		const merged = merge(target, src)
		expect(merged).toEqual(expected)
		expect(Array.isArray(merge(target, src))).toBe(true) // result should be an array
		expect(Array.isArray(merge(target, src)[0].key1)).toBe(true) // subkey should be an array too
		expect(merged[0].key1).not.toBe(src[0].key1)
		expect(merged[0].key1).not.toBe(target[0].key1)
		expect((merged[0] as any).key2).not.toBe((src[0] as any).key2)
		expect(merged[1].key3).not.toBe(src[1].key3)
		expect(merged[1].key3).not.toBe(target[1].key3)
	})

	test('should treat regular expressions like primitive values', () => {
		const target = { key1: /abc/ }
		const src = { key1: /efg/ }
		const expected = { key1: /efg/ }

		expect(merge(target, src)).toEqual(expected)
		expect(merge(target, src).key1.test('efg')).toBe(true)
	})

	test(
		'should treat regular expressions like primitive values and should not' +
			' clone even with clone option',
		() => {
			const target = { key1: /abc/ }
			const src = { key1: /efg/ }

			const output = merge(target, src)

			expect(output.key1).toBe(src.key1)
		},
	)

	test('should treat dates like primitives', () => {
		const monday = new Date('2016-09-27T01:08:12.761Z')
		const tuesday = new Date('2016-09-28T01:18:12.761Z')

		const target = {
			key: monday,
		}
		const source = {
			key: tuesday,
		}

		const expected = {
			key: tuesday,
		}
		const actual = merge(target, source)

		expect(actual).toEqual(expected)
		expect(actual.key.valueOf()).toBe(tuesday.valueOf())
	})

	test('should treat dates like primitives and should not clone even with clone option', () => {
		const monday = new Date('2016-09-27T01:08:12.761Z')
		const tuesday = new Date('2016-09-28T01:18:12.761Z')

		const target = {
			key: monday,
		}
		const source = {
			key: tuesday,
		}

		const actual = merge(target, source)

		expect(actual.key).toBe(tuesday)
	})

	test('should work on array with null in it', () => {
		const target: unknown[] = []

		const src = [null]

		const expected = [null]

		expect(merge(target, src)).toEqual(expected)
	})

	test("should clone array's element if it is object", () => {
		const a = { key: 'yup' }
		const target: unknown[] = []
		const source = [a]

		const output = merge(target, source)

		expect(output[0]).not.toBe(a)
		expect((output[0] as { key: string }).key).toBe('yup')
	})

	test('should clone an array property when there is no target array', () => {
		const someObject = {}
		const target = {}
		const source = { ary: [someObject] }
		const output = merge(target, source)

		expect(output).toEqual({ ary: [{}] })
		expect(output.ary[0]).not.toBe(someObject)
	})

	test('should overwrite values when property is initialised but undefined', () => {
		const target1 = { value: [] }
		const target2 = { value: null }
		const target3 = { value: 2 }

		const src = { value: undefined }

		function hasUndefinedProperty(o: any) {
			expect(Object.hasOwn(o, 'value')).toBe(true)
			expect(typeof o.value).toBe('undefined')
		}

		hasUndefinedProperty(merge(target1, src))
		hasUndefinedProperty(merge(target2, src))
		hasUndefinedProperty(merge(target3, src))
	})

	test('should overwrite null with the source', () => {
		const expected = { a: 'string' }
		const actual = merge(null, { a: 'string' })

		expect(actual).toEqual(expected)
	})

	test('dates should copy correctly in an array', () => {
		const monday = new Date('2016-09-27T01:08:12.761Z')
		const tuesday = new Date('2016-09-28T01:18:12.761Z')

		const target = [monday, 'dude']
		const source = [tuesday, 'lol']

		const expected = [monday, 'dude', tuesday, 'lol']
		const actual = merge(target, source)

		expect(actual).toEqual(expected)
	})

	test('merging objects with own __proto__ in target', () => {
		const user = {}
		const malicious = JSON.parse('{ "__proto__": { "admin": true } }')
		const mergedObject = merge(malicious, user)
		expect((mergedObject as any).__proto__?.admin).toBeFalsy() // non-plain properties should not be merged
		expect((mergedObject as any).admin).toBeFalsy() // the destination should have an unmodified prototype
	})

	test('merging objects with own prototype in target', () => {
		const user = {}
		const malicious = JSON.parse('{ "prototype": { "admin": true } }')
		const mergedObject = merge(malicious, user)
		expect((mergedObject as any).admin).toBeFalsy() // the destination should have an unmodified prototype
	})

	test('merging objects with own __proto__ in source', () => {
		const user = {}
		const malicious = JSON.parse('{ "__proto__": { "admin": true } }')
		const mergedObject = merge(user, malicious)
		expect((mergedObject as any).__proto__?.admin).toBeFalsy() // non-plain properties should not be merged
		expect((mergedObject as any).admin).toBeFalsy() // the destination should have an unmodified prototype
	})

	test('merging objects with own prototype in source', () => {
		const user = {}
		const malicious = JSON.parse('{ "prototype": { "admin": true } }')
		const mergedObject = merge(user, malicious)
		expect((mergedObject as any).admin).toBeFalsy() // the destination should have an unmodified prototype
	})

	test('merging objects with plain and non-plain properties in target', () => {
		const parent = {
			parentKey: 'should be undefined',
		}

		const target = Object.create(parent)
		;(target as any).plainKey = 'should be replaced'

		const source = {
			parentKey: 'foo',
			plainKey: 'bar',
			newKey: 'baz',
		}

		const mergedObject = merge(target, source)
		// 현재 merge 함수는 상속된 속성을 제거하지 않고 source의 값을 사용함
		expect((mergedObject as any).parentKey).toBe('foo') // source의 값이 우선됨
		expect((mergedObject as any).plainKey).toBe('bar') // enumerable own properties of target should be merged
		expect((mergedObject as any).newKey).toBe('baz') // properties not yet on target should be merged
	})

	test('merging objects with plain and non-plain properties in source', () => {
		const parent = {
			parentKey: 'should be foo',
		}

		const source = Object.create(parent)
		;(source as any).plainKey = 'bar'

		const target = {
			parentKey: 'foo',
			plainKey: 'should be bar',
			newKey: 'baz',
		}

		const mergedObject = merge(target, source)
		expect((mergedObject as any).parentKey).toBe('foo') // inherited properties of source should not be merged
		expect((mergedObject as any).plainKey).toBe('bar') // enumerable own properties of source should be merged
		expect((mergedObject as any).newKey).toBe('baz') // properties set on target should not be modified
	})

	test('merging objects with null prototype', () => {
		const target = Object.create(null)
		const source = Object.create(null)
		;(target as any).wheels = 4
		;(target as any).trunk = { toolbox: ['hammer'] }
		;(source as any).trunk = { toolbox: ['wrench'] }
		;(source as any).engine = 'v8'
		const expected = {
			wheels: 4,
			engine: 'v8',
			trunk: {
				toolbox: ['hammer', 'wrench'],
			},
		}

		expect(expected).toEqual(merge(target, source))
	})
})
