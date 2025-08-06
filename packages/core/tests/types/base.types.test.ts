import type {
	And,
	AnyArray,
	AnyFunction,
	AnyRecord,
	Arrayable,
	Awaitable,
	BuiltIns,
	Constructor,
	Expect,
	If,
	IsAllOf,
	IsEqual,
	IsLooseTuple,
	IsNever,
	LastOfUnion,
	LiteralStringUnion,
	LiteralUnion,
	NonRecursiveType,
	Not,
	Nullable,
	Or,
	PlainObject,
	Primitive,
	TypedArray,
	UnionToIntersection,
	UnionToTuple,
	UnknownArray,
	UnknownMap,
	UnknownRecord,
	UnknownSet,
	ValuesToUnion,
} from '../../src/types'

import { assertType, describe, expectTypeOf, test } from 'vitest'

describe('base types', () => {
	class Foo {
		a: number
		b: string
		constructor(a: number, b: string) {
			this.a = a
			this.b = b
		}
	}

	describe('general base types', () => {
		test('Arrayable', () => {
			expectTypeOf('foo').toExtend<Arrayable<string>>()
			expectTypeOf(['foo', 'bar']).toExtend<Arrayable<string>>()
			expectTypeOf(undefined).toExtend<Arrayable<string | number | undefined>>()
			expectTypeOf(100).toExtend<Arrayable<string | number | undefined>>()
			expectTypeOf([undefined, 'foo', 10]).toExtend<Arrayable<string | number | undefined>>()

			expectTypeOf(['foo', 10]).not.toExtend<Arrayable<string>>()
			expectTypeOf([null, 'foo']).not.toExtend<Arrayable<string | number | undefined>>()
			expectTypeOf(null).not.toExtend<Arrayable<string | number | undefined>>()
			expectTypeOf(true).not.toExtend<Arrayable<string | number | undefined>>()
		})

		test('Awaitable', () => {
			expectTypeOf(Promise.resolve(100)).toExtend<Awaitable<number>>()
			expectTypeOf(100).toExtend<Awaitable<number>>()
			expectTypeOf(new Promise<boolean>((resolve) => resolve(true))).toExtend<Awaitable<boolean>>()
		})

		test('BuiltIns', () => {
			// same with Primitive
			expectTypeOf(100).toExtend<BuiltIns>()
			expectTypeOf(BigInt(25)).toExtend<BuiltIns>()
			expectTypeOf('test').toExtend<BuiltIns>()
			expectTypeOf(true).toExtend<BuiltIns>()
			expectTypeOf(null).toExtend<BuiltIns>()
			expectTypeOf(undefined).toExtend<BuiltIns>()
			expectTypeOf(Symbol('test')).toExtend<BuiltIns>()

			// + Date, RegExp
			expectTypeOf(new Date()).toExtend<BuiltIns>()
			expectTypeOf(/\n/g).toExtend<BuiltIns>()

			expectTypeOf({ a: 1 }).not.toExtend<BuiltIns>()
			expectTypeOf([1, 2]).not.toExtend<BuiltIns>()
			expectTypeOf(() => true).not.toExtend<BuiltIns>()
			expectTypeOf(new Map()).not.toExtend<BuiltIns>()
			expectTypeOf(new Set()).not.toExtend<BuiltIns>()
		})

		test('Constructor', () => {
			expectTypeOf(Foo).toExtend<Constructor<Foo>>()
			expectTypeOf(Foo).toExtend<Constructor<Foo, [number, string]>>()
			expectTypeOf(Foo).not.toExtend<Constructor<Foo, [boolean]>>()

			expectTypeOf('string').not.toExtend<Constructor<any>>()
			expectTypeOf(10).not.toExtend<Constructor<any>>()
			expectTypeOf(true).not.toExtend<Constructor<any>>()
			expectTypeOf(null).not.toExtend<Constructor<any>>()
			expectTypeOf(undefined).not.toExtend<Constructor<any>>()
		})

		test('Expect', () => {
			type Type1<T> = T extends number ? true : false

			expectTypeOf<Expect<Type1<30>>>().toEqualTypeOf<true>()
			expectTypeOf<Expect<Not<Type1<'Text'>>>>().toEqualTypeOf<true>()
		})

		test('IsAllArray', () => {
			type IsAllArray<Ts extends UnknownArray> = IsAllOf<Ts, UnknownArray>

			assertType<IsAllArray<[1, 2, 3]>>(false)
			assertType<IsAllArray<[[number], string[]]>>(true)
			assertType<IsAllArray<readonly [readonly [], readonly []]>>(true)
			assertType<IsAllArray<[]>>(true)
			assertType<IsAllArray<[[]]>>(true)

			assertType<IsAllArray<[[number], boolean, string[]]>>(false)
			assertType<IsAllArray<[[number], undefined, string[]]>>(false)
			assertType<IsAllArray<[[number], null, string[]]>>(false)
			assertType<IsAllArray<[[number], string[], { a: number }]>>(false)
			assertType<IsAllArray<[{ a: number }]>>(false)
			assertType<IsAllArray<[[], never, []]>>(false)
			assertType<IsAllArray<[boolean, []]>>(false)
			assertType<IsAllArray<[boolean[], [number, string], null]>>(false)
			assertType<IsAllArray<[undefined]>>(false)
		})

		test('IsLooseTuple', () => {
			assertType<IsLooseTuple<[]>>(true)
			assertType<IsLooseTuple<[10, 'text']>>(true)
			assertType<IsLooseTuple<[1, 2, ...number[]]>>(true)
			assertType<IsLooseTuple<[1, 2?, 3?]>>(true)

			assertType<IsLooseTuple<(number | string)[]>>(false)
			assertType<IsLooseTuple<[1?, 2?, 3?]>>(false) // TODO: check this case again
		})

		test('IsEqual', () => {
			assertType<IsEqual<number, number>>(true)
			assertType<IsEqual<never, never>>(true)

			assertType<IsEqual<number, boolean>>(false)
			assertType<IsEqual<string, never>>(false)
		})

		test('IsNever', () => {
			assertType<IsNever<never>>(true)
			assertType<IsNever<number>>(false)
			assertType<IsNever<string>>(false)
			assertType<IsNever<undefined>>(false)
			assertType<IsNever<null>>(false)
			assertType<IsNever<boolean>>(false)
			assertType<IsNever<object>>(false)
			assertType<IsNever<Array<number>>>(false)
			assertType<IsNever<{ a: number }>>(false)
		})

		test('NonRecursiveType', () => {
			// same with Primitive
			expectTypeOf(true).toExtend<NonRecursiveType>()
			expectTypeOf(100).toExtend<NonRecursiveType>()
			expectTypeOf('test').toExtend<NonRecursiveType>()
			expectTypeOf(BigInt(25)).toExtend<NonRecursiveType>()
			expectTypeOf(Symbol('test')).toExtend<NonRecursiveType>()
			expectTypeOf(null).toExtend<NonRecursiveType>()
			expectTypeOf(undefined).toExtend<NonRecursiveType>()

			// + Date, RegExp, Function, Constructor
			expectTypeOf(new Date()).toExtend<NonRecursiveType>()
			expectTypeOf(/\n/g).toExtend<NonRecursiveType>()
			expectTypeOf(() => false).toExtend<NonRecursiveType>()
			expectTypeOf(Foo).toExtend<NonRecursiveType>()

			expectTypeOf({ a: 1 }).not.toExtend<NonRecursiveType>()
			expectTypeOf([1, 2]).not.toExtend<NonRecursiveType>()
			expectTypeOf(new Map()).not.toExtend<NonRecursiveType>()
			expectTypeOf(new Set()).not.toExtend<NonRecursiveType>()
		})

		test('Nullable', () => {
			expectTypeOf(null).toExtend<Nullable<any>>()
			expectTypeOf(undefined).toExtend<Nullable<any>>()
			expectTypeOf(null).toExtend<Nullable<number>>()
			expectTypeOf(undefined).toExtend<Nullable<unknown>>()
			expectTypeOf('test').toExtend<Nullable<string>>()

			expectTypeOf(false).not.toExtend<Nullable<number>>()
		})

		test('PlainObject', () => {
			expectTypeOf({ a: 1, b: { c: 2 }, d: [1, 2, 3] }).toExtend<PlainObject>()
			expectTypeOf(Object.create(null)).toExtend<PlainObject>()

			// For class and interface cases,
			// the results are different between `any` and `unknown` types.
			expectTypeOf(new Foo(1, 'test')).toExtend<PlainObject<any>>()
			expectTypeOf(new Foo(1, 'test')).not.toExtend<PlainObject>() // T = unknown
			expectTypeOf(new Foo(1, 'test')).not.toExtend<PlainObject<unknown>>()

			expectTypeOf('test').not.toExtend<PlainObject>()
			expectTypeOf(10).not.toExtend<PlainObject>()
			expectTypeOf(null).not.toExtend<PlainObject>()
			expectTypeOf(undefined).not.toExtend<PlainObject>()
		})

		test('Primitive', () => {
			expectTypeOf(true).toExtend<Primitive>()
			expectTypeOf(100).toExtend<Primitive>()
			expectTypeOf('test string').toExtend<Primitive>()
			expectTypeOf(BigInt(25)).toExtend<Primitive>()
			expectTypeOf(Symbol('test')).toExtend<Primitive>()
			expectTypeOf(null).toExtend<Primitive>()
			expectTypeOf(undefined).toExtend<Primitive>()

			expectTypeOf(new Date()).not.toExtend<Primitive>()
			expectTypeOf(/\n/g).not.toExtend<Primitive>()
			expectTypeOf(() => false).not.toExtend<Primitive>()
			expectTypeOf(Foo).not.toExtend<Primitive>() // Constructor
			expectTypeOf({ a: 1 }).not.toExtend<Primitive>()
			expectTypeOf([1, 2]).not.toExtend<Primitive>()
			expectTypeOf(new Map()).not.toExtend<Primitive>()
			expectTypeOf(new Set()).not.toExtend<Primitive>()
		})

		test('TypedArray', () => {
			expectTypeOf(new Int8Array()).toExtend<TypedArray>()
			expectTypeOf(new Uint8Array()).toExtend<TypedArray>()
			expectTypeOf(new Uint8ClampedArray()).toExtend<TypedArray>()
			expectTypeOf(new Int16Array()).toExtend<TypedArray>()
			expectTypeOf(new Uint16Array()).toExtend<TypedArray>()
			expectTypeOf(new Int32Array()).toExtend<TypedArray>()
			expectTypeOf(new Uint32Array()).toExtend<TypedArray>()
			// expectTypeOf(new Float16Array()).toExtend<TypedArray>() // Too newer feature
			expectTypeOf(new Float32Array()).toExtend<TypedArray>()
			expectTypeOf(new Float64Array()).toExtend<TypedArray>()
			expectTypeOf(new BigInt64Array()).toExtend<TypedArray>()
			expectTypeOf(new BigUint64Array()).toExtend<TypedArray>()
			expectTypeOf(Buffer.from('test')).toExtend<TypedArray>() // UInt8Array
		})
	})

	describe('Any- or Unknown- (readonly) types', () => {
		test('AnyArray', () => {
			expectTypeOf(['test', 2, undefined, null]).toExtend<AnyArray>()
			expectTypeOf([() => true, { x: 1 }, new Map()]).toExtend<AnyArray>()

			expectTypeOf(true).not.toExtend<AnyArray>()
			expectTypeOf({ a: 1 }).not.toExtend<AnyArray>()
		})

		test('AnyFunction', () => {
			expectTypeOf(() => true).toExtend<AnyFunction>()
			expectTypeOf((a: number, b: string) => a + b).toExtend<AnyFunction>()

			expectTypeOf(new Map()).not.toExtend<AnyFunction>()
		})

		test('AnyRecord, UnknownRecord', () => {
			const obj1 = { a: 1, b: 'test', 3: true, [Symbol('s1')]: 'symbol1' }
			expectTypeOf(obj1).toExtend<AnyRecord>()
			expectTypeOf(obj1).toExtend<UnknownRecord>()

			// `AnyRecord` includes below types
			expectTypeOf(new Foo(1, 'test')).toExtend<AnyRecord>()
			expectTypeOf(() => true).toExtend<AnyRecord>()
			expectTypeOf([1, 2, 'str1']).toExtend<AnyRecord>()
			expectTypeOf(new Map()).toExtend<AnyRecord>()
			expectTypeOf(new Set()).toExtend<AnyRecord>()
			// `UnknownRecord` does NOT include below types
			expectTypeOf(new Foo(1, 'test')).not.toExtend<UnknownRecord>()
			expectTypeOf(() => true).not.toExtend<UnknownRecord>()
			expectTypeOf([1, 2, 'str1']).not.toExtend<UnknownRecord>()
			expectTypeOf(new Map()).not.toExtend<UnknownRecord>()
			expectTypeOf(new Set()).not.toExtend<UnknownRecord>()

			expectTypeOf(true).not.toExtend<AnyRecord>()
			expectTypeOf(1).not.toExtend<AnyRecord>()
			expectTypeOf(null).not.toExtend<AnyRecord>()
			expectTypeOf(undefined).not.toExtend<AnyRecord>()
			expectTypeOf(true).not.toExtend<UnknownRecord>()
			expectTypeOf(1).not.toExtend<UnknownRecord>()
			expectTypeOf(null).not.toExtend<UnknownRecord>()
			expectTypeOf(undefined).not.toExtend<UnknownRecord>()
		})

		test('UnknownArray', () => {
			expectTypeOf([1, 2, 'str1', undefined, null]).toExtend<UnknownArray>()
			expectTypeOf([() => true, { x: 1 }, new Map()]).toExtend<UnknownArray>()

			expectTypeOf(true).not.toExtend<UnknownArray>()
			expectTypeOf({ a: 1 }).not.toExtend<UnknownArray>()
		})

		test('UnknownMap', () => {
			expectTypeOf(
				new Map([
					[1, 'str1'],
					[2, 'str2'],
				]),
			).toExtend<UnknownMap>()
		})

		test('UnknownSet', () => {
			expectTypeOf(new Set([1, 2, 3])).toExtend<UnknownSet>()
		})
	})

	describe('logic types', () => {
		test('And', () => {
			assertType<And<true, true>>(true)
			assertType<And<true, false>>(false)
			assertType<And<false, true>>(false)
			assertType<And<false, false>>(false)
		})

		test('Not', () => {
			assertType<Not<true>>(false)
			assertType<Not<false>>(true)
		})

		test('Or', () => {
			assertType<Or<true, true>>(true)
			assertType<Or<true, false>>(true)
			assertType<Or<false, true>>(true)
			assertType<Or<false, false>>(false)
		})

		test('If', () => {
			expectTypeOf<If<true, 'yes', 'no'>>().toEqualTypeOf<'yes'>()
			expectTypeOf<If<false, 'yes', 'no'>>().toEqualTypeOf<'no'>()
			expectTypeOf<If<boolean, 'yes', 'no'>>().toEqualTypeOf<'yes' | 'no'>()
			expectTypeOf<If<any, 'yes', 'no'>>().toEqualTypeOf<'yes' | 'no'>()
			expectTypeOf<If<never, 'yes', 'no'>>().toEqualTypeOf<'no'>()
		})
	})

	describe('union types', () => {
		test('LastOfUnion', () => {
			assertType<LastOfUnion<1 | 2 | 3 | 4>>(4)
			assertType<LastOfUnion<'a' | 'b' | 'c'>>('c')
			assertType<LastOfUnion<'a'>>('a')
		})

		test('LiteralUnion, LiteralStringUnion', () => {
			type Num1 = LiteralUnion<1 | 2, number | string>
			expectTypeOf(1).toExtend<Num1>()
			expectTypeOf(2).toExtend<Num1>()
			expectTypeOf(3.5).toExtend<Num1>()
			expectTypeOf(-100 / 2).toExtend<Num1>()
			expectTypeOf(Infinity).toExtend<Num1>()
			expectTypeOf('350').toExtend<Num1>()
			expectTypeOf(true).not.toExtend<Num1>()

			type Color = LiteralStringUnion<'red' | 'blue' | 'green'>
			expectTypeOf('red').toExtend<Color>()
			expectTypeOf('blue').toExtend<Color>()
			expectTypeOf('green').toExtend<Color>()
			expectTypeOf('other color').toExtend<Color>()
			expectTypeOf(true).not.toExtend<Color>()
		})

		test('UnionToIntersection', () => {
			type Union1 =
				| { a: number; c: number }
				| { b: boolean; c: string }
				| { hello(name: string): string }

			assertType<UnionToIntersection<Union1>>({ a: 2, b: true, c: '?' as never, hello: () => 'hi' })
		})

		test('UnionToTuple', () => {
			type A = null | 2 | 'a'
			type A2 =
				| [null, 2, 'a']
				| [null, 'a', 2]
				| [2, null, 'a']
				| [2, 'a', null]
				| ['a' | null | 2]
				| ['a' | 2 | null]

			expectTypeOf<UnionToTuple<A>>().toExtend<A2>() // unordered tuple

			expectTypeOf<UnionToTuple<1 | 2 | 3>[number]>().toExtend<1 | 2 | 3>()
			expectTypeOf<UnionToTuple<boolean | 10>[number]>().toExtend<10 | true | false>()
		})

		test('ValuesToUnion', () => {
			expectTypeOf<ValuesToUnion<[1, 2, 3]>>().toEqualTypeOf<1 | 2 | 3>()
			expectTypeOf<ValuesToUnion<{ a: 'x'; b: 'y'; c: 'z' }>>().toEqualTypeOf<'x' | 'y' | 'z'>()
		})
	})
})
