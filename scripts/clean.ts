import { cleanAll } from '../packages/cli/src/fs/clean-project'
import { log } from '../packages/cli/src/prompts/log'
import { execSync } from '../packages/cli/src/utils/exec'

await cleanAll()
log.success('Removed all build, cache, node_modules.')
execSync('pnpm i')
log.success('All dependencies installed')
