import { defineConfig } from 'tsup'

export default defineConfig({
	clean: true,
	dts: true,
	entry: {
		index: 'src/index.ts',
		...['fetch', 'is', 'object', 'types'].reduce(
			(obj, group) => {
				obj[group] = `src/${group}/index.ts`
				return obj
			},
			{} as Record<string, string>,
		),
	},
	format: ['esm'],
	outDir: 'dist',
	// shims: true,
})
