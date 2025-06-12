// Inspired by `detect-indent` (https://github.com/sindresorhus/detect-indent)

export interface IndentInfo {
	amount: number
	indent: string
	type?: 'space' | 'tab'
}

export function detectIndent(text: string): IndentInfo {
	const indentMap = createIndentMap(text)
	const mostUsedKey = getMostUsedKey(indentMap)

	if (!mostUsedKey) return { amount: 0, indent: '' }

	const type = mostUsedKey[0] === '1' ? 'space' : 'tab'
	const amount = Number(mostUsedKey.slice(1))
	const indent = (type === 'space' ? ' ' : '\t').repeat(amount)

	return { amount, indent, type }
}

/* ---------- Internal ---------- */

type IndentMap = Map<string, [usedCount: number, weight: number]>

const RE_INDENT = /^(?:( )+|\t+)/
const SPACE = 1
const TAB = 2

function createIndentMap(str: string): IndentMap {
	const indentMap: IndentMap = new Map()

	let prevSize = 0
	let prevType = 0
	let key = ''

	for (const line of str.split('\n')) {
		if (!line) continue

		const matches = line.match(RE_INDENT)

		if (matches === null) {
			prevType = 0
			prevSize = 0
			continue
		}

		const size = matches[0].length
		const type = matches[1] ? SPACE : TAB

		if (type === SPACE && size === 1) continue

		if (type !== prevType) prevSize = 0
		prevType = type

		const diff = size - prevSize
		prevSize = size

		let use = 1
		let weight = 0

		if (diff === 0) {
			use = 0
			weight = 1
		} else {
			key = `${type}${Math.abs(diff)}`
		}

		let entry = indentMap.get(key)
		entry = entry === undefined ? [1, 0] : [entry[0] + use, entry[1] + weight]
		indentMap.set(key, entry)
	}

	return indentMap
}

function getMostUsedKey(indentMap: IndentMap): string {
	let mostUsedKey = ''
	let maxUsedCount = 0
	let maxWeight = 0

	for (const [key, [usedCount, weight]] of indentMap) {
		if (usedCount > maxUsedCount || (usedCount === maxUsedCount && weight > maxWeight)) {
			maxUsedCount = usedCount
			maxWeight = weight
			mostUsedKey = key
		}
	}

	return mostUsedKey
}
