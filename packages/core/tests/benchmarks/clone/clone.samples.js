export const samples = {
	klona,
	rfdcClone: _rfdc()(),
	rfdcCloneCircles: _rfdc()({ circles: true }),
}

/* ----------------------------------------
 *   klona - default (v2.0.6)
 * ------------------------------------- */

export function klona(x) {
	if (typeof x !== 'object') return x

	let k
	let tmp
	const str = Object.prototype.toString.call(x)

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor()
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k])
				}
			}
		} else {
			tmp = {} // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					})
				} else {
					tmp[k] = klona(x[k])
				}
			}
		}
		return tmp
	}

	if (str === '[object Array]') {
		k = x.length
		for (tmp = Array(k); k--; ) {
			tmp[k] = klona(x[k])
		}
		return tmp
	}

	if (str === '[object Set]') {
		tmp = new Set()
		x.forEach((val) => {
			tmp.add(klona(val))
		})
		return tmp
	}

	if (str === '[object Map]') {
		tmp = new Map()
		x.forEach((val, key) => {
			tmp.set(klona(key), klona(val))
		})
		return tmp
	}

	if (str === '[object Date]') {
		return new Date(+x)
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags)
		tmp.lastIndex = x.lastIndex
		return tmp
	}

	if (str === '[object DataView]') {
		return new x.constructor(klona(x.buffer))
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0)
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x)
	}

	return x
}

/* ----------------------------------------
 *   rfdc (v1.4.1)
 * ------------------------------------- */

export function _rfdc() {
	function copyBuffer(cur) {
		if (cur instanceof Buffer) {
			return Buffer.from(cur)
		}

		return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length)
	}

	function rfdc(opts) {
		opts = opts || {}
		if (opts.circles) return rfdcCircles(opts)

		const constructorHandlers = new Map()
		constructorHandlers.set(Date, (o) => new Date(o))
		constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)))
		constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)))
		if (opts.constructorHandlers) {
			for (const handler of opts.constructorHandlers) {
				constructorHandlers.set(handler[0], handler[1])
			}
		}

		let handler = null

		return opts.proto ? cloneProto : clone

		function cloneArray(a, fn) {
			const keys = Object.keys(a)
			const a2 = new Array(keys.length)
			for (let i = 0; i < keys.length; i++) {
				const k = keys[i]
				const cur = a[k]
				if (typeof cur !== 'object' || cur === null) {
					a2[k] = cur
				} else if (
					cur.constructor !== Object &&
					(handler = constructorHandlers.get(cur.constructor))
				) {
					a2[k] = handler(cur, fn)
				} else if (ArrayBuffer.isView(cur)) {
					a2[k] = copyBuffer(cur)
				} else {
					a2[k] = fn(cur)
				}
			}
			return a2
		}

		function clone(o) {
			if (typeof o !== 'object' || o === null) return o
			if (Array.isArray(o)) return cloneArray(o, clone)
			if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
				return handler(o, clone)
			}
			const o2 = {}
			for (const k in o) {
				if (Object.hasOwn(o, k) === false) continue
				const cur = o[k]
				if (typeof cur !== 'object' || cur === null) {
					o2[k] = cur
				} else if (
					cur.constructor !== Object &&
					(handler = constructorHandlers.get(cur.constructor))
				) {
					o2[k] = handler(cur, clone)
				} else if (ArrayBuffer.isView(cur)) {
					o2[k] = copyBuffer(cur)
				} else {
					o2[k] = clone(cur)
				}
			}
			return o2
		}

		function cloneProto(o) {
			if (typeof o !== 'object' || o === null) return o
			if (Array.isArray(o)) return cloneArray(o, cloneProto)
			if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
				return handler(o, cloneProto)
			}
			const o2 = {}
			for (const k in o) {
				const cur = o[k]
				if (typeof cur !== 'object' || cur === null) {
					o2[k] = cur
				} else if (
					cur.constructor !== Object &&
					(handler = constructorHandlers.get(cur.constructor))
				) {
					o2[k] = handler(cur, cloneProto)
				} else if (ArrayBuffer.isView(cur)) {
					o2[k] = copyBuffer(cur)
				} else {
					o2[k] = cloneProto(cur)
				}
			}
			return o2
		}
	}

	function rfdcCircles(opts) {
		const refs = []
		const refsNew = []

		const constructorHandlers = new Map()
		constructorHandlers.set(Date, (o) => new Date(o))
		constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)))
		constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)))
		if (opts.constructorHandlers) {
			for (const handler of opts.constructorHandlers) {
				constructorHandlers.set(handler[0], handler[1])
			}
		}

		let handler = null
		return opts.proto ? cloneProto : clone

		function cloneArray(a, fn) {
			const keys = Object.keys(a)
			const a2 = new Array(keys.length)
			for (let i = 0; i < keys.length; i++) {
				const k = keys[i]
				const cur = a[k]
				if (typeof cur !== 'object' || cur === null) {
					a2[k] = cur
				} else if (
					cur.constructor !== Object &&
					(handler = constructorHandlers.get(cur.constructor))
				) {
					a2[k] = handler(cur, fn)
				} else if (ArrayBuffer.isView(cur)) {
					a2[k] = copyBuffer(cur)
				} else {
					const index = refs.indexOf(cur)
					if (index !== -1) {
						a2[k] = refsNew[index]
					} else {
						a2[k] = fn(cur)
					}
				}
			}
			return a2
		}

		function clone(o) {
			if (typeof o !== 'object' || o === null) return o
			if (Array.isArray(o)) return cloneArray(o, clone)
			if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
				return handler(o, clone)
			}
			const o2 = {}
			refs.push(o)
			refsNew.push(o2)
			for (const k in o) {
				if (Object.hasOwn(o, k) === false) continue
				const cur = o[k]
				if (typeof cur !== 'object' || cur === null) {
					o2[k] = cur
				} else if (
					cur.constructor !== Object &&
					(handler = constructorHandlers.get(cur.constructor))
				) {
					o2[k] = handler(cur, clone)
				} else if (ArrayBuffer.isView(cur)) {
					o2[k] = copyBuffer(cur)
				} else {
					const i = refs.indexOf(cur)
					if (i !== -1) {
						o2[k] = refsNew[i]
					} else {
						o2[k] = clone(cur)
					}
				}
			}
			refs.pop()
			refsNew.pop()
			return o2
		}

		function cloneProto(o) {
			if (typeof o !== 'object' || o === null) return o
			if (Array.isArray(o)) return cloneArray(o, cloneProto)
			if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
				return handler(o, cloneProto)
			}
			const o2 = {}
			refs.push(o)
			refsNew.push(o2)
			for (const k in o) {
				const cur = o[k]
				if (typeof cur !== 'object' || cur === null) {
					o2[k] = cur
				} else if (
					cur.constructor !== Object &&
					(handler = constructorHandlers.get(cur.constructor))
				) {
					o2[k] = handler(cur, cloneProto)
				} else if (ArrayBuffer.isView(cur)) {
					o2[k] = copyBuffer(cur)
				} else {
					const i = refs.indexOf(cur)
					if (i !== -1) {
						o2[k] = refsNew[i]
					} else {
						o2[k] = cloneProto(cur)
					}
				}
			}
			refs.pop()
			refsNew.pop()
			return o2
		}
	}

	return rfdc
}
