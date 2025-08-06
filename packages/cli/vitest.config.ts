import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		alias: [
			{
				find: '@gicho/core',
				replacement: resolve(import.meta.dirname, '../core/src'),
			},
		],
		printConsoleTrace: true,
		snapshotSerializers: ['./tests/utils/ansi-serializer.ts'],
	},
})
