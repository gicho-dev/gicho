import type { IsPlainObject } from '../../src/types/object.types'

import { describe, expectTypeOf, test } from 'vitest'

describe('object.types', () => {
	class C1 {
		x: number
		constructor(x: number) {
			this.x = x
		}
	}
	class C11 extends C1 {
		y: number
		constructor(x: number, y: number) {
			super(x)
			this.y = y
		}
	}
	const c1 = new C1(1)
	const c11 = new C11(c1.x, 3)
	const ignoredVar = `${c11}`

	test('IsPlainObject', () => {
		type A<T> = IsPlainObject<T>

		expectTypeOf<A<undefined>>().toEqualTypeOf<false>()
		expectTypeOf<A<null>>().toEqualTypeOf<false>()
		expectTypeOf<A<number>>().toEqualTypeOf<false>()
		expectTypeOf<A<string>>().toEqualTypeOf<false>()
		expectTypeOf<A<boolean>>().toEqualTypeOf<false>()
		expectTypeOf<A<Date>>().toEqualTypeOf<false>()
		expectTypeOf<A<RegExp>>().toEqualTypeOf<false>()
		expectTypeOf<A<Map<any, any>>>().toEqualTypeOf<false>()
		expectTypeOf<A<Set<any>>>().toEqualTypeOf<false>()
		expectTypeOf<A<(...args: any[]) => any>>().toEqualTypeOf<false>()
		expectTypeOf<A<new (...args: any[]) => any>>().toEqualTypeOf<false>()
		expectTypeOf<A<typeof C1>>().toEqualTypeOf<false>()
		expectTypeOf<A<unknown>>().toEqualTypeOf<false>()
		expectTypeOf<A<unknown[]>>().toEqualTypeOf<false>()

		expectTypeOf<A<never>>().toEqualTypeOf<never>()

		expectTypeOf<A<Record<string, unknown>>>().toEqualTypeOf<true>()
		expectTypeOf<A<Record<string, any>>>().toEqualTypeOf<true>()
		expectTypeOf<A<{}>>().toEqualTypeOf<true>()
		expectTypeOf<A<{ a: never }>>().toEqualTypeOf<true>()
		expectTypeOf<A<{ a: string }>>().toEqualTypeOf<true>()
		expectTypeOf<A<{ a: Date; b: { c: number } }>>().toEqualTypeOf<true>()

		interface I1 {
			a: number
		}
		expectTypeOf<A<I1>>().toEqualTypeOf<true>()

		// difficult to distinguish between class instances and plain objects
		expectTypeOf<A<C1>>().toEqualTypeOf<true>()
		expectTypeOf<A<C11>>().toEqualTypeOf<true>()
		expectTypeOf<A<typeof c1>>().toEqualTypeOf<true>()
		expectTypeOf<A<typeof c11>>().toEqualTypeOf<true>()
		expectTypeOf<A<typeof C1.prototype>>().toEqualTypeOf<true>()
	})
})
