import { bench, describe } from 'vitest'

import { createClone } from '../../../src/object/clone'
import { fixtures } from '../../fixtures/clone.fixture'
import { samples } from './clone.samples'

describe('clone', () => {
	const { klona, rfdcClone, rfdcCloneCircles } = samples

	const clone = createClone()

	const cloneCircles = createClone({ circles: true })

	function runner(name: keyof typeof fixtures, contentders: Record<string, Function>) {
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
