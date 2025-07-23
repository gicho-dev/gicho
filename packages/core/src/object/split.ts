import type { AnyRecord } from '../types'

/**
 * Splits an object into two new objects:
 * - The first contains only the specified keys.
 * - The second contains the remaining properties.
 */
export function split<T extends AnyRecord, K extends keyof T>(
	obj: T,
	keys: K[],
): [Pick<T, K>, Omit<T, K>] {
	const picked = {} as AnyRecord
	const omitted = {} as AnyRecord
	const keySet = new Set<unknown>(keys)

	for (const k in obj) {
		if (keySet.has(k)) picked[k] = obj[k]
		else omitted[k] = obj[k]
	}
	return [picked, omitted] as [Pick<T, K>, Omit<T, K>]
}
