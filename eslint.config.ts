import { defineConfig } from '@gicho/config/eslint'

export default defineConfig({
	ignores: {
		customIgnores: ['**/.local'],
	},

	json: {
		sortPackageJson: true,
		sortTsconfigJson: true,
	},

	regexp: {
		onFinalize(items) {
			items[0].ignores = ['packages/core/src/string/emoji.ts']
			return items
		},
	},

	svelte: false,

	ts: {
		explicitFunctionReturnType: true,

		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
})
