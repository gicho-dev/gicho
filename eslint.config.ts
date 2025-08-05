import { defineConfig } from '@gicho/config/eslint'

export default defineConfig({
	ignores: {
		customIgnores: ['**/.local'],
	},

	json: {
		sortPackageJson: true,
		sortTsconfigJson: true,
	},

	svelte: false,

	ts: {
		explicitFunctionReturnType: true,

		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
})
