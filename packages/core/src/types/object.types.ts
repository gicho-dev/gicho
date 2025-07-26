import type {
	AnyFunction,
	BuiltIns,
	HasMultipleCallSignatures,
	If,
	IsNever,
	NonRecursiveType,
	UnknownArray,
	UnknownMap,
	UnknownSet,
} from './base.types'

/* ----------------------------------------
 *   Index Signature
 * ------------------------------------- */

/**
 * Omit any index signatures from the given object type,
 * leaving only explicitly defined properties.
 */
export type OmitIndexSignature<TObject> = {
	[K in keyof TObject as {} extends Record<K, unknown> ? never : K]: TObject[K]
}

/**
 * Pick only index signatures from the given object type,
 * leaving out all explicitly defined properties.
 */
export type PickIndexSignature<TObject> = {
	[K in keyof TObject as {} extends Record<K, unknown> ? K : never]: TObject[K]
}

/* ----------------------------------------
 *   Merge
 * ------------------------------------- */

/**
 * Merge two types into a new type. Keys of the `B` type overrides keys of the `A` type.
 */
export type MergeTwo<A, B> = Prettify<
	{
		[K in keyof A as K extends keyof B ? never : K]: A[K]
	} & B
>

/**
 * Merge multiple types into a new type.
 */
export type Merge<Ts extends UnknownArray, TAcc = unknown> = Ts extends [
	infer TFirst,
	...infer TRest,
]
	? Merge<TRest, MergeTwo<TAcc, TFirst>>
	: TAcc

/* ----------------------------------------
 *   Plain Object
 * ------------------------------------- */

/** Extracts only plain objects from the given array. */
export type FilterPlainObjects<Ts extends UnknownArray> = Ts extends readonly [
	infer TFirst,
	...infer TRest,
]
	? IsPlainObject<TFirst> extends true
		? [TFirst, ...FilterPlainObjects<TRest>]
		: FilterPlainObjects<TRest>
	: []

/** Returns a boolean for whether the given type is a plain key-value object. */
export type IsPlainObject<T> = T extends NonRecursiveType | UnknownArray | UnknownMap | UnknownSet
	? false
	: T extends object
		? true
		: false

/** Returns a boolean for whether all items in the given array are plain objects. */
export type IsAllPlainObject<Ts extends UnknownArray> = Ts extends readonly [
	infer TFirst,
	...infer TRest,
]
	? If<IsNever<TFirst>, false, If<IsPlainObject<TFirst>, IsAllPlainObject<TRest>, false>>
	: true

/* ----------------------------------------
 *   Prettify
 * ------------------------------------- */

export type ConditionalPrettifyDeep<T, TExclude = never, TInclude = unknown> = T extends TExclude
	? T
	: T extends TInclude
		? { [K in keyof T]: ConditionalPrettifyDeep<T[K], TExclude, TInclude> }
		: T

/**
 * Useful to flatten the type output to improve type hints shown in editors.
 * And also to transform an interface into a type to aide with assignability.
 *
 * @example
 * ```
 * interface Position {
 *   x: number
 *   y: number
 * }
 *
 * interface Size {
 *   width: number
 *   height: number
 * }
 *
 * // In your editor, hovering over `Props` will show a flattened object with all the properties.
 * type Props = Prettify<Position & Size>
 * ```
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/* ----------------------------------------
 *   Optional / Required Keys
 * ------------------------------------- */

/** Returns a boolean for whether a key is optional in the given object. */
export type IsKeyOptional<K extends PropertyKey, T extends Partial<Record<K, unknown>>> =
	T extends Record<K, unknown> ? false : true

/** Extract all optional keys from the given type. */
export type OptionalKeysOf<T extends object> = T extends unknown
	? keyof {
			[K in keyof T as T extends Record<K, T[K]> ? never : K]: never
		} &
			keyof T
	: never

/** Make the specified keys `K` in type `T` optional. */
export type PartialByKeys<T, K extends keyof T> = Prettify<Omit<T, K> & Partial<Pick<T, K>>>

/** Make the specified keys `K` in type `T` required. */
export type RequiredByKeys<T, K extends keyof T> = Prettify<Omit<T, K> & Required<Pick<T, K>>>

/** Extract all required keys from the given type. */
export type RequiredKeysOf<T extends object> = T extends unknown
	? Exclude<keyof T, OptionalKeysOf<T>>
	: never

/* ----------------------------------------
 *   PartialDeep / RequiredDeep
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
											: ((...args: Parameters<E>) => ReturnType<E>) & RequiredObjectDeep<E>
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
