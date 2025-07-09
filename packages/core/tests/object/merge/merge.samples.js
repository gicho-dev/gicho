/* eslint-disable no-use-before-define, prefer-rest-params */

export const samples = {
	deepmerge: _deepmerge(),
	fastifyDeepmerge: _fastifyDeepmerge(),
}

/* ----------------------------------------
 *   deepmerge (v4.3.1)
 * ------------------------------------- */

function _deepmerge() {
	// is-mergeable-object (v1.1.1)

	function isMergeableObject(value) {
		return isNonNullObject(value) && !isSpecial(value)
	}

	function isNonNullObject(value) {
		return !!value && typeof value === 'object'
	}

	function isSpecial(value) {
		const stringValue = Object.prototype.toString.call(value)

		return (
			stringValue === '[object RegExp]' || stringValue === '[object Date]' || isReactElement(value)
		)
	}

	// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
	const canUseSymbol = typeof Symbol === 'function' && Symbol.for
	const REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7

	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE
	}

	// deepmerge (v4.3.1)

	const defaultIsMergeableObject = isMergeableObject

	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {}
	}

	function cloneUnlessOtherwiseSpecified(value, options) {
		return options.clone !== false && options.isMergeableObject(value)
			? deepmerge(emptyTarget(value), value, options)
			: value
	}

	function defaultArrayMerge(target, source, options) {
		return target.concat(source).map((element) => {
			return cloneUnlessOtherwiseSpecified(element, options)
		})
	}

	function getMergeFunction(key, options) {
		if (!options.customMerge) {
			return deepmerge
		}
		const customMerge = options.customMerge(key)
		return typeof customMerge === 'function' ? customMerge : deepmerge
	}

	function getEnumerableOwnPropertySymbols(target) {
		return Object.getOwnPropertySymbols
			? Object.getOwnPropertySymbols(target).filter((symbol) => {
					return Object.propertyIsEnumerable.call(target, symbol)
				})
			: []
	}

	function getKeys(target) {
		return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
	}

	function propertyIsOnObject(object, property) {
		try {
			return property in object
		} catch (_) {
			return false
		}
	}

	// Protects from prototype poisoning and unexpected merging up the prototype chain.
	function propertyIsUnsafe(target, key) {
		return (
			propertyIsOnObject(target, key) && // Properties are safe to merge if they don't exist in the target yet,
			!(
				Object.hasOwn(target, key) && // unsafe if they exist up the prototype chain,
				Object.propertyIsEnumerable.call(target, key)
			)
		) // and also unsafe if they're nonenumerable.
	}

	function mergeObject(target, source, options) {
		const destination = {}
		if (options.isMergeableObject(target)) {
			getKeys(target).forEach((key) => {
				destination[key] = cloneUnlessOtherwiseSpecified(target[key], options)
			})
		}
		getKeys(source).forEach((key) => {
			if (propertyIsUnsafe(target, key)) {
				return
			}

			if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
				destination[key] = getMergeFunction(key, options)(target[key], source[key], options)
			} else {
				destination[key] = cloneUnlessOtherwiseSpecified(source[key], options)
			}
		})
		return destination
	}

	function deepmerge(target, source, options) {
		options = options || {}
		options.arrayMerge = options.arrayMerge || defaultArrayMerge
		options.isMergeableObject = options.isMergeableObject || defaultIsMergeableObject
		// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
		// implementations can use it. The caller may not replace it.
		options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified

		const sourceIsArray = Array.isArray(source)
		const targetIsArray = Array.isArray(target)
		const sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

		if (!sourceAndTargetTypesMatch) {
			return cloneUnlessOtherwiseSpecified(source, options)
		} else if (sourceIsArray) {
			return options.arrayMerge(target, source, options)
		} else {
			return mergeObject(target, source, options)
		}
	}

	deepmerge.all = function deepmergeAll(array, options) {
		if (!Array.isArray(array)) {
			throw new Error('first argument should be an array')
		}

		return array.reduce((prev, next) => {
			return deepmerge(prev, next, options)
		}, {})
	}

	return deepmerge
}

/* ----------------------------------------
 *   @fastify/deepmerge - default (v3.1.0)
 * ------------------------------------- */

function _fastifyDeepmerge() {
	const JSON_PROTO = Object.getPrototypeOf({})

	function defaultIsMergeableObjectFactory() {
		return function defaultIsMergeableObject(value) {
			return (
				typeof value === 'object' &&
				value !== null &&
				!(value instanceof RegExp) &&
				!(value instanceof Date)
			)
		}
	}

	function deepmergeConstructor(options) {
		function isNotPrototypeKey(value) {
			return value !== 'constructor' && value !== 'prototype' && value !== '__proto__'
		}

		function cloneArray(value) {
			let i = 0
			const il = value.length
			const result = new Array(il)
			for (i; i < il; ++i) {
				result[i] = clone(value[i])
			}
			return result
		}

		function cloneObject(target) {
			const result = {}

			if (cloneProtoObject && Object.getPrototypeOf(target) !== JSON_PROTO) {
				return cloneProtoObject(target)
			}

			const targetKeys = getKeys(target)
			let i, il, key
			for (i = 0, il = targetKeys.length; i < il; ++i) {
				isNotPrototypeKey((key = targetKeys[i])) && (result[key] = clone(target[key]))
			}
			return result
		}

		function concatArrays(target, source) {
			const tl = target.length
			const sl = source.length
			let i = 0
			const result = new Array(tl + sl)
			for (i; i < tl; ++i) {
				result[i] = clone(target[i])
			}
			for (i = 0; i < sl; ++i) {
				result[i + tl] = clone(source[i])
			}
			return result
		}

		const propertyIsEnumerable = Object.prototype.propertyIsEnumerable
		function getSymbolsAndKeys(value) {
			const result = Object.keys(value)
			const keys = Object.getOwnPropertySymbols(value)
			for (let i = 0, il = keys.length; i < il; ++i) {
				propertyIsEnumerable.call(value, keys[i]) && result.push(keys[i])
			}
			return result
		}

		const getKeys = options?.symbols ? getSymbolsAndKeys : Object.keys

		const cloneProtoObject =
			typeof options?.cloneProtoObject === 'function' ? options.cloneProtoObject : undefined

		const isMergeableObject =
			typeof options?.isMergeableObject === 'function'
				? options.isMergeableObject
				: defaultIsMergeableObjectFactory()

		function isPrimitive(value) {
			return typeof value !== 'object' || value === null
		}

		const mergeArray =
			options && typeof options.mergeArray === 'function'
				? options.mergeArray({ clone, deepmerge: _deepmerge, getKeys, isMergeableObject })
				: concatArrays

		function clone(entry) {
			return isMergeableObject(entry)
				? Array.isArray(entry)
					? cloneArray(entry)
					: cloneObject(entry)
				: entry
		}

		function mergeObject(target, source) {
			const result = {}
			const targetKeys = getKeys(target)
			const sourceKeys = getKeys(source)
			let i, il, key
			for (i = 0, il = targetKeys.length; i < il; ++i) {
				isNotPrototypeKey((key = targetKeys[i])) &&
					sourceKeys.indexOf(key) === -1 &&
					(result[key] = clone(target[key]))
			}

			for (i = 0, il = sourceKeys.length; i < il; ++i) {
				if (!isNotPrototypeKey((key = sourceKeys[i]))) {
					continue
				}

				if (key in target) {
					if (targetKeys.indexOf(key) !== -1) {
						if (
							cloneProtoObject &&
							isMergeableObject(source[key]) &&
							Object.getPrototypeOf(source[key]) !== JSON_PROTO
						) {
							result[key] = cloneProtoObject(source[key])
						} else {
							result[key] = _deepmerge(target[key], source[key])
						}
					}
				} else {
					result[key] = clone(source[key])
				}
			}
			return result
		}

		function _deepmerge(target, source) {
			const sourceIsArray = Array.isArray(source)
			const targetIsArray = Array.isArray(target)

			if (isPrimitive(source)) {
				return source
			} else if (!isMergeableObject(target)) {
				return clone(source)
			} else if (sourceIsArray && targetIsArray) {
				return mergeArray(target, source)
			} else if (sourceIsArray !== targetIsArray) {
				return clone(source)
			} else {
				return mergeObject(target, source)
			}
		}

		function _deepmergeAll() {
			switch (arguments.length) {
				case 0:
					return {}
				case 1:
					return clone(arguments[0])
				case 2:
					return _deepmerge(arguments[0], arguments[1])
			}
			let result
			for (let i = 0, il = arguments.length; i < il; ++i) {
				result = _deepmerge(result, arguments[i])
			}
			return result
		}

		return options?.all ? _deepmergeAll : _deepmerge
	}

	return deepmergeConstructor
}
