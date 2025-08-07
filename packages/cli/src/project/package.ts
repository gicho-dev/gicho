import type { Arrayable } from '@gicho/core/types'

import type { FindFileOptions } from '../fs'

import { writeFileSync } from 'node:fs'

import { findFile, readText } from '../fs'
import { basename } from '../path'
import { execSync } from '../utils/exec'
import { parseJsonWithFormat, stringifyJsonWithFormat } from '../utils/format'

/* ----------------------------------------
 *   Types
 * ------------------------------------- */

export interface DetectPackageManagerOptions {
	defaultManager?: PackageManager
}

export interface PackageJson {
	/** The name of the package. (length: 1~214) */
	name?: string
	/** Version must be parsable by node-semver, which is bundled with npm as a dependency. */
	version?: string
	/** This helps people discover your package, as it's listed in 'npm search'. */
	description?: string
	/** This helps people discover your package as it's listed in 'npm search'. */
	keywords?: string[]
	/** The url to the project homepage. */
	homepage?: string
	/**
	 * The url to your project's issue tracker and / or the email address to which issues should be reported. These are helpful for people who encounter issues with your package.
	 */
	bugs?:
		| string
		| {
				/** The url to your project's issue tracker. */
				url?: string
				/** The email address to which issues should be reported. */
				email?: string
		  }
	/**
	 * You should specify a license for your package so that people know how they are permitted to use it, and any restrictions you're placing on it.
	 */
	license?: string
	/** A person who has been involved in creating or maintaining this package. */
	author?: PackageJsonPerson
	/** A list of people who contributed to this package. */
	contributors?: PackageJsonPerson[]
	/** A list of people who maintains this package. */
	maintainers?: PackageJsonPerson[]
	/** The 'files' field is an array of files to include in your project. If you name a folder in the array, then it will also include the files inside that folder. */
	files?: string[]
	/** The main field is a module ID that is the primary entry point to your program. */
	main?: string
	/** The `exports` field is used to restrict external access to non-exported module files, also enables a module to import itself using `name`. */
	exports?: PackageJsonExports
	/** The `imports` field is used to create private mappings that only apply to import specifiers from within the package itself. */
	import?: Record<string, string | Record<string, string>>
	/** A map of command name to local file name. */
	bin?: string | Record<string, string>
	/** When set to `module`, the type field allows a package to specify all .js files within are ES modules. If the `type` field is omitted or set to `commonjs`, all .js files are treated as CommonJS. */
	type?: 'commonjs' | 'module'
	/** Set the types property to point to your bundled declaration file. */
	types?: string
	/** Note that the `typings` field is synonymous with `types`, and could be used as well. */
	typings?: string
	/** The `typesVersions` field is used since TypeScript 3.1 to support features that were only made available in newer TypeScript versions. */
	typesVersions?: Record<string, Record<string, string[]>>
	/** Specify either a single file or an array of filenames to put in place for the man program to find. */
	man?: Arrayable<string>
	/** Specify the place where your code lives. This is helpful for people who want to contribute. */
	repository?:
		| string
		| {
				type: string
				url: string
				/** If the `package.json` for your package is not in the root directory (for example if it is part of a monorepo), you can specify the directory in which it lives: */
				directory?: string
		  }
	/** Used to inform about ways to help fund development of the package. */
	funding?: Arrayable<
		| string
		| {
				/** URL to a website with details about how to fund the package. */
				url: string
				/** The type of funding or the platform through which funding can be provided, e.g. patreon, opencollective, tidelift or github. */
				type?: string
		  }
	>
	/** The 'scripts' member is an object hash of script commands that are run at various times in the lifecycle of your package. The key is the lifecycle event, and the value is the command to run at that point. */
	scripts?: Record<string, string>
	/** Dependencies are specified with a simple hash of package name to version range. The version range is a string which has one or more space-separated descriptors. Dependencies can also be identified with a tarball or git URL. */
	dependencies?: Record<string, string>
	/** Specifies dependencies that are required for the development and testing of the project. These dependencies are not needed in the production environment. */
	devDependencies?: Record<string, string>
	/** Specifies dependencies that are optional for your project. These dependencies are attempted to be installed during the npm install process, but if they fail to install, the installation process will not fail. */
	optionalDependencies?: Record<string, string>
	/** Specifies dependencies that are required by the package but are expected to be provided by the consumer of the package. */
	peerDependencies?: Record<string, string>
	/** When a user installs your package, warnings are emitted if packages specified in `peerDependencies` are not already installed. The `peerDependenciesMeta` field serves to provide more information on how your peer dependencies are utilized. Most commonly, it allows peer dependencies to be marked as optional. Metadata for this field is specified with a simple hash of the package name to a metadata object. */
	peerDependenciesMeta?: Record<string, Record<string, any>>
	/** Array of package names that will be bundled when publishing the package. */
	bundleDependencies?: string[] | boolean
	/** Defines which package manager is expected to be used when working on the current project. This field is currently experimental and needs to be opted-in; see https://nodejs.org/api/corepack.html */
	packageManager?: string
	engines?: Record<string, string>
	/** Specify which operating systems your module will run on. */
	os?: string[]
	/** Specify that your code only runs on certain cpu architectures. */
	cpu?: string[]
	/** If set to true, then npm will refuse to publish it. */
	private?: boolean
	/** This is a set of config values that will be used at publish-time. */
	publishConfig?: PackageJsonPublishConfig
	/** An ECMAScript module ID that is the primary entry point to your program. */
	module?: string
	/** Allows packages within a directory to depend on one another using direct linking of local files. Additionally, dependencies within a workspace are hoisted to the workspace root when possible to reduce duplication. Note: It's also a good idea to set `private` to true when using this feature. */
	workspaces?: string[]

	[key: string]: any
}

/** A person who has been involved in creating or maintaining this package. */
type PackageJsonPerson = string | { name: string; email?: string; url?: string }

type PackageJsonExportKey =
	| '.'
	| 'require'
	| 'import'
	| 'node'
	| 'default'
	| 'types'
	| (string & {})
type PackageJsonExports = Arrayable<string | PackageJsonExportsObject>
type PackageJsonExportsObject = {
	[K in PackageJsonExportKey]?: PackageJsonExports
}

interface PackageJsonPublishConfig {
	/** The access level that will be used if the package is published. */
	access?: 'public' | 'restricted'
	/** The registry that will be used if the package is published. */
	registry?: string
	/** The tag that will be used if the package is published. */
	tag?: string

	[key: string]: any
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

/* ----------------------------------------
 *   Constants
 * ------------------------------------- */

export const LOCK_FILES = [
	'pnpm-lock.yaml',
	'yarn.lock',
	'bun.lockb',
	'bun.lock',
	'package-lock.json',
]

export const PACKAGE_JSON_FILE = 'package.json'

/* ----------------------------------------
 *   Functions
 * ------------------------------------- */

/**
 * Detects the package manager from a given directory.
 */
export function detectPackageManager(
	from: string,
	options: DetectPackageManagerOptions = {},
): PackageManager {
	try {
		const lockFile = basename(resolveLockFile(from)).toLowerCase()
		switch (lockFile) {
			case 'pnpm-lock.yaml':
				return 'pnpm'
			case 'yarn.lock':
				return 'yarn'
			case 'bun.lockb':
			case 'bun.lock':
				return 'bun'
			case 'package-lock.json':
			default:
				return 'npm'
		}
	} catch {
		return options.defaultManager || 'npm'
	}
}

/**
 * Publishes a package using the detected package manager.
 */
export function publishPackage(
	path: string,
	cfg: { args?: string[]; private?: boolean; tag?: string } = {},
): string {
	const pm = detectPackageManager(path)

	const [pkg] = readPackageJson(path)
	const args = [...(cfg.args || [])]

	if (!cfg.private && !pkg.private) args.push('--access', 'public')
	if (cfg.tag) args.push('--tag', `"${cfg.tag}"`)

	return execSync([pm, 'publish', ...args], path)
}

/**
 * Synchronously reads a `package.json` file.
 */
export function readPackageJson(
	from: string,
	options: FindFileOptions = {},
): [PackageJson, string] {
	const path = findFile(PACKAGE_JSON_FILE, { ...options, from })
	const pkgJson = readText(path)
	return [parseJsonWithFormat(pkgJson) as PackageJson, path]
}

/**
 * Resolves the path to the closest lock file from a given directory.
 */
export function resolveLockFile(from: string, options: FindFileOptions = {}): string {
	return findFile(LOCK_FILES, { ...options, from })
}

/**
 * Synchronously writes a `package.json` file.
 */
export function writePackageJson(path: string, pkg: PackageJson): void {
	writeFileSync(path, stringifyJsonWithFormat(pkg))
}
