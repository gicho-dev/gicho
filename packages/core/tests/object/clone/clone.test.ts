import { describe, expect, test } from 'vitest'

import { createClone } from '../../../src/object/clone'
import { fixtures } from './clone.fixtures'

describe('clone', () => {
	const { clone } = createClone()
	const { clone: cloneCircles } = createClone({ circles: true })

	const fn = <T>(x: T): [T, T] => {
		const x2 = clone(x)
		expect(x2).toEqual(x)

		const x3 = clone(x)
		expect(x3).toEqual(x)

		return [x, x2]
	}

	test('primitives', () => {
		fn(true)
		fn(10)
		fn('hello world')
		fn(null)
		fn(undefined)
		fn(NaN)
		fn(-Infinity)
		fn(Symbol('a'))
	})

	test('function', () => {
		let [a, a2] = fn(() => true as any)
		const orig = a.toString()

		a = () => 123
		expect(a2.toString()).toEqual(orig)
		a2 = () => 456
		expect(a.toString()).toEqual('() => 123')
	})

	describe('array', () => {
		test('flat', () => {
			const [a, a2] = fn(['a', 'b', 10, 20])

			a2[1] = 'c'
			expect(a2[1]).not.toEqual(a[1])
		})

		test('nested', () => {
			const [a, a2] = fn(['foo', [1, 2, ['hello', 'world'], 3], 'bar', 'baz']) as [any, any]
			a2[1][2][0] = 'hi'
			expect(a[1][2][0]).toEqual('hello')
			a2[1] = 'hello'
			expect(a[1]).not.toEqual('hello')
		})
	})

	describe('object', () => {
		test('flat', () => {
			// flat
			const [a, a2] = fn({ a: 1, b: 2, c: 3 }) as [any, any]
			a2.a += 1
			expect(a.a).toEqual(1)
			a2.b = 'hello'
			expect(a.b).toEqual(2)
		})

		test('nested', () => {
			const [a, a2] = fn({
				a: 1,
				b: { a: 2, b: ['hello', 'world'], c: [{ hello: 1, world: 2 }] },
			})
			a2.b.a = 11
			expect(a.b.a).toEqual(2)
			a2.b.b[1] = 'space'
			expect(a.b.b[1]).toEqual('world')
			a2.b.c[0].hello = 99
			expect(a.b.c[0].hello).toEqual(1)
		})

		test('Object.create (proto)', () => {
			const a = Object.create({
				a: 10,
				method() {
					return 'foo'
				},
			})
			const a2 = clone(a)
			const a3 = cloneCircles(a)

			expect(a.method()).toEqual('foo')
			expect(a2.method()).toEqual('foo')
			expect(a3.method()).toEqual('foo')
			expect(a2.a).toEqual(10)
			expect(a3.a).toEqual(10)
		})

		test('complex example', () => {
			fn(fixtures.obj1)
		})
	})

	describe('classes', () => {
		test('class', () => {
			class Foo {}
			const [a, a2] = fn(new Foo()) as [any, any]
			expect(a.constructor).toEqual(a2.constructor)
			expect(a2.constructor.name).toEqual('Foo')
			a2.foobar = 123
			expect(a.foobar).not.toEqual(123)
		})

		test('prototype', () => {
			function Foo() {}
			Foo.prototype.val = 10
			const [, b2] = fn(new (Foo as any)()) as [any, any]
			expect(b2.constructor).toEqual(Foo)
			expect(Object.getPrototypeOf(b2)).toEqual({ val: 10 })
			expect(b2).toEqual({}) // because this is prototype instance
			expect(b2.val).toEqual(10)
		})

		test('prototype methods - manual', () => {
			function Foo() {}
			Foo.prototype = {
				count: 0,
				inc() {
					this.count += 1
				},
			}

			const a = new (Foo as any)()
			const a2 = clone(a)

			expect(a.count).toEqual(0)
			expect(a2.count).toEqual(0)
			expect(typeof a.inc).toEqual('function')
			expect(typeof a2.inc).toEqual('function')
			a2.inc()
			expect(a.count).toEqual(0)
			expect(a2.count).toEqual(1)
			a.inc()
			expect(a.count).toEqual(1)
			expect(a2.count).toEqual(1)
		})

		test('prototype methods - class', () => {
			class Foo {
				count: number
				constructor() {
					this.count = 0
				}
				inc() {
					this.count += 1
				}
			}
			const [a, a2] = fn(new Foo())
			expect(Object.getPrototypeOf(a2)).toEqual(Foo.prototype)
			expect(a.count).toBe(0)
			expect(a2.count).toBe(0)
			expect(typeof a.inc).toBe('function')
			expect(typeof a2.inc).toBe('function')
			a2.inc()
			expect(a.count).toEqual(0)
			expect(a2.count).toEqual(1)
			a.inc()
			expect(a.count).toEqual(1)
			expect(a2.count).toEqual(1)
		})

		test('constructor properties - manual', () => {
			function Foo(this: any, value: number) {
				this.value = value
			}
			Foo.prototype.val = 10

			const [, a2] = fn(new (Foo as any)(20))
			expect(a2.constructor).toEqual(Foo)
			expect(Object.getPrototypeOf(a2)).toEqual({ val: 10 })
			expect(a2.value).toBe(20)
			expect(a2.val).toBe(10)
		})

		test('constructor properties - class', () => {
			class Foo {
				value: number
				constructor(value: number) {
					this.value = value
				}
			}
			;(Foo.prototype as any).val = 10

			const [, a2] = fn(new (Foo as any)(20))
			expect(a2.constructor).toEqual(Foo)
			expect(Object.getPrototypeOf(a2)).toEqual({ val: 10 })
			expect(a2.value).toBe(20)
			expect(a2.val).toBe(10)
		})

		test('constructor properties - defaults', () => {
			class Foo {
				value: number
				constructor(value = 10) {
					this.value = value
				}
			}
			const [, a2] = fn(new Foo(20))
			expect(a2.value).toBe(20)
		})

		test('constructor properties - Object.assign', () => {
			class Foo {
				constructor(data: any) {
					Object.assign(this, data)
				}
			}
			const [a, a2] = fn(new Foo({ x: 10, y: 20 }))
			expect(a.constructor).toEqual(a2.constructor)
			expect(a2.constructor.name).toEqual('Foo')
		})

		test('accessors', () => {
			class Foo {
				get val() {
					return 10
				}
			}
			const [a, a2] = fn(new Foo())
			expect(a2.constructor).toEqual(Foo)
			expect(Object.getPrototypeOf(a2)).toEqual({})

			expect(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a), 'val')).toEqual(
				Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a2), 'val'),
			)
			expect(a2.val).toBe(10)
		})

		test('inheritance', () => {
			class Foo {
				x: boolean
				constructor() {
					this.x = true
				}
				get y() {
					return true
				}
			}
			class Bar extends Foo {
				name: string
				constructor(name: string) {
					super()
					this.name = name
				}
				hello() {
					return `hello ${this.name}`
				}
			}
			const [a, a2] = fn(new Bar('world'))
			expect(a.name).toBe(a2.name)
			expect(a2 instanceof Foo).toBe(true)
			expect(a2.constructor).toEqual(Bar)
			expect(Object.getPrototypeOf(a2)).toEqual({})
			expect(a2.y).toBe(true)
			expect(Object.getOwnPropertyDescriptors(a)).toEqual(Object.getOwnPropertyDescriptors(a2))
		})
	})

	test('date', () => {
		const [a, a2] = fn(new Date())
		const orig = a.toString()
		a2.setDate('invalid-date' as any)
		expect(a2.toString()).toEqual('Invalid Date')
		expect(a.toString()).toEqual(orig)
	})

	test('RegExp', () => {
		const [a, a2] = fn(/foo/gi)
		a2.exec('foofoofoo')
		expect(a2.lastIndex).toEqual(3)
		expect(a.lastIndex).toEqual(0)

		const b = /foo/gi
		b.exec('foofoofoo')
		const bIndex = b.lastIndex
		const b2 = clone(b)
		expect(b2).toEqual(b)
		expect(bIndex).toEqual(3)
		expect(b.lastIndex).toEqual(bIndex)
		expect(b2.lastIndex).toEqual(bIndex)
	})

	describe('map', () => {
		test('flat', () => {
			const [a, a2] = fn(
				new Map([
					['a', 1],
					['b', 2],
				]),
			)
			a2.set('c', 3)
			expect(a.get('c')).toEqual(undefined)
			a.set('d', 4)
			expect(a2.get('d')).toEqual(undefined)
		})

		test('nested', () => {
			const [a, a2] = fn(
				new Map([
					['foo', { a: 1 }],
					['bar', [1, 2, 3]],
				]),
			)

			const foo = a2.get('foo') as any
			foo.b = 2
			foo.a += 1
			expect(a.get('foo')).toEqual({ a: 1 })
			expect(a2.get('foo')).toEqual({ a: 2, b: 2 })

			const bar = a2.get('bar') as number[]
			bar.push(4, 5, 6)
			expect(a.get('bar')).toEqual([1, 2, 3])
			expect(a2.get('bar')).toEqual([1, 2, 3, 4, 5, 6])
		})

		test('nested keys', () => {
			const [a, a2] = fn(new Map([[{ foo: 1 }, { a: 1 }]]))
			;([...a2.keys()][0] as any).bar = 2
			expect([...a.keys()][0]).toEqual({ foo: 1 })
			expect([...a2.keys()][0]).toEqual({ foo: 1, bar: 2 })
		})
	})

	describe('set', () => {
		test('flat', () => {
			const [a, a2] = fn(new Set('hello'))
			a2.add('world')
			expect(a.has('world')).toEqual(false)
			a.add('foo')
			expect(a2.has('foo')).toEqual(false)
		})

		test('nested', () => {
			const [a, a2] = fn(new Set([{ foo: 10 }]))
			const obj = [...a2.keys()][0] as any
			obj.bar = 5
			obj.foo += 10
			const item = [...a.keys()][0]
			expect(obj).toEqual({ foo: 20, bar: 5 })
			expect(item).toEqual({ foo: 10 })
		})
	})

	describe('TypedArray', () => {
		test('Buffer', () => {
			if (typeof Buffer === 'undefined') return

			const [a, a2] = fn(Buffer.from('abc'))
			a2.write('def')
			expect(a.toString()).toBe('abc')
			a2[1] = 10
			expect(a[1]).not.toBe(a2[1])

			const val = a2.toString()
			a.write('hello')
			expect(a2.toString()).toBe(val)
		})

		test('Int32Array', () => {
			const buf = new ArrayBuffer(8)
			const [a, a2] = fn(new Int32Array(buf))
			expect(a).toEqual(new Int32Array([0, 0]))
			expect(a2).toEqual(new Int32Array([0, 0]))

			a2[1] = 10
			expect(a[1]).toBe(0)
			a[0] = 20
			expect(a2[0]).toBe(0)
		})

		test('ArrayBuffer - empty', () => {
			const a = new ArrayBuffer(3)
			const v = new DataView(a)
			v.setInt8(0, 3)
			v.setInt8(1, 6)
			v.setInt8(2, 9)
			const a2 = clone(a)
			const a3 = cloneCircles(a)
			expect(a2).toEqual(a)
			expect(a3).toEqual(a)

			const v2 = new DataView(a2)
			expect(v2.getInt8(0)).toBe(3)
			expect(v2.getInt8(1)).toBe(6)
			expect(v2.getInt8(2)).toBe(9)
		})

		test('DataView', () => {
			const arr = new Int8Array([1, 2, 3])
			const [a, a2] = fn(new DataView(arr.buffer))
			expect(a.buffer).toEqual(a2.buffer)
			a.setInt8(1, 10)
			expect(arr[1]).toBe(10)
			expect(a.getInt8(1)).toBe(10)
			expect(a2.getInt8(1)).toBe(2)
			a2.setInt8(0, 20)
			expect(arr[0]).toBe(1)
			expect(a.getInt8(0)).toBe(1)
			expect(a2.getInt8(0)).toBe(20)
		})
	})

	// describe('dictionary', () => {
	// 	test('dictionary - empty', () => {
	// 		const [a, a2] = fn(Object.create(null))
	// 		console.log(a.constructor, a2.constructor)
	// 		expect(a2.constructor).toEqual(undefined)
	// 		a2.foo = 10
	// 		expect(a.foo).toBe(undefined)
	// 	})
	// })

	describe('pollution', () => {
		test('constructor', () => {
			const payload = '{"constructor":{"prototype":{"a0":true}}}'
			const a = JSON.parse(payload)
			const a2 = clone(a)
			expect(JSON.stringify(a2)).toBe(payload)

			expect(({} as any).a0, 'Safe POJO').not.toBe(true)
			expect((new Object() as any).a0, 'Safe Object').not.toBe(true)
			expect((Object.create(null) as any).a0, 'Safe dictionary').not.toBe(true)
			expect((Object.create(Object.prototype) as any).a0, 'Safe prototype').not.toBe(true)

			expect(a.a0, 'Safe input').not.toBe(true)
			expect(a2.a0, 'Safe output').not.toBe(true)
		})

		test('__proto__', () => {
			const payload = '{"__proto__":{"a0":true}}'
			const a = JSON.parse(payload)
			const a2 = clone(a)
			expect(JSON.stringify(a2)).toBe(payload)

			expect(({} as any).a0, 'Safe POJO').not.toBe(true)
			expect((new Object() as any).a0, 'Safe Object').not.toBe(true)
			expect((Object.create(null) as any).a0, 'Safe dictionary').not.toBe(true)
			expect((Object.create(Object.prototype) as any).a0, 'Safe prototype').not.toBe(true)

			expect(a.a0, 'Safe input').not.toBe(true)
			expect(a2.a0, 'Safe output').not.toBe(true)
		})

		test('prototype', () => {
			const payload = '{"prototype":{"hello":"world"}}'
			const a = JSON.parse(payload)
			const a2 = clone(a)
			expect(JSON.stringify(a2)).toBe(payload)

			expect(({} as any).hello, 'Safe POJO').not.toBe('world')
			expect((new Object() as any).hello, 'Safe Object').not.toBe('world')
			expect((Object.create(null) as any).hello, 'Safe dictionary').not.toBe('world')
			expect((Object.create(Object.prototype) as any).hello, 'Safe prototype').not.toBe('world')

			expect(a.hello, 'Safe input').not.toBe('world')
			expect(a2.hello, 'Safe output').not.toBe('world')
		})
	})

	describe('circular', () => {
		test('cloneCircles', () => {
			const a = fixtures.objCircular1 as any
			const a2 = cloneCircles(a)
			expect(a2).toEqual(a)
			a2.d.a = 2

			expect(a2.e.a).toEqual(2)
			expect(a2.a).toEqual(2)
			expect(a2.b[3].a).toEqual(2)
		})

		test('cloneCircles', () => {
			const a = fixtures.objCircular2 as any
			const a2 = cloneCircles(a)
			expect(a2).toEqual(a)
		})
	})
})
