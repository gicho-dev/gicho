/* eslint-disable @typescript-eslint/no-empty-object-type */

import type { HasMultipleCallSignatures } from './is.types'

export type And<T1 extends boolean, T2 extends boolean> = [T1] extends [false] ? false : T2

/** A function that can take any number of parameters and return any value. */
export type AnyFunction = (...args: any[]) => any

/** A value that can be either a single item of type T or an array of T. */
export type Arrayable<T> = T | T[]

/** A value that may be a Promise or a plain value. */
export type Awaitable<T> = T | PromiseLike<T>

/** Matches any primitive, Date, or RegExp. */
export type BuiltIns = Primitive | Date | RegExp

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

/** Returns a boolean for whether all elements in the array are of the same `T` type. */
export type IsAllOf<Ts extends UnknownArray, T> = Ts extends readonly [infer THead, ...infer TRest]
	? If<IsNever<THead>, false, THead extends T ? IsAllOf<TRest, T> : false>
	: true

/**  */
export type IsLooseTuple<T extends UnknownArray> = T extends readonly []
	? true
	: T extends readonly [unknown, ...UnknownArray]
		? true
		: false

/** Returns a boolean for whether a key is optional in the given object. */
export type IsKeyOptional<K extends PropertyKey, T extends Partial<Record<K, unknown>>> =
	T extends Record<K, unknown> ? false : true

/** Returns a boolean for whether the given type is `never`. */
export type IsNever<T> = [T] extends [never] ? true : false

/** Matches non-recursive types. */
export type NonRecursiveType = BuiltIns | AnyFunction | (new (...args: any[]) => unknown)

/** Returns a boolean for whether A is false. */
export type Not<T extends boolean> = T extends true ? false : T extends false ? true : never

export type Or<T1 extends boolean, T2 extends boolean> = [T1] extends [true] ? true : T2

/* ----------------------------------------
 *   PartialDeep
 * ------------------------------------- */

/**
 * Create a type where all properties, including those in nested structures, are optional.
 */
export type PartialDeep<T> = T extends BuiltIns | (new (...args: any[]) => unknown)
	? T
	: IsNever<keyof T> extends true
		? T
		: T extends Map<infer TKey, infer TValue>
			? Map<PartialDeep<TKey>, PartialDeep<TValue>>
			: T extends ReadonlyMap<infer TKey, infer TValue>
				? ReadonlyMap<PartialDeep<TKey>, PartialDeep<TValue>>
				: T extends Set<infer TValue>
					? Set<PartialDeep<TValue>>
					: T extends ReadonlySet<infer TValue>
						? ReadonlySet<PartialDeep<TValue>>
						: T extends object
							? T extends UnknownArray
								? T
								: (T extends AnyFunction ? (...args: Parameters<T>) => ReturnType<T> : {}) & {
										[K in keyof T]?: PartialDeep<T[K]>
									}
							: unknown

/* ----------------------------------------
 *   RequiredDeep
 * ------------------------------------- */

/**
 * Create a type where all properties, including those in nested structures, are required.
 */
export type RequiredDeep<
	T,
	E extends Exclude<T, undefined> = Exclude<T, undefined>,
> = E extends BuiltIns
	? E
	: E extends Map<infer TKey, infer TValue>
		? Map<RequiredDeep<TKey>, RequiredDeep<TValue>>
		: E extends ReadonlyMap<infer TKey, infer TValue>
			? ReadonlyMap<RequiredDeep<TKey>, RequiredDeep<TValue>>
			: E extends WeakMap<infer TKey, infer TValue>
				? WeakMap<RequiredDeep<TKey>, RequiredDeep<TValue>>
				: E extends Set<infer TValue>
					? Set<RequiredDeep<TValue>>
					: E extends ReadonlySet<infer TValue>
						? ReadonlySet<RequiredDeep<TValue>>
						: E extends WeakSet<infer TValue>
							? WeakSet<RequiredDeep<TValue>>
							: E extends Promise<infer TValue>
								? Promise<RequiredDeep<TValue>>
								: E extends AnyFunction
									? object extends RequiredObjectDeep<E>
										? E
										: HasMultipleCallSignatures<E> extends true
											? E
											: ((...params: Parameters<E>) => ReturnType<E>) & RequiredObjectDeep<E>
									: E extends object
										? E extends Array<infer TValue>
											? TValue[] extends E
												? Array<RequiredDeep<TValue>>
												: RequiredObjectDeep<E>
											: RequiredObjectDeep<E>
										: unknown

type RequiredObjectDeep<T extends object> = {
	[K in keyof T]-?: RequiredDeep<T[K]>
}

/** Autocomplete-friendly union of `T` with fallback to `U`. */
export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

/** Extract all optional keys from the given type. */
export type OptionalKeysOf<T extends object> = T extends unknown
	? keyof {
			[K in keyof T as T extends Record<K, T[K]> ? never : K]: never
		} &
			keyof T
	: never

/** A value that may be null or undefined. */
export type Nullable<T> = T | null | undefined

/** A plain (record) object. */
export type PlainObject<T = unknown> = Record<PropertyKey, T>

/** Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive). */
export type Primitive = Nullable<string | number | bigint | boolean | symbol>

/** Make the specified keys `K` in type `T` required. */
export type RequiredByKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/** Extract all required keys from the given type. */
export type RequiredKeysOf<T extends object> = T extends unknown
	? Exclude<keyof T, OptionalKeysOf<T>>
	: never

/** A timeout ID. */
export type TimeoutId = ReturnType<typeof setTimeout>

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

/** Match any value in a union or record. */
export type Union<T extends readonly V[] | Record<string, V>, V = unknown> = T extends readonly V[]
	? T[number]
	: T[keyof T]

/* ----------------------------------------
 *   Unknown (readonly) types
 * ------------------------------------- */

/** Represents an array with `unknown` value. */
export type UnknownArray = readonly unknown[]
/** Represents a map with `unknown` key and value. */
export type UnknownMap = ReadonlyMap<unknown, unknown>
/** Represents an object with `unknown` value. You probably want this instead of `{}`. */
export type UnknownRecord = Record<PropertyKey, unknown>
/** Represents a set with `unknown` value. */
export type UnknownSet = ReadonlySet<unknown>
