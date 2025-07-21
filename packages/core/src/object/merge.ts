import type {
	And,
	AnyRecord,
	FilterPlainObjects,
	If,
	IsAllOf,
	IsAllPlainObject,
	IsKeyOptional,
	IsNever,
	Nullable,
	PartialDeep,
	Prettify,
	UnknownArray,
	UnknownMap,
	UnknownRecord,
	UnknownSet,
	ValuesToUnion,
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
> = Ts extends readonly [infer TFirst, ...infer TRest]
	? TExtract extends 'array'
		? TFirst extends UnknownArray
			? UnionOf<TExtract, TRest, [...(TAcc extends UnknownArray ? TAcc : []), ...TFirst]>
			: UnionOf<TExtract, TRest, TAcc>
		: TExtract extends 'map.key'
			? TFirst extends ReadonlyMap<infer K, unknown>
				? UnionOf<TExtract, TRest, TAcc | K>
				: UnionOf<TExtract, TRest, TAcc>
			: TExtract extends 'map.value'
				? TFirst extends ReadonlyMap<unknown, infer V>
					? UnionOf<TExtract, TRest, TAcc | V>
					: UnionOf<TExtract, TRest, TAcc>
				: TExtract extends 'set'
					? TFirst extends ReadonlySet<infer V>
						? UnionOf<TExtract, TRest, TAcc | V>
						: UnionOf<TExtract, TRest, TAcc>
					: TAcc
	: TAcc

type MergeArrays<Ts extends UnknownArray> = UnionOf<'array', Ts, []>
type MergeMaps<Ts extends UnknownArray> = Map<UnionOf<'map.key', Ts>, UnionOf<'map.value', Ts>>
type MergeSets<Ts extends UnknownArray> = Set<UnionOf<'set', Ts>>

type MergeRecords<
	TMergeType extends 'all' | 'obj',
	Ts extends UnknownArray,
	TAcc = unknown,
> = Ts extends readonly [infer TFirst, ...infer TRest]
	? TFirst extends AnyRecord
		? MergeRecords<TMergeType, TRest, MergeTwoRecords<TMergeType, TAcc, TFirst>>
		: never
	: TAcc

type MergeTwoRecords<TMergeType extends 'all' | 'obj', T1, T2> = Omit<T1, keyof T2> &
	Omit<T2, keyof T1> & {
		[K in IntersectionKeysOf<T1, T2, false>]?: TMergeType extends 'all'
			? MergeDeep<[Exclude<T1[K], undefined>, Exclude<T2[K], undefined>]>
			: MergeObj<[Exclude<T1[K], undefined>, Exclude<T2[K], undefined>]>
	} & {
		[K in IntersectionKeysOf<T1, T2, true>]: TMergeType extends 'all'
			? MergeDeep<[Exclude<T1[K], undefined>, Exclude<T2[K], undefined>]>
			: MergeObj<[Exclude<T1[K], undefined>, Exclude<T2[K], undefined>]>
	}

type MergeOthers<
	TMergeType extends 'last' | 'union',
	Ts extends UnknownArray,
	TAcc = never,
> = TMergeType extends 'last'
	? Ts extends readonly [...unknown[], infer TLast]
		? TLast
		: never
	: TMergeType extends 'union'
		? Ts extends readonly [infer TFirst, ...infer TRest]
			? TRest extends readonly []
				? If<IsNever<TFirst>, TAcc, TAcc | TFirst>
				: MergeOthers<TMergeType, TRest, TAcc | TFirst>
			: TAcc
		: never

/**
 * Deeply merges all input values by their type. Returns TDefault if empty.
 */
export type MergeDeep<Ts, TDefault = unknown> = Ts extends UnknownArray
	? Ts extends readonly []
		? TDefault
		: Ts extends readonly [infer TOnly]
			? TOnly
			: IsAllOf<Ts, UnknownArray> extends true
				? MergeArrays<Ts>
				: IsAllPlainObject<Ts> extends true
					? Prettify<MergeRecords<'all', Ts>>
					: IsAllOf<Ts, UnknownMap> extends true
						? MergeMaps<Ts>
						: IsAllOf<Ts, UnknownSet> extends true
							? MergeSets<Ts>
							: MergeOthers<'last', Ts>
	: never

/**
 * Deeply merges only plain objects from the given inputs (TFirst, ...Ts).
 * Non-object values are ignored. Returns empty object if no objects remain.
 */
export type MergeObjectsDeep<Ts> = Ts extends UnknownArray
	? MergeObj<FilterPlainObjects<Ts>, {}>
	: never

type MergeObj<Ts, TDefault = unknown> = Ts extends UnknownArray
	? Ts extends readonly []
		? TDefault
		: Ts extends readonly [infer TOnly]
			? TOnly
			: IsAllOf<Ts, UnknownArray> extends true
				? MergeArrays<Ts>
				: IsAllPlainObject<Ts> extends true
					? Prettify<MergeRecords<'obj', Ts>>
					: MergeOthers<'last', Ts>
	: never

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
type ObjectType = ValuesToUnion<typeof ObjectType>

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

export interface CreateMergeReturn {
	/**
	 * Deeply merges multiple values into a single object.
	 */
	merge: <Ts extends UnknownArray>(...values: Ts) => MergeDeep<Ts>

	/**
	 * Deeply merges multiple values into the target object.
	 */
	mergeInto: <T extends NonNullable<unknown>, Ts extends UnknownArray>(
		target: T,
		...sources: Ts
	) => MergeDeep<[T, ...Ts]>
}

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
export function createMerge(options: CreateMergeOptions = {}): CreateMergeReturn {
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

	return {
		merge: (...values) => merge(values, context),

		mergeInto: <T extends NonNullable<unknown>, Ts extends UnknownArray>(
			target: T,
			...sources: Ts
		): MergeDeep<[T, ...Ts]> => {
			const result = merge([target, ...sources], context)

			// copy result to target
			Object.assign(target, result)

			return target as MergeDeep<[T, ...Ts]>
		},
	}
}

export const { merge, mergeInto } = createMerge()

/* ----------------------------------------
 *   Merge (Deep) Plain Object Factory
 * ------------------------------------- */

type MergeObjectFn = <T1, T2>(
	a: T1,
	b: T2,
	context: MergeObjectHandlerContext,
) => MergeObjectsDeep<[T1, T2]>

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

export interface CreateMergeObjectsReturn {
	/**
	 * Deeply merges multiple values into a single object.
	 */
	mergeObjects: <T extends Nullable<AnyRecord>, Ts extends readonly Nullable<AnyRecord>[]>(
		value1: T,
		...values: Ts
	) => MergeObjectsDeep<[T, ...Ts]>

	/**
	 * Deeply merges multiple values into the target object.
	 */
	mergeObjectsInto: <T extends AnyRecord, Ts extends readonly Nullable<AnyRecord>[]>(
		target: T,
		...sources: Ts
	) => MergeObjectsDeep<[T, ...Ts]>
}

/**
 * Create a custom deep merge function for plain objects.
 *
 * Use case:
 *  - merge config/options objects (Much better performance than `createMerge`)
 */
export function createMergeObjects(
	options: CreateMergeObjectOptions = {},
): CreateMergeObjectsReturn {
	const { merger, symbolKeys = false } = options

	const getKeys = symbolKeys ? getKeysAndSymbols : Object.keys

	const context: MergeObjectHandlerContext = {
		getObjectType,
		merge: _merge,
		merger,
		namespace: '',
	}

	function _merge<T1, T2>(
		o1: T1,
		o2: T2,
		context: MergeObjectHandlerContext,
	): MergeObjectsDeep<[T1, T2]> {
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
				result[key] = _merge(val1, val2, {
					...context,
					namespace: `${context.namespace ? `${context.namespace}.` : ''}${String(key)}`,
				})
			} else {
				result[key] = val2
			}
		}

		return result as MergeObjectsDeep<[T1, T2]>
	}

	return {
		mergeObjects: <T1, Ts extends UnknownArray>(value1: T1, ...values: Ts) => {
			let result = value1 ?? {}
			for (const value of values) {
				if (getObjectType(value) === 'o') result = _merge(result, value, context)
			}
			return result as MergeObjectsDeep<[T1, ...Ts]>
		},

		mergeObjectsInto: <T, Ts extends UnknownArray>(target: T, ...sources: Ts) => {
			let result = target as unknown
			for (const value of sources) {
				if (getObjectType(value) === 'o') result = _merge(result, value, context)
			}

			// copy result to target
			Object.assign(target as UnknownRecord, result)

			return target as MergeObjectsDeep<[T, ...Ts]>
		},
	}
}

export const { mergeObjects, mergeObjectsInto } = createMergeObjects()

export const predefinedMergers = {
	noConcatArrays: (result, key, val2, ctx) => {
		const val1 = result[key]

		const val1Type = ctx.getObjectType(val1)
		if (val1Type === 'o') {
			const val2Type = ctx.getObjectType(val2)
			if (val2Type === 'o') {
				result[key] = ctx.merge(val1, val2, {
					...ctx,
					namespace: `${ctx.namespace ? `${ctx.namespace}.` : ''}${String(key)}`,
				})
				return true
			}
		}

		result[key] = val2
		return true
	},
} satisfies Record<string, MergerFn>

/**
 * Deeply merges objects.
 * Arrays are not concatenated; last-wins strategy is applied.
 */
export const { mergeObjects: mergeConfigs, mergeObjectsInto: mergeConfigsInto } =
	createMergeObjects({ merger: predefinedMergers.noConcatArrays })
