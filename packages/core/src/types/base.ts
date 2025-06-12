/**
 * A value that can be either a single item of type T or an array of T.
 */
export type Arrayable<T> = T | T[]

/**
 * A value that may be a Promise or a plain value.
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Autocomplete-friendly union of `T` with fallback to `U`.
 */
export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

/**
 * A value that may be null or undefined.
 */
export type Nullable<T> = T | null | undefined

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
 * Match any value in a union or record.
 */
export type Union<T extends readonly V[] | Record<string, V>, V = unknown> = T extends readonly V[]
	? T[number]
	: T[keyof T]
