/**
 * Returns the type of the object.
 *
 * @example
 *    getType({}) // 'Object'
 *    getType([]) // 'Array'
 *    getType(new Date()) // 'Date'
 */
export function getType(x: unknown): string {
	return Object.prototype.toString.call(x).slice(8, -1)
}
