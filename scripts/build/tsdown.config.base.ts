import type { UserConfig } from 'tsdown'

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { color } from '../../packages/cli/src/terminal/ansi'
import { formatFileWithPrettier } from '../../packages/cli/src/utils/prettier'

export function baseConfig(groups: string[]): UserConfig {
	return {
		dts: true,
		unbundle: true,

		entry: {
			index: 'src/index.ts',

			...groups.reduce(
				(obj, group) => {
					obj[group] = `src/${group}/index.ts`
					return obj
				},
				{} as Record<string, string>,
			),
		},

		exports: {
			customExports(exports, ctx) {
				if (ctx.isPublish) return exports

				for (const key in exports) {
					if (key.endsWith('.json')) continue

					const obj = exports[key]
					const js = obj.default as string
					delete obj.default

					obj.types = `${js.slice(0, -2)}d.ts`
					obj.default = js
				}

				return exports
			},
			devExports: 'source',
		},

		onSuccess() {
			removePublishConfigExports()
			console.log(`${color.green('✔︎')} Deleted publishConfig.exports field in package.json`)
		},
	}
}

function removePublishConfigExports() {
	const cwd = process.cwd()
	const pkgFile = join(cwd, 'package.json')

	const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))

	if (!pkg.publishConfig || !pkg.publishConfig.exports) return

	delete pkg.publishConfig.exports
	if (!Object.keys(pkg.publishConfig).length) delete pkg.publishConfig

	writeFileSync(pkgFile, JSON.stringify(pkg, undefined, 2))
	formatFileWithPrettier(pkgFile)
}
