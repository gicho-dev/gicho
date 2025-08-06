import { glob } from 'tinyglobby'

import { removePaths } from './fs'

export interface CleanProjectOptions {
	/**
	 * Whether to clean up build outputs.
	 */
	build?: boolean
	/**
	 * Whether to clean up caches.
	 */
	cache?: boolean
	/**
	 * The working directory to clean up.
	 */
	cwd?: string
	/**
	 * Specifies extra directories to clean up.
	 */
	extraDirectories?: string[]
	/**
	 * Specifies extra files to clean up.
	 */
	extraFiles?: string[]
	/**
	 * Specifies extra project directories to clean up.
	 *
	 * @default ['apps/*', 'packages/*']
	 */
	extraPackageDirectories?: string[]
	/**
	 * Whether to clean up node_modules paths.
	 *
	 */
	nodeModules?: boolean
}

const defaultPackageDirectories = ['', 'apps/*', 'packages/*']

/**
 * Asynchronously cleans up the project with given options.
 */
export async function cleanProject(options: CleanProjectOptions = {}): Promise<void> {
	const { build, cache, cwd, extraDirectories, extraFiles, nodeModules, extraPackageDirectories } =
		options

	const withPackageDirs = (subPath: string): string[] => {
		const dirs = [...defaultPackageDirectories]
		if (extraPackageDirectories?.length) dirs.push(...extraPackageDirectories)
		return dirs.map((dir) => (dir ? `${dir}/${subPath}` : subPath))
	}

	const dirs = []
	const files = []

	if (nodeModules) {
		dirs.push(...withPackageDirs('node_modules'))
	}
	if (build) {
		dirs.push(...withPackageDirs('{.next,build,dist,storybook-static}'))
	}
	if (cache) {
		dirs.push(...withPackageDirs('{.rollup,.turbo}'))
		files.push('**/.eslintcache', '**/.tsbuildinfo')
	}

	if (extraDirectories?.length) dirs.push(...extraDirectories)
	if (extraFiles?.length) files.push(...extraFiles)

	const dirPaths = await glob(dirs, {
		cwd,
		dot: true,
		onlyDirectories: true,
		expandDirectories: false,
	})
	const filePaths = await glob(files, { cwd, dot: true, onlyFiles: true })

	await removePaths([...dirPaths, ...filePaths])
}

/**
 * Asynchronously cleans up all build outputs, caches, and node_modules paths in the project.
 */
export function cleanAll(
	options: Pick<
		CleanProjectOptions,
		'cwd' | 'extraDirectories' | 'extraFiles' | 'extraPackageDirectories'
	> = {},
): Promise<void> {
	return cleanProject({ ...options, build: true, cache: true, nodeModules: true })
}
