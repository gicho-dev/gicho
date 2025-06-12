import type { SearchParams } from './types'

/**
 * Copy all entries from one URLSearchParams to another
 *
 * @param source - The source URLSearchParams object to copy from
 * @param target - The target URLSearchParams object to copy into
 * @param clearTarget - Whether to clear all entries in the target before copying. Defaults to `true`.
 */
export function copyURLSearchParams(
	source: URLSearchParams,
	target: URLSearchParams,
	clearTarget = true,
): URLSearchParams {
	if (clearTarget) {
		for (const key of target.keys()) target.delete(key)
	}

	for (const [key, value] of source.entries()) {
		target.append(key, value)
	}

	return target
}

/**
 * Return a URLSearchParams object from a search params array, object, or string
 *
 * @param searchParams - The search params array, object, or string to convert
 */
export function toURLSearchParams(searchParams: SearchParams): URLSearchParams {
	if (searchParams instanceof URLSearchParams) return searchParams
	if (typeof searchParams === 'string') return new URLSearchParams(searchParams)

	const params = new URLSearchParams()
	const searchParamsArr = Array.isArray(searchParams) ? searchParams : Object.entries(searchParams)

	for (const [key, value] of searchParamsArr) {
		if (value == null) continue

		if (Array.isArray(value)) {
			for (const value2 of value) {
				if (value2 == null) continue

				params.append(key, String(value2))
			}
		} else {
			params.append(key, String(value))
		}
	}

	return params
}
