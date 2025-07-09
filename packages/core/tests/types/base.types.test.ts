import type { If, IsAllOf, UnknownArray } from '../../src/types'

import { describe, expectTypeOf, test } from 'vitest'

describe('base.types', () => {
	test('If', () => {
		expectTypeOf<If<true, 'yes', 'no'>>().toEqualTypeOf<'yes'>()
		expectTypeOf<If<false, 'yes', 'no'>>().toEqualTypeOf<'no'>()
		expectTypeOf<If<boolean, 'yes', 'no'>>().toEqualTypeOf<'yes' | 'no'>()
		expectTypeOf<If<any, 'yes', 'no'>>().toEqualTypeOf<'yes' | 'no'>()
		expectTypeOf<If<never, 'yes', 'no'>>().toEqualTypeOf<'no'>()
	})

	test('IsAllArray', () => {
		type IsAllArray<Ts extends UnknownArray> = IsAllOf<Ts, UnknownArray>

		expectTypeOf<IsAllArray<[1, 2, 3]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[[number], string[]]>>().toEqualTypeOf<true>()
		expectTypeOf<IsAllArray<readonly [readonly [], readonly []]>>().toEqualTypeOf<true>()
		expectTypeOf<IsAllArray<[]>>().toEqualTypeOf<true>()
		expectTypeOf<IsAllArray<[[]]>>().toEqualTypeOf<true>()

		expectTypeOf<IsAllArray<[[number], boolean, string[]]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[[number], undefined, string[]]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[[number], null, string[]]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[[number], string[], { a: number }]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[{ a: number }]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[[], never, []]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[boolean, []]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[boolean[], [number, string], null]>>().toEqualTypeOf<false>()
		expectTypeOf<IsAllArray<[undefined]>>().toEqualTypeOf<false>()
	})
})

// type A1 = IsTuple<[1, 2, 3]>
// type A2 = IsTuple<number[]>
// type A3 = IsTuple<[1?, 2?]>
// type A4 = IsTuple<[1, 2, ...number[]]>
