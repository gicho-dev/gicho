import type { IncreaseSemverOptions, SemverIncType } from './semver'

import { readPackageJson, writePackageJson } from '../package'
import { increaseSemver } from './semver'

export function bumpVersion(
	pkgPath: string,
	type: SemverIncType,
	preIdOrOptions?: string | IncreaseSemverOptions,
): string {
	const [pkg, path] = readPackageJson(pkgPath)

	const origVersion = pkg.version || '0.0.0'
	const version = increaseSemver(origVersion, type, preIdOrOptions)
	changeVersion(path, version)

	return version
}

export function changeVersion(pkgPath: string, version: string): void {
	const [pkg, path] = readPackageJson(pkgPath)
	writePackageJson(path, { ...pkg, version })
}
