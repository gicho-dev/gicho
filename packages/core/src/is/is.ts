import type { AnyFunction, BuiltIns, PlainObject, Primitive } from '../types'

/**
 * Returns whether the value is empty
 */
export function isEmpty(x: unknown): boolean {
	return (
		x == null ||
		x === '' ||
		(Array.isArray(x) && x.length === 0) ||
		(typeof x === 'object' && Object.keys(x).length === 0)
	)
}

/**
 * Returns whether the value is numeric or can be converted to a number
 */
export function isNumeric(n: unknown): boolean {
	return !isNaN(parseFloat(String(n))) && isFinite(n as any)
}

/**
 * Returns whether the value is a plain object type
 * (checks that it's not an object connected to a special class or prototype)
 */
export function isPlainObject(x: unknown): x is PlainObject {
	if (typeof x !== 'object' || x === null) return false

	const prototype = Object.getPrototypeOf(x)

	if (
		prototype !== null &&
		prototype !== Object.prototype &&
		Object.getPrototypeOf(prototype) !== null
	) {
		return false
	}

	if (Symbol.iterator in x) return false

	if (Symbol.toStringTag in x) {
		return Object.prototype.toString.call(x) === '[object Module]'
	}

	return true
}

/**
 * Returns whether the value is a primitive type
 */
export function isPrimitive(x: unknown): x is Primitive {
	return (
		typeof x === 'bigint' ||
		typeof x === 'boolean' ||
		typeof x === 'number' ||
		typeof x === 'string' ||
		typeof x === 'symbol' ||
		x == null
	)
}

/**
 * Returns whether the value is a primitive type or function
 */
export function isPrimitiveOrFunction(x: unknown): x is Primitive | AnyFunction {
	return typeof x !== 'object' || x === null
}

/**
 * Returns whether the value is a built-in type (primitive value or `Date` or `RegExp` object)
 * or a function
 */
export function isBuiltInsOrFunction(x: unknown): x is BuiltIns | AnyFunction {
	return isPrimitiveOrFunction(x) || x instanceof Date || x instanceof RegExp
}

export function isRecord(x: unknown): x is Record<PropertyKey, unknown> {
	return Object.prototype.toString.call(x) === '[object Object]'
}
