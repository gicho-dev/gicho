import type { SemverIncType } from '../src/version'

import { describe, expect, test } from 'vitest'

import { increaseSemver } from '../src/version'
import { semverIncreaseFixtures } from './fixtures/version.fixture'

describe('semver', () => {
	test('increaseSemver()', () => {
		const keys: SemverIncType[] = [
			'major',
			'minor',
			'patch',
			'release',
			'premajor',
			'preminor',
			'prepatch',
			'prerelease',
		]
		keys.forEach((key) => {
			semverIncreaseFixtures[key].forEach(([input, output, opts]) => {
				let result: string | undefined
				try {
					result = increaseSemver(input, key, opts)
				} catch {}
				expect(result).toBe(output)
			})
		})
	})
})
