/**
 * Returns a new object with the specified keys from the object.
 *
 * @example
 *    const obj1 = { x: 1, y: 2, z: 3 }
 *    const obj2 = pick(obj1, ['x', 'z'])
 *    // obj2 -- { x: 1, z: 3 }
 */
export function pick<T extends Record<number | string, any>, K extends keyof T>(
	obj: T,
	keys: K[],
): { [P in K]: T[P] } {
	const result: Record<number | string, any> = {}
	const len = keys.length
	for (let i = 0; i < len; i++) {
		const key = keys[i]
		if (key in obj) {
			result[key as number | string] = obj[key]
		}
	}
	return result as Pick<T, K>
}
