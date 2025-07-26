/** A value that can be either a single item of type T or an array of T. */
export type Arrayable<T> = T | T[]

/** A value that may be a Promise or a plain value. */
export type Awaitable<T> = T | PromiseLike<T>

/** Matches any primitive, Date, or RegExp. */
export type BuiltIns = Primitive | Date | RegExp

/** Matches a `class` constructor. */
export type Constructor<T, TArgs extends unknown[] = any[]> = new (...args: TArgs) => T

export type Expect<T extends true> = T

/** Check if the given function has multiple call signatures. */
export type HasMultipleCallSignatures<T extends (...arguments_: any[]) => unknown> = T extends {
	(...arguments_: infer A): unknown
	(...arguments_: infer B): unknown
}
	? B extends A
		? A extends B
			? false
			: true
		: true
	: false

/** Returns a boolean for whether all elements in the array are of the same `T` type. */
export type IsAllOf<Ts extends UnknownArray, T> = Ts extends readonly [infer TFirst, ...infer TRest]
	? If<IsNever<TFirst>, false, TFirst extends T ? IsAllOf<TRest, T> : false>
	: true

/** Returns a boolean for whether the given type is a loose tuple. */
export type IsLooseTuple<T extends UnknownArray> = T extends readonly []
	? true
	: T extends readonly [unknown, ...UnknownArray]
		? true
		: false

/** Returns a boolean for whether the two given types are equal. */
export type IsEqual<A, B> =
	(<T>() => T extends (A & T) | T ? 1 : 2) extends <T>() => T extends (B & T) | T ? 1 : 2
		? true
		: false

/** Returns a boolean for whether the given type is `never`. */
export type IsNever<T> = [T] extends [never] ? true : false

/** Matches non-recursive types. */
export type NonRecursiveType = BuiltIns | AnyFunction | Constructor<unknown, any[]>

/** A value that may be null or undefined. */
export type Nullable<T> = T | null | undefined

/** A plain (record) object. */
export type PlainObject<T = unknown> = Record<PropertyKey, T>

/** Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive). */
export type Primitive = Nullable<string | number | bigint | boolean | symbol>

/**
 * Matches any [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), like `Uint8Array` or `Float64Array`.
 */
export type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float16Array
	| Float32Array
	| Float64Array
	| BigInt64Array
	| BigUint64Array

/* ----------------------------------------
 *   Any- or Unknown- (readonly) types
 * ------------------------------------- */

/** Represents an array with `any` value. */
export type AnyArray = readonly any[]
/** Represents a function that can take any number of parameters and return any value. */
export type AnyFunction = (...args: any[]) => any
/** Represents an object with `any` value. You probably want this instead of `{}`. */
export type AnyRecord = Record<PropertyKey, any>

/** Represents an array with `unknown` value. */
export type UnknownArray = readonly unknown[]
/** Represents a map with `unknown` key and value. */
export type UnknownMap = ReadonlyMap<unknown, unknown>
/** Represents an object with `unknown` value. You probably want this instead of `{}`. */
export type UnknownRecord = Record<PropertyKey, unknown>
/** Represents a set with `unknown` value. */
export type UnknownSet = ReadonlySet<unknown>

/* ----------------------------------------
 *   Logic types
 * ------------------------------------- */

export type And<T1 extends boolean, T2 extends boolean> = [T1] extends [false] ? false : T2

/** Returns a boolean for whether A is false. */
export type Not<T extends boolean> = T extends true ? false : T extends false ? true : never

export type Or<T1 extends boolean, T2 extends boolean> = [T1] extends [true] ? true : T2

/**
 * An if-else-like type that resolves depending on whether the given `boolean` type is `true` or `false`.
 *
 * @example
 * ```
 * type A1 = If<true, 'yes', 'no'>      // => 'yes'
 * type A2 = If<false, 'yes', 'no'>     // => 'no'
 * type A3 = If<boolean, 'yes', 'no'>   // => 'yes' | 'no'
 * type A4 = If<any, 'yes', 'no'>       // => 'yes' | 'no'
 * type A5 = If<never, 'yes', 'no'>     // => 'no'
 * ```
 */
export type If<T extends boolean, TIfBranch, TElseBranch> =
	IsNever<T> extends true ? TElseBranch : T extends true ? TIfBranch : TElseBranch

/* ----------------------------------------
 *   Union types
 * ------------------------------------- */

/** Returns the last element of a union type. */
export type LastOfUnion<T> =
	UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

/**
 * Creates a union type that provides auto-completion for literal values in `T`
 * while still allowing any value of type `TBase`.
 *
 * This is useful when you want to suggest specific values (like 'red' | 'blue')
 * but still accept any string/number/etc.
 *
 * @example
 * ```
 * type Color = LiteralUnion<'red' | 'blue' | 'green', string>
 * // IDE will suggest 'red', 'blue', 'green' but also accepts any string
 * ```
 */
export type LiteralUnion<T, TBase extends Primitive> = T | (TBase & Record<never, never>)

/**
 * Creates a union type that provides auto-completion for literal values in `T`
 * while still allowing any value of type `string`.
 *
 * @example
 * ```
 * type Color = LiteralStringUnion<'red' | 'blue' | 'green'>
 * // IDE will suggest 'red', 'blue', 'green' but also accepts any string
 * ```
 */
export type LiteralStringUnion<T> = LiteralUnion<T, string>

/**
 * Convert a union type to an intersection type using [distributive conditional types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
 *
 * @example
 * ```
 * type Union = { a: number } | { b: boolean } | { hello(name: string): string };
 *
 * type Intersection = UnionToIntersection<Union>;
 * // => { a: number; b: boolean; hello(name: string): string };
 * ```
 */
export type UnionToIntersection<TUnion> = (
	TUnion extends unknown ? (x: TUnion) => void : never
) extends (x: infer TIntersection) => void
	? TIntersection & TUnion
	: never

/**
 * Convert a union type to an unordered tuple type of its elements.
 *
 * @example
 * ```
 * type Numbers = UnionToTuple<1 | 2 | 3>   // => [1, 2, 3]
 * ```
 */
export type UnionToTuple<T, L = LastOfUnion<T>> =
	IsNever<T> extends false ? [...UnionToTuple<Exclude<T, L>>, L] : []

/**
 * Create a union of any values in a tuple or record.
 *
 * @example
 * ```
 * type Numbers = ValuesToUnion<[1, 2, 3]>   // => 1 | 2 | 3
 * type Strings = ValuesToUnion<{ a: 'x', b: 'y' }>   // => 'x' | 'y'
 * ```
 */
export type ValuesToUnion<TArrayOrRecord extends readonly any[] | Record<PropertyKey, unknown>> =
	TArrayOrRecord extends readonly any[]
		? TArrayOrRecord[number]
		: TArrayOrRecord[keyof TArrayOrRecord]
