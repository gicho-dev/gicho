import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'

import { formatFileWithPrettier } from '../../packages/cli/src'
import { rootPath } from '../root'

const PATH_OUTPUT = rootPath('packages/core/src/string/width.internal.ts')
const PATH_INPUT = new URL('east-asian-width.txt', import.meta.url)

const widthTypes = ['A', 'F', 'H', 'N', 'Na', 'W']

const independentFunctions: Record<string, string> = {
	A: 'isAmbiguous',
	F: 'isFullWidth',
	H: 'isHalfWidth',
	Na: 'isNarrow',
	W: 'isWide',
}

const toHex = (n: number) => (n === 0 ? 0 : `0x${n.toString(16)}`)

function simplifyRanges(ranges: number[][]) {
	if (ranges.length === 0) return ranges

	ranges = ranges.map(([s, e]) => (s <= e ? [s, e] : [e, s])).sort((a, b) => a[0] - b[0])

	const result = [ranges[0]]
	for (const [start, end] of ranges.slice(1)) {
		const [lastStart, lastEnd] = result.at(-1) as [number, number]

		if (start - 1 <= lastEnd) result[result.length - 1] = [lastStart, Math.max(end, lastEnd)]
		else result.push([start, end])
	}

	// separate two number ranges [1,2] => [1,1], [2,2]
	// return result.flatMap(([s, e]) => s + 1 === e ? [[s, s], [e, e]] : [[s, e]]);

	return result
}

function parse(text: string) {
	text = text.replaceAll(/\s*#.*$/gm, '').trim() // remove comments

	const widthRanges = widthTypes.reduce(
		(obj, v) => ({ ...obj, [v]: [] }),
		{} as Record<string, number[][]>,
	)

	for (const line of text.split('\n')) {
		// Ref: https://www.unicode.org/Public/UCD/latest/ucd/EastAsianWidth.txt
		// The format is two fields separated by a semicolon.
		// Field 0: Unicode code point value or range of code point values
		// Field 1: East_Asian_Width property, consisting of one of the following values:
		//          "A", "F", "H", "N", "Na", "W"
		const [range, widthType] = line.split(';').map((s) => s.trim())

		const [start, end = start] = range.split('..').map((v) => Number.parseInt(v, 16))
		widthRanges[widthType].push([start, end])
	}

	for (const widthType in widthRanges) {
		const ranges = simplifyRanges(widthRanges[widthType])
		assert.ok(ranges.length > 0)
		widthRanges[widthType] = ranges
	}

	return widthRanges
}

function generateCode(widthRanges: Record<string, number[][]>) {
	const blocks = ['// Generated code.']
	const branches = [] as string[]

	blocks.push(`export type EastAsianWidthType = ${widthTypes.map((v) => `'${v}'`).join(' | ')}`)

	for (const widthType in widthRanges) {
		if (widthType === 'N') continue

		const ranges = widthRanges[widthType]

		const conds = ranges.map(([s, e]) =>
			s === e ? `x === ${toHex(s)}` : `(x >= ${toHex(s)} && x <= ${toHex(e)})`,
		)
		const fnName = independentFunctions[widthType]

		const fnCode = [
			`export function ${fnName}(x: number): boolean {`,
			`return ${conds.join('\n|| ')}`,
			'}',
		].join('\n')
		blocks.push(fnCode)

		branches.push(`if (${fnName}(x)) return '${widthType}'`)
	}

	blocks.push(
		[
			`export function getWidthType(x: number): EastAsianWidthType {`,
			`${branches.join('\n').trimStart()}`,
			`return 'N'`,
			'}',
		].join('\n'),
	)

	return blocks.join('\n\n')
}

async function main() {
	const res = await fetch('https://www.unicode.org/Public/UCD/latest/ucd/EastAsianWidth.txt')
	const text = await res.text()
	writeFileSync(PATH_INPUT, text)

	// const text = readFileSync(PATH_INPUT, 'utf-8')

	const categories = parse(text)
	const code = generateCode(categories)

	writeFileSync(PATH_OUTPUT, code)
	formatFileWithPrettier(PATH_OUTPUT)
}

await main()
