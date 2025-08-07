import { defineConfig } from 'tsdown'

import { baseConfig } from '../../scripts/build/tsdown.config.base'

const groups = ['cli', 'command', 'path', 'project', 'prompts', 'terminal', 'version']

export default defineConfig({
	...baseConfig(groups),
})
