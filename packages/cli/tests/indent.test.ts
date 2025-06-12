import { describe, expect, it } from 'vitest'

import { detectIndent } from '../src/utils/indent'
import { fixtures } from './fixtures/indent.fixture'

describe('detectIndent()', () => {
	it('should detect the indent of a string', () => {
		expect(detectIndent(fixtures.space)).toEqual({ amount: 2, indent: '  ', type: 'space' })
		expect(detectIndent(fixtures.space4)).toEqual({ amount: 4, indent: '    ', type: 'space' })
		expect(detectIndent(fixtures.tab)).toEqual({ amount: 1, indent: '\t', type: 'tab' })
		expect(detectIndent(fixtures.tab4)).toEqual({ amount: 4, indent: '\t\t\t\t', type: 'tab' })
		expect(detectIndent(fixtures.almostSpace)).toEqual({ amount: 2, indent: '  ', type: 'space' })
		expect(detectIndent(fixtures.almostTab)).toEqual({ amount: 1, indent: '\t', type: 'tab' })

		expect(detectIndent('<div></div>')).toEqual({ amount: 0, indent: '' })

		expect(detectIndent(fixtures.spaceFirst)).toEqual({ amount: 2, indent: '  ', type: 'space' })
		expect(detectIndent(fixtures.tabFirst)).toEqual({ amount: 1, indent: '\t', type: 'tab' })

		expect(detectIndent(fixtures.moreSpace)).toEqual({ amount: 2, indent: '  ', type: 'space' })

		expect(detectIndent(fixtures.singleSpace)).toEqual({ amount: 4, indent: '    ', type: 'space' })
		expect(detectIndent(fixtures.singleSpace2)).toEqual({ amount: 0, indent: '' })

		expect(detectIndent(fixtures.longRepeat)).toEqual({ amount: 2, indent: '  ', type: 'space' })
	})
})
