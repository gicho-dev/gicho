import { bench, describe } from 'vitest'

import { createMerge, createMergeObject } from '../../../src/object/merge'
import { fixtures } from './merge.fixtures'
import { samples } from './merge.samples'

describe('benchmark testing 1', () => {
	const { deepmerge, fastifyDeepmerge } = samples

	const merge = createMerge()
	const mergeObject = createMergeObject()
	const mergeObjectSymbols = createMergeObject({ symbolKeys: true })

	const deepmergeMerge = deepmerge
	const deepmergeMergeAll = deepmergeMerge.all

	const fastifyDeepmergeMerge = fastifyDeepmerge()
	const fastifyDeepmergeMergeAll = fastifyDeepmerge({ all: true })
	const fastifyDeepmergeMergeSymbols = fastifyDeepmerge({ all: true, symbols: true })

	function runner(name: keyof typeof fixtures, contentders: Record<string, Function>) {
		describe(name, () => {
			const keys = Object.keys(contentders)

			keys.forEach((contender) => {
				const merge = contentders[contender]

				if (merge === deepmergeMergeAll) {
					bench(`${name} - ${contender}`, () => {
						merge(fixtures[name])
					})
				} else {
					bench(`${name} - ${contender}`, () => {
						merge(...fixtures[name])
					})
				}
			})
		})
	}

	// with symbol keys
	runner('simpleMix1', {
		merge,
		mergeObjectSymbols,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})

	// The others are not supported merge map, set
	// So this comparison is meaningless
	//
	// runner('map1', {
	// 	merge,
	// 	'deepmerge (all)': deepmergeMergeAll,
	// 	'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
	// 	'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	// })

	runner('json2', {
		merge,
		mergeObject,
		mergeObjectSymbols,
		deepmerge: deepmergeMerge,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge': fastifyDeepmergeMerge,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
	runner('json100', {
		merge,
		mergeObject,
		mergeObjectSymbols,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
	runner('json1000', {
		merge,
		mergeObject,
		mergeObjectSymbols,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})

	runner('jsonManyKeys2', {
		merge,
		mergeObject,
		mergeObjectSymbols,
		deepmerge: deepmergeMerge,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge': fastifyDeepmergeMerge,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
	runner('jsonManyKeys10', {
		merge,
		mergeObject,
		mergeObjectSymbols,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
})
