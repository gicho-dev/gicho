import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			include: ['src/**/*.ts'], // 기본적으로 포함
			exclude: ['src/types/**'],
			reporter: ['text', 'html', 'json'],
		},
		printConsoleTrace: true,
	},
})
