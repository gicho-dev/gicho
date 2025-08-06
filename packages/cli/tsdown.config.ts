import { defineConfig } from 'tsdown'

const groups = ['cli', 'command', 'path', 'prompts', 'terminal', 'version']

export default defineConfig({
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
})

// export default defineConfig({
// 	dts: true,
// 	entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
// 	unbundle: true,
// })
