export type ConditionalSimplifyDeep<T, TExclude = never, TInclude = unknown> = T extends TExclude
	? T
	: T extends TInclude
		? { [K in keyof T]: ConditionalSimplifyDeep<T[K], TExclude, TInclude> }
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
 * type Props = Simplify<Position & Size>
 * ```
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {}
