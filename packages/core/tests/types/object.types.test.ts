import type {
	FilterPlainObjects,
	IsAllPlainObject,
	IsKeyOptional,
	IsPlainObject,
	Merge,
	MergeTwo,
	OmitIndexSignature,
	OptionalKeysOf,
	PartialByKeys,
	PartialDeep,
	PickIndexSignature,
	Prettify,
	RequiredByKeys,
	RequiredDeep,
	RequiredKeysOf,
} from '../../src/types'

import { describe, expectTypeOf, test } from 'vitest'

describe('object types', () => {
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

	describe('Index signature', () => {
		test('OmitIndexSignature', () => {
			interface A {
				[x: string]: any
				[x: number]: any
				[x: symbol]: any
				[x: `some-${string}`]: string
				[x: `${number}-${bigint}`]: number
				a: number
				b?: string
			}
			expectTypeOf<OmitIndexSignature<A>>().toEqualTypeOf<{ a: number; b?: string }>()
		})

		test('PickIndexSignature', () => {
			interface A {
				[x: string]: any
				[x: number]: any
				[x: symbol]: any
				[x: `some-${string}`]: string
				[x: `${number}-${bigint}`]: number
				a: number
				b?: string
			}
			expectTypeOf<PickIndexSignature<A>>().toEqualTypeOf<{
				[x: string]: any
				[x: number]: any
				[x: symbol]: any
				[x: `some-${string}`]: string
				[x: `${number}-${bigint}`]: number
			}>()
		})
	})

	describe('merge', () => {
		test('Merge', () => {
			interface A1 {
				a: number
				b: string
			}
			interface A2 {
				a: string
				c: boolean
			}

			expectTypeOf<Prettify<A1 & A2>>().toEqualTypeOf<{ a: never; b: string; c: boolean }>()
			expectTypeOf<Merge<[A1, A2]>>().toEqualTypeOf<{ a: string; b: string; c: boolean }>()
			expectTypeOf<MergeTwo<A1, A2>>().toEqualTypeOf<{ a: string; b: string; c: boolean }>()

			interface B1 {
				[x: string]: unknown
				[x: number]: unknown
				a: string
				b: symbol
				opt1?: string
				opt2: string
				opt3?: string
			}
			interface B2 {
				[x: number]: number
				[x: symbol]: boolean
				b: Date
				c: boolean
				opt1?: string
				opt2?: string
				opt3: string
			}

			expectTypeOf<Merge<[B1, B2]>>().toEqualTypeOf<{
				[x: string]: unknown
				[x: number]: number
				[x: symbol]: boolean
				a: string
				b: Date
				c: boolean
				opt1?: string
				opt2?: string
				opt3: string
			}>()
		})
	})

	describe('plain object', () => {
		test('FilterPlainObjects', () => {
			interface A1 {
				a: number
				b: string
				c: { d: number; arr: string[] }
			}

			expectTypeOf<
				FilterPlainObjects<
					[
						1,
						{ a: 1 },
						() => true,
						null,
						undefined,
						[1, 2],
						A1,
						Map<string, number>,
						Set<boolean>,
						C1,
					]
				>
			>().toEqualTypeOf<[{ a: 1 }, A1, C1]>() // includes class types
		})

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

		test('IsAllPlainObject', () => {
			interface A1 {
				[x: number]: any
				b: string
			}

			expectTypeOf<IsAllPlainObject<[{ a: 1 }, A1, C1]>>().toEqualTypeOf<true>()

			// for now, includes empty array... but, is this correct? (think again...)
			expectTypeOf<IsAllPlainObject<[]>>().toEqualTypeOf<true>()

			expectTypeOf<IsAllPlainObject<[1, { a: 1 }]>>().toEqualTypeOf<false>()
			expectTypeOf<IsAllPlainObject<[[1, 2], { a: 1 }]>>().toEqualTypeOf<false>()
		})
	})

	describe('prettify', () => {
		test('Prettify', () => {
			interface A1 {
				a: number
				b: string
			}
			interface A2 {
				c: boolean
				d: Date
			}
			interface A1A2 {
				a: number
				b: string
				c: boolean
				d: Date
			}
			expectTypeOf<A1 & A2>().not.toEqualTypeOf<A1A2>()
			expectTypeOf<Prettify<A1 & A2>>().toEqualTypeOf<A1A2>()
		})
	})

	describe('optional, required keys', () => {
		test('IsKeyOptional', () => {
			interface A1 {
				[x: string]: any
				a: number
				b?: boolean
			}
			expectTypeOf<IsKeyOptional<'a', A1>>().toEqualTypeOf<false>()
			expectTypeOf<IsKeyOptional<'b', A1>>().toEqualTypeOf<true>()
		})

		test('OptionalKeysOf', () => {
			interface A1 {
				[x: string]: any
				a: number
				b?: boolean
				c: { d: number }
				fn?: () => boolean
				dt1?: Date
			}
			expectTypeOf<OptionalKeysOf<A1>>().toEqualTypeOf<'b' | 'fn' | 'dt1'>()
		})

		test('PartialByKeys', () => {
			interface A1 {
				a?: number
				b?: boolean
				c: number
				d: symbol
			}

			expectTypeOf<PartialByKeys<A1, 'a' | 'b'>>().toEqualTypeOf<A1>()
			expectTypeOf<PartialByKeys<A1, 'b' | 'c'>>().toEqualTypeOf<{
				a?: number
				b?: boolean
				c?: number
				d: symbol
			}>()
			expectTypeOf<PartialByKeys<A1, keyof A1>>().toEqualTypeOf<Partial<A1>>()
			expectTypeOf<PartialByKeys<A1, never>>().toEqualTypeOf<A1>()
		})

		test('RequiredByKeys', () => {
			interface A1 {
				a: number
				b?: boolean
				c?: number
				d?: symbol
			}

			expectTypeOf<RequiredByKeys<A1, 'a'>>().toEqualTypeOf<A1>()
			expectTypeOf<RequiredByKeys<A1, 'b' | 'c'>>().toEqualTypeOf<{
				a: number
				b: boolean
				c: number
				d?: symbol
			}>()
			expectTypeOf<RequiredByKeys<A1, keyof A1>>().toEqualTypeOf<Required<A1>>()
			expectTypeOf<RequiredByKeys<A1, never>>().toEqualTypeOf<A1>()
			// @ts-expect-error - wrong key
			expectTypeOf<RequiredByKeys<A1, 'b' | 'wrong'>>().toEqualTypeOf<{
				a: number
				b: boolean
				c?: number
				d?: symbol
			}>()
		})

		test('RequiredKeysOf', () => {
			interface A1 {
				a: number
				b?: boolean
				c: { d: number }
				fn?: () => boolean
				dt1?: Date
				map1: Map<string, number>
			}
			expectTypeOf<RequiredKeysOf<A1>>().toEqualTypeOf<'a' | 'c' | 'map1'>()
		})
	})

	describe('partial / required deep', () => {
		test('PartialDeep', () => {
			const obj1 = {
				baz: 'fred',
				bar: {
					function: (_: string): void => undefined,
					instance1: new C1(10),
					constructor1: C1,
					object: { key: 'value' },
					string: 'waldo',
					number: 1,
					boolean: false,
					date: new Date(),
					regexp: /.*/,
					symbol: Symbol('test'),
					null: null,
					undefined: undefined, // eslint-disable-line object-shorthand
					map: new Map<string, string>(),
					set: new Set<string>(),
					array: ['foo'],
					tuple: ['foo'] as ['foo'],
					readonlyMap: new Map<string, string>() as ReadonlyMap<string, string>,
					readonlySet: new Set<string>() as ReadonlySet<string>,
					readonlyArray: ['foo'] as readonly string[],
					readonlyTuple: ['foo'] as const,
				},
			}
			const obj1Ignored = obj1 // to prevent lint warning
			type Obj1 = typeof obj1
			type Obj1Bar = Obj1['bar']

			expectTypeOf<PartialDeep<Obj1>>().toEqualTypeOf<{
				baz?: string
				bar?: Prettify<
					Omit<Partial<Obj1Bar>, 'constructor1' | 'instance1' | 'object'> & {
						constructor1?: typeof C1
						instance1?: { x?: number }
						object?: { key?: string }
					}
				>
			}>()
		})

		test('RequiredDeep', () => {
			// ref: `type-fest` test case

			interface A {
				a?: string
				b?: {
					fn1?: (...args: any[]) => void
					fn2?: (a: number, b: number) => boolean
					fn3?: {
						(a: number): string
						(a: number, b: number): boolean
					}
					namespace?: {
						(a: number): string
						key?: string
					}
					namespace2?: {
						(a: number): string
						(a: number, b: number): string
						key: string | undefined
					}
					object?: { key?: string }
					string?: string
					number?: number
					boolean?: boolean
					date?: Date
					regexp?: RegExp
					symbol?: symbol
					null?: null
					undefined?: undefined
					map?: Map<string, string>
					set?: Set<string>
					array?: string[]
					tuple?: ['foo']
					readonlyMap?: ReadonlyMap<string | undefined, string | undefined>
					readonlySet?: ReadonlySet<string | undefined>
					readonlyArray?: readonly (string | undefined)[]
					readonlyTuple?: readonly ['foo' | undefined]
					weakMap?: WeakMap<{ key?: string }, string | undefined>
					weakSet?: WeakSet<{ key?: string }>
					promise?: Promise<string | undefined>
					classInstance?: C1
				}
			}

			interface ARequiredExpected {
				a: string
				b: {
					fn1: (...args: any[]) => void
					fn2: (a: number, b: number) => boolean
					fn3: {
						(a: number): string
						(a: number, b: number): boolean
					}
					namespace: {
						(a: number): string
						key: string
					}
					namespace2: {
						(a: number): string
						(a: number, b: number): string
						key: string // currently typescript limitation
					}
					object: { key: string }
					string: string
					number: number
					boolean: boolean
					date: Date
					regexp: RegExp
					symbol: symbol
					null: null
					undefined: never
					map: Map<string, string>
					set: Set<string>
					array: string[]
					tuple: ['foo']
					readonlyMap: ReadonlyMap<string, string>
					readonlySet: ReadonlySet<string>
					readonlyArray: readonly string[]
					readonlyTuple: readonly ['foo']
					weakMap: WeakMap<{ key: string }, string>
					weakSet: WeakSet<{ key: string }>
					promise: Promise<string>
					classInstance: C1
				}
			}

			type ARequired = RequiredDeep<A>
			type B1 = ARequired['b']
			type B2 = ARequiredExpected['b']

			expectTypeOf<B1['fn1']>().toEqualTypeOf<B2['fn1']>()
			expectTypeOf<B1['fn2']>().toEqualTypeOf<B2['fn2']>()
			expectTypeOf<B1['fn3']>().toEqualTypeOf<B2['fn3']>()
			expectTypeOf<B1['object']>().toEqualTypeOf<B2['object']>()
			expectTypeOf<B1['string']>().toEqualTypeOf<B2['string']>()
			expectTypeOf<B1['number']>().toEqualTypeOf<B2['number']>()
			expectTypeOf<B1['boolean']>().toEqualTypeOf<B2['boolean']>()
			expectTypeOf<B1['date']>().toEqualTypeOf<B2['date']>()
			expectTypeOf<B1['regexp']>().toEqualTypeOf<B2['regexp']>()
			expectTypeOf<B1['symbol']>().toEqualTypeOf<B2['symbol']>()
			expectTypeOf<B1['null']>().toEqualTypeOf<B2['null']>()
			expectTypeOf<B1['undefined']>().toEqualTypeOf<B2['undefined']>()
			expectTypeOf<B1['map']>().toEqualTypeOf<B2['map']>()
			expectTypeOf<B1['set']>().toEqualTypeOf<B2['set']>()
			expectTypeOf<B1['array']>().toEqualTypeOf<B2['array']>()
			expectTypeOf<B1['tuple']>().toEqualTypeOf<B2['tuple']>()
			expectTypeOf<B1['readonlyMap']>().toEqualTypeOf<B2['readonlyMap']>()
			expectTypeOf<B1['readonlySet']>().toEqualTypeOf<B2['readonlySet']>()
			expectTypeOf<B1['readonlyArray']>().toEqualTypeOf<B2['readonlyArray']>()
			expectTypeOf<B1['readonlyTuple']>().toEqualTypeOf<B2['readonlyTuple']>()
			expectTypeOf<B1['weakMap']>().toEqualTypeOf<B2['weakMap']>()
			expectTypeOf<B1['weakSet']>().toEqualTypeOf<B2['weakSet']>()
			expectTypeOf<B1['promise']>().toEqualTypeOf<B2['promise']>()
			expectTypeOf<B1['classInstance']>().toEqualTypeOf<B2['classInstance']>()

			// TODO: Fix this case: https://github.com/mmkal/expect-type/issues/34
			// @ts-expect-error - by `type-fest`
			expectTypeOf<B1['namespace']>().toEqualTypeOf<B2['namespace']>()

			// @ts-expect-error - due to typescript limitation
			expectTypeOf<B1['namespace2']>().toEqualTypeOf<B2['namespace2']>()
		})
	})
})
