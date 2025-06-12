import { config } from './packages/config/src/eslint'

export default config({
	disables: {
		prettier: true,
	},

	ignores: {
		customIgnores: ['**/.local'],
	},

	json: {
		sortPackageJson: true,
		sortTsconfigJson: true,
	},

	typescript: {
		rules: {
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{ allowExpressions: true, allowHigherOrderFunctions: true, allowIIFEs: true },
			],
		},
	},
})
