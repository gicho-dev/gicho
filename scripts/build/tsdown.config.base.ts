import type { UserConfig } from 'tsdown'

import { readPackageJson, writePackageJson } from '../../packages/cli/src/project/package'
import { color } from '../../packages/cli/src/terminal/ansi'

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

async function removePublishConfigExports() {
	const [pkg, pkgPath] = readPackageJson(process.cwd())

	if (!pkg.publishConfig || !pkg.publishConfig.exports) return

	delete pkg.publishConfig.exports
	if (!Object.keys(pkg.publishConfig).length) delete pkg.publishConfig

	writePackageJson(pkgPath, pkg)
}
