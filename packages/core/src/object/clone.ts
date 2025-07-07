import type { TypedArray } from '../types'

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

interface Constructor<T = unknown> {
	new (...args: any[]): T
}

interface CreateCloneOptions {
	/**
	 * Whether to support circular references
	 * @default false
	 */
	circles?: boolean
	cloneFunctions?: Partial<CloneFunctions>
	customConstructors?: ConstructorHandlerItem[]
}
type CreateCloneConfig = Required<CreateCloneOptions>

type CloneFn = <T>(x: T) => T
type InternalCloneFn = <T>(x: T, refs: Map<unknown, unknown>) => T

interface CloneHandlerContext extends CreateCloneConfig {
	clone: InternalCloneFn
	cloneFunctions: CloneFunctions
	defaultCloneFunctions: CloneFunctions
}

type CloneHandler<T = any> = (x: T, ctx: CloneHandlerContext, refs: Map<unknown, unknown>) => T
type ConstructorHandlerItem<T = unknown> = [Constructor<T>, CloneHandler<T>]

type AnyArrayObject = any[] & Record<PropertyKey, any>

/* ----------------------------------------
 *   Clone (Deep) Factory
 * ------------------------------------- */

interface CloneFunctions {
	cloneArray: CloneHandler<AnyArrayObject>
	cloneArrayBuffer: CloneHandler<ArrayBuffer>
	cloneArrayBufferView: CloneHandler<ArrayBufferView>
	cloneDate: CloneHandler<Date>
	cloneMap: CloneHandler<Map<unknown, unknown>>
	cloneObject: CloneHandler<Record<PropertyKey, unknown>>
	cloneRegExp: CloneHandler<RegExp>
	cloneSet: CloneHandler<Set<unknown>>
	cloneUnknown: CloneHandler<unknown>
}

const defaultCloneFunctions: CloneFunctions = {
	cloneObject: (x, { circles, clone }, refs) => {
		const Ctor = x.constructor

		if (Ctor !== Object && typeof Ctor === 'function') {
			const x2 = new (Ctor as Constructor<Record<PropertyKey, unknown>>)()
			if (circles) refs.set(x, x2)

			for (const k of Object.keys(x)) {
				if (x2[k] !== x[k]) x2[k] = clone(x[k], refs)
			}

			return x2
		}

		const x2 = {} as typeof x
		if (circles) refs.set(x, x2)

		for (const k in x) {
			if (k === '__proto__') {
				// for json proto pollution
				Object.defineProperty(x2, k, {
					value: clone(x[k], refs),
					configurable: true,
					enumerable: true,
					writable: true,
				})
			} else {
				x2[k] = clone(x[k], refs)
			}
		}

		return x2
	},

	cloneArray: (x, { circles, clone }, refs) => {
		const keys = Object.keys(x)
		const x2 = new Array(keys.length) as AnyArrayObject
		if (circles) refs.set(x, x2)

		for (const key of keys) x2[key] = clone((x as AnyArrayObject)[key], refs)
		return x2
	},

	cloneMap: (x, { circles, clone }, refs) => {
		const x2 = new Map()
		if (circles) refs.set(x, x2)

		x.forEach((val, key) => {
			x2.set(clone(key, refs), clone(val, refs))
		})
		return x2
	},

	cloneSet: (x, { circles, clone }, refs) => {
		const x2 = new Set()
		if (circles) refs.set(x, x2)

		x.forEach((val) => {
			x2.add(clone(val, refs))
		})
		return x2
	},

	cloneDate: (x) => new Date(x),

	cloneRegExp: (x) => {
		const x2 = new RegExp(x.source, x.flags)
		x2.lastIndex = x.lastIndex
		return x2
	},

	cloneArrayBuffer: (x) => x.slice(0),

	// DataView | TypedArray | Buffer
	cloneArrayBufferView: (x) => {
		return (
			typeof Buffer !== 'undefined' && x instanceof Buffer
				? Buffer.from(x)
				: new (x.constructor as Constructor)(
						x.buffer.slice(),
						x.byteOffset,
						(x as TypedArray).length,
					)
		) as ArrayBufferView
	},

	cloneUnknown: (x) => x,
}

/**
 * Create a custom deep clone function.
 */
export function createClone(options: CreateCloneOptions = {}): CloneFn {
	const { cloneFunctions = {}, circles = false, customConstructors = [] } = options

	const customHandlers = new Map<Constructor, CloneHandler>()
	for (const [ctor, handler] of customConstructors) customHandlers.set(ctor, handler)

	const fns = {
		...defaultCloneFunctions,
		...cloneFunctions,
	}

	const context: CloneHandlerContext = {
		circles,
		clone,
		cloneFunctions: fns,
		customConstructors,
		defaultCloneFunctions,
	}

	function clone<T>(x: T, refs: Map<unknown, unknown>): T {
		if (typeof x !== 'object' || x === null) return x

		if (circles) {
			const cached = refs.get(x)
			if (cached) return cached as T
		}

		const Ctor = (x as any).constructor
		if (Ctor !== Object) {
			const handler = customHandlers.get(Ctor)
			if (handler) return handler(x, context, refs)
		}

		switch (Object.prototype.toString.call(x)) {
			case '[object Array]':
				return fns.cloneArray(x as unknown[], context, refs) as T
			case '[object Object]':
			case '[object Module]':
				return fns.cloneObject(x as Record<PropertyKey, unknown>, context, refs) as T
			case '[object Map]':
				return fns.cloneMap(x as unknown as Map<unknown, unknown>, context, refs) as T
			case '[object Set]':
				return fns.cloneSet(x as unknown as Set<unknown>, context, refs) as T
			case '[object Date]':
				return fns.cloneDate(x as unknown as Date, context, refs) as T
			case '[object RegExp]':
				return fns.cloneRegExp(x as unknown as RegExp, context, refs) as T
			case '[object ArrayBuffer]':
				return fns.cloneArrayBuffer(x as unknown as ArrayBuffer, context, refs) as T
		}

		// DateView | TypedArray | Buffer
		if (ArrayBuffer.isView(x)) return fns.cloneArrayBufferView(x, context, refs) as T

		return fns.cloneUnknown(x, context, refs) as T
	}

	return <T>(x: T): T => clone(x, new Map<unknown, unknown>())
}
