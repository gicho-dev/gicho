import type { BuiltIns, Simplify, UnknownRecord } from '../types'

import { isBuiltInsOrFunction, isPrimitiveOrFunction } from '../is'

/* --------------------------------------------------
 *   Types
 * ----------------------------------------------- */

type ArrayFirst<T> = T extends [infer F, ...infer _ignoredR] ? F : never
type ArrayRest<T> = T extends [infer _ignoredF, ...infer R] ? R : never
type IntersectionKeys<T1, T2> = Extract<keyof T1, keyof T2>

type MergeArrays<T, U> = T extends readonly unknown[]
	? U extends readonly unknown[]
		? [...T, ...U]
		: never
	: never

type MergeRecords<T1, T2> = Simplify<
	Omit<T1, keyof T2> &
		Omit<T2, keyof T1> & {
			[K in IntersectionKeys<T1, T2>]: MergeDeepTwo<T1[K], T2[K]>
		}
>

type MergeDeep<R, T> =
	ArrayFirst<T> extends never ? R : MergeDeep<MergeDeepTwo<R, ArrayFirst<T>>, ArrayRest<T>>

type MergeDeepTwo<T1, T2> = T2 extends BuiltIns
	? T2
	: [T1, T2] extends [readonly unknown[], readonly unknown[]]
		? MergeArrays<T1, T2>
		: [T1, T2] extends [Record<string, unknown>, Record<string, unknown>]
			? MergeRecords<T1, T2>
			: T2

type MergeDeepFn = <Ts extends unknown[]>(...sources: Ts) => MergeDeep<object, Ts>

/* ----------------------------------------
 *   Internal utils
 * ------------------------------------- */

const JSON_PROTO = Object.getPrototypeOf({})
const propertyIsEnumerable = Object.prototype.propertyIsEnumerable

function getKeys(value: UnknownRecord): PropertyKey[] {
	const result = Object.keys(value) as PropertyKey[]
	const keys = Object.getOwnPropertySymbols(value)
	for (const key of keys) propertyIsEnumerable.call(value, key) && result.push(key)

	return result
}

function isNotPrototypeKey(x: unknown): boolean {
	return x !== 'constructor' && x !== 'prototype' && x !== '__proto__'
}

/* ----------------------------------------
 *   Create Merge Function Factory
 * ------------------------------------- */

export interface MergeArraysFnContext {
	target: unknown[]
	source: unknown[]
	config: MergeConfig
}

export interface MergeConfig {
	/**
	 * Whether to allow overrides for properties explicitly set to `undefined`
	 * @default true
	 */
	allowUndefinedOverrides: boolean
	/**
	 * A function that clone the prototype object
	 */
	cloneProtoObject?: (x: unknown) => unknown
	/**
	 * A function that checks whether a value is a un-mergeable
	 */
	isUnmergeable: (x: unknown) => boolean
	/**
	 * Whether to merge arrays (boolean) or a custom merge array function
	 * @default false
	 */
	mergeArrays: boolean | ((context: MergeArraysFnContext) => any[])
}

const defaultOptions: MergeConfig = {
	isUnmergeable: isBuiltInsOrFunction,
	allowUndefinedOverrides: true,
	mergeArrays: true,
}

export function createMerge(config: Partial<MergeConfig> = {}): MergeDeepFn {
	const cfg = {
		...defaultOptions,
		...config,
	}
	const { allowUndefinedOverrides, cloneProtoObject, isUnmergeable, mergeArrays } = cfg

	function clone(entry: unknown): unknown {
		return isUnmergeable(entry)
			? entry
			: Array.isArray(entry)
				? cloneArray(entry)
				: cloneObject(entry as UnknownRecord)
	}

	function cloneArray(x: unknown[]): unknown[] {
		const len = x.length
		const result = new Array(len)
		for (let i = 0; i < len; ++i) result[i] = clone(x[i])

		return result
	}

	function cloneObject(target: UnknownRecord): UnknownRecord {
		const result = {} as UnknownRecord

		if (cloneProtoObject && Object.getPrototypeOf(target) !== JSON_PROTO) {
			return cloneProtoObject(target) as UnknownRecord
		}

		const targetKeys = getKeys(target)
		let i, il, key
		for (i = 0, il = targetKeys.length; i < il; ++i) {
			isNotPrototypeKey((key = targetKeys[i])) && (result[key] = clone(target[key]))
		}
		return result
	}

	function concatArrays(target: unknown[], source: unknown[]): unknown[] {
		const tLen = target.length
		const sLen = source.length
		let i: number

		const result = new Array(tLen + sLen)
		for (i = 0; i < tLen; ++i) result[i] = clone(target[i])
		for (i = 0; i < sLen; ++i) result[i + tLen] = clone(source[i])

		return result
	}

	function mergeObject(target: UnknownRecord, source: UnknownRecord): UnknownRecord {
		const result = {} as UnknownRecord
		const targetKeys = getKeys(target)
		const sourceKeys = getKeys(source)

		for (const key of targetKeys) {
			if (isNotPrototypeKey(key) && !sourceKeys.includes(key)) {
				result[key] = clone(target[key])
			}
		}

		for (const key of sourceKeys) {
			if (!isNotPrototypeKey(key)) continue

			if (key in target) {
				if (targetKeys.includes(key)) {
					result[key] =
						cloneProtoObject &&
						!isUnmergeable(source[key]) &&
						Object.getPrototypeOf(source[key]) !== JSON_PROTO
							? cloneProtoObject(source[key])
							: mergeRecursively(target[key], source[key])
				}
			} else {
				result[key] = clone(source[key])
			}
		}

		return result
	}

	function mergeRecursively(target: unknown, source: unknown): unknown {
		if (isPrimitiveOrFunction(source)) {
			return source === undefined ? (allowUndefinedOverrides ? undefined : target) : source
		}
		if (isUnmergeable(target)) {
			return clone(source)
		}

		const isSourceArray = Array.isArray(source)
		const isTargetArray = Array.isArray(target)

		if (isSourceArray && isTargetArray) {
			return mergeArrays === false
				? source
				: typeof mergeArrays === 'function'
					? mergeArrays({ config: cfg, source, target })
					: concatArrays(target, source)
		}
		if (isSourceArray !== isTargetArray) {
			return clone(source)
		}

		return mergeObject(target as UnknownRecord, source as UnknownRecord)
	}

	/**
	 * Deeply merges multiple sources into one.
	 *
	 * Accepts any number of source objects and recursively merges their properties,
	 * preserving nested structures. Later sources override earlier ones.
	 */
	function merge<Ts extends unknown[]>(...sources: Ts): MergeDeep<object, Ts> {
		let result
		for (const source of sources) result = mergeRecursively(result, source)

		return result as MergeDeep<object, Ts>
	}

	return merge
}

export const merge = createMerge()
