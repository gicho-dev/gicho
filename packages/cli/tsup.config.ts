import { defineConfig } from 'tsup'

export default defineConfig({
	clean: true,
	dts: true,
	entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
	format: ['esm'],
	outDir: 'dist',
})
