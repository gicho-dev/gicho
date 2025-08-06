import type { AnyFunction } from '../../../src/types'

import { bench, describe } from 'vitest'

import { createClone } from '../../../src/object/clone'
import { fixtures } from './clone.fixtures'
import { samples } from './clone.samples'

describe('clone', () => {
	const { klona, rfdc } = samples

	const rfdcClone = rfdc()
	const rfdcCloneCircles = rfdc({ circles: true })

	const { clone } = createClone()
	const { clone: cloneCircles } = createClone({ circles: true })

	function runner(name: keyof typeof fixtures, contentders: Record<string, AnyFunction>) {
		describe(name, () => {
			const keys = Object.keys(contentders)

			keys.forEach((contender) => {
				const clone = contentders[contender]
				bench(`${name} - ${contender}`, () => {
					clone(fixtures[name])
				})
			})
		})
	}

	describe('create clone function', () => {
		bench('createClone', () => {
			createClone()
		})
		bench('rfdc()', () => {
			rfdc()
		})
	})

	runner('obj1', {
		clone,
		cloneCircles,
		klona,
		rfdc: rfdcClone,
		'rfdc (circles)': rfdcCloneCircles,
	})
	runner('objLite', {
		clone,
		cloneCircles,
		klona,
		rfdc: rfdcClone,
		'rfdc (circles)': rfdcCloneCircles,
	})

	runner('objCircular1', {
		cloneCircles,
		'rfdc (circles)': rfdcCloneCircles,
	})
	runner('objCircular2', {
		cloneCircles,
		'rfdc (circles)': rfdcCloneCircles,
	})
})
