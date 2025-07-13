import { defineConfig } from 'tsdown'

export default defineConfig({
	dts: true,
	entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
	unbundle: true,
})
