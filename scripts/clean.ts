import { cleanAll, cleanProject } from '../packages/cli/src/fs/clean-project'
import { log } from '../packages/cli/src/prompts/log'
import { exec } from '../packages/cli/src/utils/exec'

const command = process.argv[2]

switch (command) {
	case '-b':
		await cleanProject({ build: true })
		log.success('Removed all build outputs.')
		break

	default:
		await cleanAll()
		log.success('Removed all build, cache, node_modules.')
		await exec('pnpm i')
		log.success('All dependencies installed again.')
}
