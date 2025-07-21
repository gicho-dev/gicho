import { bench, describe } from 'vitest'

import { clone } from '../../../src/object/clone'
import {
	createMerge,
	createMergeObjects,
	mergeConfigs,
	mergeConfigsInto,
} from '../../../src/object/merge'
import { fixtures } from './merge.fixtures'
import { samples } from './merge.samples'

describe('benchmark testing 1', () => {
	const { deepmerge, fastifyDeepmerge } = samples

	const { merge, mergeInto } = createMerge()
	const { mergeObjects, mergeObjectsInto } = createMergeObjects()
	const { mergeObjects: mergeObjectsSymbols, mergeObjectsInto: mergeObjectsSymbolsInto } =
		createMergeObjects({ symbolKeys: true })

	const deepmergeMerge = deepmerge
	const deepmergeMergeAll = deepmergeMerge.all

	const fastifyDeepmergeMerge = fastifyDeepmerge()
	const fastifyDeepmergeMergeAll = fastifyDeepmerge({ all: true })
	const fastifyDeepmergeMergeSymbols = fastifyDeepmerge({ all: true, symbols: true })

	function runner(name: keyof typeof fixtures, contenders: Record<string, Function>) {
		describe(name, () => {
			const keys = Object.keys(contenders)

			keys.forEach((contender) => {
				const merge = contenders[contender]

				if (merge === deepmergeMergeAll) {
					bench(`${name} - ${contender}`, () => {
						const values = clone(fixtures[name])
						merge(values)
					})
				} else {
					bench(`${name} - ${contender}`, () => {
						const values = clone(fixtures[name])
						merge(...values)
					})
				}
			})
		})
	}

	// with symbol keys
	runner('simpleMix1', {
		merge,
		mergeObjectsSymbols,
		mergeInto,
		mergeObjectsSymbolsInto,
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
		mergeConfigs,
		mergeObjects,
		mergeObjectsSymbols,
		mergeInto,
		mergeConfigsInto,
		mergeObjectsInto,
		mergeObjectsSymbolsInto,
		deepmerge: deepmergeMerge,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge': fastifyDeepmergeMerge,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
	runner('json100', {
		merge,
		mergeConfigs,
		mergeObjects,
		mergeObjectsSymbols,
		mergeInto,
		mergeConfigsInto,
		mergeObjectsInto,
		mergeObjectsSymbolsInto,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
	runner('json1000', {
		merge,
		mergeConfigs,
		mergeObjects,
		mergeObjectsSymbols,
		mergeInto,
		mergeConfigsInto,
		mergeObjectsInto,
		mergeObjectsSymbolsInto,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})

	runner('jsonManyKeys2', {
		merge,
		mergeConfigs,
		mergeObjects,
		mergeObjectsSymbols,
		mergeInto,
		mergeConfigsInto,
		mergeObjectsInto,
		mergeObjectsSymbolsInto,
		deepmerge: deepmergeMerge,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge': fastifyDeepmergeMerge,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
	runner('jsonManyKeys10', {
		merge,
		mergeConfigs,
		mergeObjects,
		mergeObjectsSymbols,
		mergeInto,
		mergeConfigsInto,
		mergeObjectsInto,
		mergeObjectsSymbolsInto,
		'deepmerge (all)': deepmergeMergeAll,
		'@fastify/deepmerge (all)': fastifyDeepmergeMergeAll,
		'@fastify/deepmerge (symbols)': fastifyDeepmergeMergeSymbols,
	})
})
