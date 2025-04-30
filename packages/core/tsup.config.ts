import { defineConfig } from 'tsup'

export default defineConfig({
	clean: true,
	dts: true,
	entry: { eslint: 'src/index.ts' },
	format: ['esm'],
	outDir: 'dist',
	// shims: true,
})
