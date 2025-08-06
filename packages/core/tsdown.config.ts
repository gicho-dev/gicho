import { defineConfig } from 'tsdown'

import { baseConfig } from '../../scripts/build/tsdown.config.base'

const groups = ['fetch', 'is', 'object', 'string', 'types']

export default defineConfig({
	...baseConfig(groups),
})
