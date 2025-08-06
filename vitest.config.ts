import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: ['packages/*'],

		coverage: {
			exclude: ['packages/*/types/**'],
			reporter: ['text', 'html', 'json'],
		},
	},
})
