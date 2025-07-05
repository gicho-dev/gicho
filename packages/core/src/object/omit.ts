import type { LiteralUnion } from '../types'

/**
 * Returns a new object with the specified keys omitted.
 *
 * @example
 *    const obj1 = { x: 1, y: 2, z: 3 }
 *    const obj2 = omit(obj1, ['x', 'y'])
 *    // obj2 -- { z: 3 }
 */
export function omit<
	T extends Record<number | string, any>,
	K extends LiteralUnion<keyof T, string | number | symbol>,
>(obj: T, keys: K[]): Omit<T, K> {
	const result: Record<number | string, any> = {}
	for (const k in obj) {
		if (!obj.hasOwnProperty || Object.hasOwn(obj, k)) {
			if (keys.indexOf(k as any as K) === -1) {
				result[k] = obj[k]
			}
		}
	}
	return result as Omit<T, K>
}
