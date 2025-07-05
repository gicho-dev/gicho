import type { TypedArray } from '../types'

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

interface Constructor<T = unknown> {
	new (...args: any[]): T
}

interface CreateCloneConfig {
	constructors?: ConstructorHandlerItem[]
	/**
	 * Whether to support circular references
	 * @default false
	 */
	circles?: boolean
}

type CloneFn = <T>(x: T) => T
type InternalCloneFn = <T>(x: T, refs: Map<unknown, unknown>) => T
type CloneHandler<T = any> = (x: T, fn: InternalCloneFn, refs: Map<unknown, unknown>) => T
type ConstructorHandlerItem<T = unknown> = [Constructor<T>, CloneHandler<T>]

type AnyArrayObject = any[] & Record<PropertyKey, any>

/* ----------------------------------------
 *   Clone (Deep) Factory
 * ------------------------------------- */

export function createClone(config: CreateCloneConfig = {}): CloneFn {
	const { circles = false, constructors = [] } = config

	const handlers = new Map<Constructor, CloneHandler>()
	for (const [ctor, handler] of constructors) handlers.set(ctor, handler)

	function clone<T>(x: T, refs: Map<unknown, unknown>): T {
		if (typeof x !== 'object' || x === null) return x

		if (circles) {
			const cached = refs.get(x)
			if (cached) return cached as T
		}

		const ctor = (x as any).constructor
		if (ctor !== Object) {
			const handler = handlers.get(ctor)
			if (handler) {
				const x2 = handler(x, clone, refs)
				return x2 as T
			}
		}

		const objType = Object.prototype.toString.call(x)

		switch (objType) {
			case '[object Object]': {
				const x1 = x as Record<PropertyKey, unknown>
				let x2

				if (ctor !== Object && typeof ctor === 'function') {
					x2 = new (ctor as Constructor<typeof x1>)()
					if (circles) refs.set(x, x2)
					for (const k of Object.keys(x)) {
						if (x2[k] !== x1[k]) x2[k] = clone(x1[k], refs)
					}
				} else {
					x2 = {} as typeof x1
					if (circles) refs.set(x, x2)
					for (const k in x1) {
						if (k === '__proto__') {
							// for json proto pollution
							Object.defineProperty(x2, k, {
								value: clone(x1[k], refs),
								configurable: true,
								enumerable: true,
								writable: true,
							})
						} else {
							x2[k] = clone(x1[k], refs)
						}
					}
				}
				return x2 as T
			}

			case '[object Array]': {
				const keys = Object.keys(x)
				const x2 = new Array(keys.length) as AnyArrayObject
				if (circles) refs.set(x, x2)

				for (const key of keys) x2[key] = clone((x as AnyArrayObject)[key], refs)
				return x2
			}

			case '[object Set]': {
				const x1 = x as unknown as Set<any>
				const x2 = new Set()
				if (circles) refs.set(x, x2)

				x1.forEach((val) => {
					x2.add(clone(val, refs))
				})
				return x2 as T
			}

			case '[object Map]': {
				const x1 = x as unknown as Map<any, any>
				const x2 = new Map()
				if (circles) refs.set(x, x2)

				x1.forEach((val, key) => {
					x2.set(clone(key, refs), clone(val, refs))
				})
				return x2 as T
			}

			case '[object Date]':
				return new Date(x as unknown as Date) as T

			case '[object RegExp]': {
				const x1 = x as unknown as RegExp
				const x2 = new RegExp(x1.source, x1.flags)
				x2.lastIndex = x1.lastIndex
				return x2 as T
			}

			case '[object ArrayBuffer]':
				return (x as unknown as ArrayBuffer).slice(0) as T
		}

		// TypedArray | Buffer
		if (ArrayBuffer.isView(x)) {
			const x1 = x as ArrayBufferView
			return (
				typeof Buffer !== 'undefined' && x1 instanceof Buffer
					? Buffer.from(x1)
					: new (x1.constructor as Constructor)(
							x1.buffer.slice(),
							x1.byteOffset,
							(x1 as TypedArray).length,
						)
			) as T
		}

		return x
	}

	return <T>(x: T): T => clone(x, new Map<unknown, unknown>())
}
