import type { HasMultipleCallSignatures } from './is.types'

/**
 * A function that can take any number of parameters and return any value.
 */
export type AnyFunction = (...params: any[]) => any

/**
 * A value that can be either a single item of type T or an array of T.
 */
export type Arrayable<T> = T | T[]

/**
 * A value that may be a Promise or a plain value.
 */
export type Awaitable<T> = T | PromiseLike<T>

/**
 * Matches any primitive, Date, or RegExp.
 */
export type BuiltIns = Primitive | Date | RegExp

/**
 * Matches non-recursive types.
 */
export type NonRecursiveType = BuiltIns | AnyFunction | (new (...params: any[]) => unknown)

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

/**
 * Autocomplete-friendly union of `T` with fallback to `U`.
 */
export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

/**
 * A value that may be null or undefined.
 */
export type Nullable<T> = T | null | undefined

/**
 * A plain (record) object.
 */
export type PlainObject<T = unknown> = Record<PropertyKey, T>

/**
 * Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
 */
export type Primitive = Nullable<string | number | bigint | boolean | symbol>

/**
 * Make the specified keys `K` in type `T` required.
 */
export type RequiredByKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * A timeout ID.
 */
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

/**
 * Match any value in a union or record.
 */
export type Union<T extends readonly V[] | Record<string, V>, V = unknown> = T extends readonly V[]
	? T[number]
	: T[keyof T]

/**
 * Match any unknown record.
 */
export type UnknownRecord = Record<PropertyKey, unknown>
