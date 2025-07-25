import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			reporter: ['text', 'html', 'json'],
		},
		printConsoleTrace: true,
		snapshotSerializers: ['./tests/utils/ansi-serializer.ts'],
	},
})
