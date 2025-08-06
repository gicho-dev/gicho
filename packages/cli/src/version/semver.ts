// Reference: https://semver.org

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

export type SemverIncType =
	| 'major'
	| 'minor'
	| 'patch'
	| 'release'
	| 'premajor'
	| 'preminor'
	| 'prepatch'
	| 'prerelease'

export interface Semver {
	major: number
	minor: number
	patch: number
	preId?: string
	prerelease: (string | number)[]
	preVersion?: number
	build?: string
}

export interface IncreaseSemverOptions {
	build?: string
	preId?: string
	preIdOnly?: boolean
}

/* ----------------------------------------
 *   Constants
 * ------------------------------------- */

const RE_NUMERIC = /^\d+$/

const RT_ALPHA_DASH = '[a-zA-Z-]'
const RT_ALPHA_NUM_DASH = '[0-9a-zA-Z-]'

const RT_NUM_ID = '0|[1-9]\\d*'
const RT_NON_NUM_ID = `\\d*${RT_ALPHA_DASH}${RT_ALPHA_NUM_DASH}*`

const RT_MAIN = `(${RT_NUM_ID})\\.(${RT_NUM_ID})\\.(${RT_NUM_ID})`

const RT_PRERELEASE_ID = `(?:${RT_NUM_ID}|${RT_NON_NUM_ID})`
const RT_PRERELEASE = `(?:-(${RT_PRERELEASE_ID}(?:\\.${RT_PRERELEASE_ID})*))`

const RT_BUILD_ID = `${RT_ALPHA_NUM_DASH}+`
const RT_BUILD = `(?:\\+(${RT_BUILD_ID}(?:\\.${RT_BUILD_ID})*))`

const RT_SEMVER_PLAIN = `v?${RT_MAIN}${RT_PRERELEASE}?${RT_BUILD}?`
const RT_SEMVER = `^${RT_SEMVER_PLAIN}$`

// eslint-disable-next-line
const RE_PRERELEASE = new RegExp(RT_PRERELEASE)
const RE_SEMVER = new RegExp(RT_SEMVER)

/* ----------------------------------------
 *   Functions
 * ------------------------------------- */

export function increaseSemver(
	version: string,
	what: SemverIncType,
	preIdOrOptions?: string | IncreaseSemverOptions,
): string {
	return toSemverString(increaseSemverObject(parseSemver(version), what, preIdOrOptions))
}

export function increaseSemverObject(
	v: Semver,
	what: SemverIncType,
	preIdOrOptions?: string | IncreaseSemverOptions,
): Semver {
	const { major: x, minor: y, patch: z, prerelease: p } = v

	const { build, preId, preIdOnly } =
		typeof preIdOrOptions === 'string' ? { preId: preIdOrOptions } : preIdOrOptions || {}

	const xyz = (x: number, y: number, z: number): void => {
		v.major = x
		v.minor = y
		v.patch = z
	}

	if (!what.startsWith('pre')) {
		switch (what) {
			case 'major':
				xyz(x + (y || z || !p.length ? 1 : 0), 0, 0)
				p.length = 0
				break
			case 'minor':
				xyz(x, y + (z || !p.length ? 1 : 0), 0)
				p.length = 0
				break
			case 'patch':
				xyz(x, y, z + (!p.length ? 1 : 0))
				p.length = 0
				break
			case 'release':
				if (!p.length) throw new Error(`version is not a prerelease`)
				p.length = 0
				break
		}
		v.build = build
		return v
	}

	if (preIdOnly && !preId) throw new Error('invalid option: preId is empty')
	if (preId) {
		const match = `-${preId}`.match(RE_PRERELEASE)
		if (!match || match[1] !== preId) throw new Error(`invalid preId: ${preId}`)
	}

	switch (what) {
		case 'premajor':
			xyz(x + 1, 0, 0)
			p.length = 0
			break
		case 'preminor':
			xyz(x, y + 1, 0)
			p.length = 0
			break
		case 'prepatch':
			xyz(x, y, z + 1)
			p.length = 0
			break
		case 'prerelease':
			if (!p.length) xyz(x, y, z + 1)
			break
	}

	if (preId) {
		const p2: (string | number)[] = preId.split('.')
		const p2Len = p2.length
		const startsWithPreId = p.length < p2Len ? false : p2.every((val, i) => val === String(p[i]))

		if (preIdOnly && startsWithPreId && p2Len === p.length) {
			throw new Error('invalid option: preId already exists')
		}
		if (startsWithPreId && !isNaN(p[p2Len] as number)) {
			p2[p2Len] = (p[p2Len] as number) + 1
		} else if (!preIdOnly) {
			p2.push(0)
		}
		v.prerelease = p2
	} else {
		if (p.length) {
			const lastIndex = p.length - 1
			if (typeof p[lastIndex] === 'number') {
				p[lastIndex] += 1
			} else {
				p.push(0)
			}
		} else {
			p[0] = 0
		}
	}

	v.build = build

	return v
}

export function parseSemver(version: string): Semver {
	const match = version.match(RE_SEMVER)
	if (!match) throw new Error(`Invalid semver: ${version}`)

	const [, major, minor, patch, prerelease, build] = match

	return {
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch),
		prerelease: prerelease
			? prerelease.split('.').map((x) => (RE_NUMERIC.test(x) ? Number(x) : x))
			: [],
		build,
	}
}

export function toSemverString(semver: Semver): string {
	const { major, minor, patch, prerelease, build } = semver
	return `${major}.${minor}.${patch}${prerelease.length ? `-${prerelease.join('.')}` : ''}${build ? `+${build}` : ''}`
}
