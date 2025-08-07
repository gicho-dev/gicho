import { execSync } from 'node:child_process'

import { ROOT_PATH } from './root'

const execFromWorkspaceRoot = (cmd: string, completedMessage: string) => {
	execSync(cmd, { cwd: ROOT_PATH, stdio: 'inherit' })
	log(`✅ ${completedMessage}`)
}

const log = (message: string = '') => console.log(`\n${message}`)

execFromWorkspaceRoot('pnpm types', 'Type check passed.')
execFromWorkspaceRoot('pnpm build', 'Build passed.')
execFromWorkspaceRoot('pnpm test', 'Test passed.\n')

execSync('pnpm -r publish', { cwd: ROOT_PATH, stdio: 'inherit' })
