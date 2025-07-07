import { describe, expect, test } from 'vitest'

import { isPlainObject } from '../../src/is'

describe('is', () => {
	test('isPlainObject', () => {
		const fn1 = (x: unknown, be: boolean) => void expect(isPlainObject(x)).toBe(be)

		class Foo {
			x: number
			constructor(x: number) {
				this.x = x
			}
		}

		class Bar extends Foo {
			y: number
			constructor(x: number, y: number) {
				super(x)
				this.y = y
			}
		}

		function Fn1() {}
		Fn1.prototype.constructor = Object
		function Fn2() {}

		// true cases

		const json1 = '{"constructor":{"prototype":{"a0":true}}}'
		const json2 = '{"__proto__":{"a0":true}}'
		const json3 = '{"prototype":{"hello":"world"}}'

		fn1(JSON.parse(json1), true)
		fn1(JSON.parse(json2), true)
		fn1(JSON.parse(json3), true)

		fn1(Object.create(null), true)
		fn1({}, true)
		fn1({ foo: true }, true)
		fn1({ valueOf: 0 }, true)
		fn1(new Object(), true)
		fn1({ constructor: Foo }, true)

		// false cases

		fn1([1, 2], false)
		fn1(Math, false)
		fn1(JSON, false)
		fn1(Error, false)
		fn1(() => {}, false)
		fn1(/./, false)
		fn1(null, false)
		fn1(undefined, false)
		fn1(123, false)
		fn1('hello world', false)
		fn1(false, false)

		fn1(new Foo(1), false)
		fn1(new Bar(1, 2), false)
		fn1(new Map(), false)
		fn1(new Map(), false)
		fn1(new Uint16Array(), false)

		fn1(Object.create({}), false)
		fn1(new (Fn1 as any)(), false)

		const fn2 = new (Fn2 as any)()
		fn2.constructor = Object
		fn1(fn2, false)
	})
})
