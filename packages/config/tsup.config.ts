import { defineConfig } from 'tsup'

export default defineConfig({
	clean: true,
	dts: true,
	entry: { eslint: 'src/eslint/index.ts', prettier: 'src/prettier/index.ts' },
	format: ['esm'],
	outDir: 'dist',
	// shims: true,
})
