import type {
	And,
	AnyRecord,
	If,
	IsAllOf,
	IsKeyOptional,
	IsLooseTuple,
	IsNever,
	PartialDeep,
	Simplify,
	Union,
	UnknownArray,
	UnknownMap,
	UnknownRecord,
	UnknownSet,
} from '../types'

/* --------------------------------------------------
 *   Types
 * ----------------------------------------------- */

type IntersectionKeysOf<T1, T2, TIsRequired extends boolean> = {
	[K in keyof T1 & keyof T2]: If<
		And<IsKeyOptional<K, T1>, IsKeyOptional<K, T2>>,
		If<TIsRequired, never, K>,
		If<TIsRequired, K, never>
	>
}[keyof T1 & keyof T2]

type UnionOf<
	TExtract extends 'array' | 'map.key' | 'map.value' | 'set',
	Ts extends UnknownArray,
	TAcc = never,
> = Ts extends readonly [infer THead, ...infer TRest]
	? TExtract extends 'array'
		? THead extends UnknownArray
			? UnionOf<TExtract, TRest, [...(TAcc extends UnknownArray ? TAcc : []), ...THead]>
			: UnionOf<TExtract, TRest, TAcc>
		: TExtract extends 'map.key'
			? THead extends ReadonlyMap<infer K, unknown>
				? UnionOf<TExtract, TRest, TAcc | K>
				: UnionOf<TExtract, TRest, TAcc>
			: TExtract extends 'map.value'
				? THead extends ReadonlyMap<unknown, infer V>
					? UnionOf<TExtract, TRest, TAcc | V>
					: UnionOf<TExtract, TRest, TAcc>
				: TExtract extends 'set'
					? THead extends ReadonlySet<infer V>
						? UnionOf<TExtract, TRest, TAcc | V>
						: UnionOf<TExtract, TRest, TAcc>
					: TAcc
	: TAcc

type MergeRecords<Ts extends UnknownArray, TAcc = unknown> = Ts extends readonly [
	infer THead,
	...infer TRest,
]
	? THead extends AnyRecord
		? MergeRecords<TRest, MergeTwoRecords<TAcc, THead>>
		: never
	: TAcc

type MergeTwoRecords<T1, T2> = Simplify<
	Omit<T1, keyof T2> &
		Omit<T2, keyof T1> & {
			[K in IntersectionKeysOf<T1, T2, false>]?: MergeDeep<[T1[K], T2[K]]>
		} & {
			[K in IntersectionKeysOf<T1, T2, true>]: MergeDeep<
				[Exclude<T1[K], undefined>, Exclude<T2[K], undefined>]
			>
		}
>

type MergeArrays<Ts extends UnknownArray> = UnionOf<'array', Ts, []>
type MergeMaps<Ts extends UnknownArray> = Map<UnionOf<'map.key', Ts>, UnionOf<'map.value', Ts>>
type MergeSets<Ts extends UnknownArray> = Set<UnionOf<'set', Ts>>

type MergeOthers<Ts extends UnknownArray, TAcc = never> = Ts extends readonly [
	infer THead,
	...infer TRest,
]
	? TRest extends readonly []
		? If<IsNever<THead>, TAcc, THead>
		: MergeOthers<TRest, THead>
	: TAcc

/** The result of using default merge (deep) strategy */
export type MergeDeep<Ts> = Ts extends UnknownArray
	? IsLooseTuple<Ts> extends true
		? Ts extends readonly []
			? unknown
			: Ts extends readonly [infer T1]
				? T1
				: IsAllOf<Ts, UnknownArray> extends true
					? MergeArrays<Ts>
					: IsAllOf<Ts, UnknownMap> extends true
						? MergeMaps<Ts>
						: IsAllOf<Ts, UnknownSet> extends true
							? MergeSets<Ts>
							: IsAllOf<Ts, AnyRecord> extends true
								? MergeRecords<Ts>
								: MergeOthers<Ts>
		: unknown
	: never

export type MergeFn = <Ts extends UnknownArray>(...values: Ts) => MergeDeep<Ts>

/* ----------------------------------------
 *   Internal utils
 * ------------------------------------- */

export const actions = {
	continue: Symbol('merge.actions.continue'),
} as const
type MergeActions = typeof actions

const ObjectType = {
	Not: 'x',
	Other: '?',
	Object: 'o',
	Array: 'a',
	Map: 'm',
	Set: 's',
} as const
type ObjectType = Union<typeof ObjectType>

function getIterableOf<T>(iterables: readonly Readonly<Iterable<T>>[]): Iterable<T> {
	return (function* () {
		for (const iterable of iterables) {
			for (const value of iterable) yield value
		}
	})()
}

function getKeysAndSymbols(obj: UnknownRecord): PropertyKey[] {
	return [
		...Object.keys(obj),
		...Object.getOwnPropertySymbols(obj).filter((key) =>
			Object.prototype.propertyIsEnumerable.call(obj, key),
		),
	]
}

function getKeysOfAllObjects(objects: ReadonlyArray<UnknownRecord>): Set<PropertyKey> {
	const keys = new Set<PropertyKey>()
	for (const obj of objects) {
		for (const key of [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)]) {
			keys.add(key)
		}
	}
	return keys
}

function getObjectType(x: unknown): ObjectType {
	if (typeof x !== 'object' || x === null) return 'x'

	const objTag = Object.prototype.toString.call(x)
	switch (objTag) {
		case '[object Array]':
			return 'a'
		case '[object Map]':
			return 'm'
		case '[object Set]':
			return 's'
	}

	return isPlainObjectOptimized(x, objTag) ? 'o' : '?'
}

function isPlainObjectOptimized(x: object, objTag: string): x is UnknownRecord {
	const p = Object.getPrototypeOf(x)
	if (p !== null && p !== Object.prototype && Object.getPrototypeOf(p) !== null) return false
	if (Symbol.iterator in x) return false
	if (Symbol.toStringTag in x) return objTag === '[object Module]'
	return true
}

/* ----------------------------------------
 *   Merge (Deep) Factory
 * ------------------------------------- */

type MergeUnknownsFn = <Ts extends UnknownArray>(
	values: Ts,
	context: MergeHandlerContext,
) => MergeDeep<Ts>

interface MergeHandlers {
	/** Merge arrays function */
	mergeArrays: MergeHandler<UnknownArray[]>
	/** Merge maps function */
	mergeMaps: MergeHandler<UnknownMap[]>
	/** Merge objects function */
	mergeObjects: MergeHandler<Readonly<UnknownRecord[]>>
	/** Merge one value function */
	mergeOne: <T>(value: T, context: MergeHandlerContext) => T
	/** Merge others (primitive, function, etc) function */
	mergeOthers: MergeHandler<UnknownArray>
	/** Merge sets function */
	mergeSets: MergeHandler<UnknownSet[]>
}

type MergeHandler<Ts extends UnknownArray> = (
	values: Ts,
	context: MergeHandlerContext,
) => Ts[number]

interface MergeHandlerMeta {
	namespace: string
	key?: PropertyKey
	parentValues?: UnknownArray
}

export interface MergeHandlerContext extends CreateMergeConfig, MergeHandlerMeta {
	actions: MergeActions
	defaultMergeHandlers: MergeHandlers
	getIterableOf: typeof getIterableOf
	getObjectType: typeof getObjectType
	merge: MergeUnknownsFn
	mergeHandlers: MergeHandlers
}

export interface CreateMergeConfig {
	/**
	 * Filter values function to be merged
	 *
	 * @example
	 * (values) => values.filter((v) => v !== undefined)
	 */
	filterValues?: <Ts extends UnknownArray>(values: Ts, context: MergeHandlerContext) => UnknownArray
	/**
	 * Customized merge functions
	 *
	 * @description
	 * If you want to customize the merge strategy for each type, override it.
	 */
	mergeHandlers: MergeHandlers
}

export type CreateMergeOptions = PartialDeep<CreateMergeConfig>

const defaultMergeHandlers: MergeHandlers = {
	mergeObjects: (values, context) => {
		const result: UnknownRecord = {}

		for (const key of getKeysOfAllObjects(values)) {
			const propValues = []
			for (const obj of values) {
				if (Object.prototype.propertyIsEnumerable.call(obj, key)) {
					propValues.push(obj[key])
				}
			}

			if (!propValues.length) continue

			const newValue = context.merge(propValues, {
				...context,
				key,
				namespace: `${context.namespace ? `${context.namespace}.` : ''}${String(key)}`,
				parentValues: values,
			})

			if (key === '__proto__') {
				// for json proto pollution
				Object.defineProperty(result, key, {
					value: newValue,
					configurable: true,
					enumerable: true,
					writable: true,
				})
			} else {
				result[key] = newValue
			}
		}

		return result
	},

	mergeArrays: (values) => values.flat(),

	mergeMaps: (values) => new Map(getIterableOf(values)),

	mergeSets: (values) => new Set(getIterableOf(values)),

	mergeOthers: (values) => values.at(-1),

	mergeOne: (value) => value,
}

/**
 * Create a custom deep merge function.
 */
export function createMerge(options: CreateMergeOptions = {}): MergeFn {
	const { filterValues, mergeHandlers = {} } = options

	const fns = {
		...defaultMergeHandlers,
		...mergeHandlers,
	}

	const context: MergeHandlerContext = {
		actions,
		defaultMergeHandlers,
		filterValues,
		getIterableOf,
		getObjectType,
		merge,
		mergeHandlers: fns,
		namespace: '',
	}

	/**
	 * Deeply merges multiple values into one.
	 *
	 * Accepts any number of values and recursively merges their properties,
	 * preserving nested structures. Later value override earlier ones.
	 */
	function merge<Ts extends UnknownArray>(values: Ts, context: MergeHandlerContext): MergeDeep<Ts> {
		let vals = context.filterValues?.(values, context) ?? values

		if (!vals.length) return undefined as MergeDeep<Ts>
		if (vals.length === 1) return fns.mergeOne(vals[0], context) as MergeDeep<Ts>

		const type = getObjectType(vals.at(-1))
		if (type !== 'x' && type !== '?') {
			for (let i = vals.length - 1; i--; ) {
				if (getObjectType(vals[i]) !== type) {
					vals = vals.slice(i + 1)
					break
				}
			}
		}

		switch (type) {
			case 'o': // Object
				return fns.mergeObjects(
					vals as unknown as Readonly<UnknownRecord[]>,
					context,
				) as MergeDeep<Ts>
			case 'a': // Array
				return fns.mergeArrays(vals as unknown as UnknownArray[], context) as MergeDeep<Ts>
			case 'm': // Map
				return fns.mergeMaps(vals as unknown as UnknownMap[], context) as MergeDeep<Ts>
			case 's': // Set
				return fns.mergeSets(vals as unknown as UnknownSet[], context) as MergeDeep<Ts>
			default: // primitive, function or other types
				return fns.mergeOthers(vals, context) as MergeDeep<Ts>
		}
	}

	return (...values) => merge(values, context)
}

export const merge = createMerge()

/* ----------------------------------------
 *   Merge (Deep) Plain Object Factory
 * ------------------------------------- */

type MergeObjectFn = <T1, T2>(
	a: T1,
	b: T2,
	context: MergeObjectHandlerContext,
) => MergeDeep<[T1, T2]>

type MergerFn = (
	result: UnknownRecord,
	key: PropertyKey,
	value: unknown,
	context: MergeObjectHandlerContext,
) => boolean | void

export interface MergeObjectHandlerContext extends CreateMergeObjectConfig {
	getObjectType: typeof getObjectType
	merge: MergeObjectFn
	namespace: string
}

export interface CreateMergeObjectConfig {
	/**
	 * Customized merger functions
	 */
	merger?: MergerFn
	/**
	 * Whether to include symbol keys in merge
	 * @default false
	 */
	symbolKeys?: boolean
}

export type CreateMergeObjectOptions = PartialDeep<CreateMergeObjectConfig>

/**
 * Create a custom deep merge function for plain objects.
 *
 * Use case:
 *  - merge config/options objects (Much better performance than `createMerge`)
 */
export function createMergeObject(options: CreateMergeObjectOptions = {}): MergeFn {
	const { merger, symbolKeys = false } = options

	const getKeys = symbolKeys ? getKeysAndSymbols : Object.keys

	const context: MergeObjectHandlerContext = {
		getObjectType,
		merge,
		merger,
		namespace: '',
	}

	function merge<T1, T2>(o1: T1, o2: T2, context: MergeObjectHandlerContext): MergeDeep<[T1, T2]> {
		const result = { ...o1 } as UnknownRecord

		for (const key of getKeys(o2 as UnknownRecord)) {
			if (key === '__proto__' || key === 'constructor') continue

			const val1 = result[key]
			const val2 = (o2 as UnknownRecord)[key]

			if (context.merger?.(result, key, val2, context)) continue

			const val1Type = getObjectType(val1)
			const val2Type = getObjectType(val2)

			// for fast condition process
			if (val1Type === 'x' || val2Type === 'x') {
				result[key] = val2
			} else if (val1Type === 'a' && val2Type === 'a') {
				result[key] = [...(val1 as unknown[]), ...(val2 as unknown[])]
			} else if (val1Type === 'o' && val2Type === 'o') {
				result[key] = merge(val1, val2, {
					...context,
					namespace: `${context.namespace ? `${context.namespace}.` : ''}${String(key)}`,
				})
			} else {
				result[key] = val2
			}
		}

		return result as MergeDeep<[T1, T2]>
	}

	return <Ts extends UnknownArray>(...values: Ts) =>
		values.reduce((obj, c) => {
			return getObjectType(c) === 'o' ? merge(obj, c, context) : c
		}, {}) as MergeDeep<Ts>
}

export const mergeObject = createMergeObject()
