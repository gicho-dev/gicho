import { execSync } from 'node:child_process'

import { ROOT_PATH } from './root'

const execFromWorkspaceRoot = (cmd: string, completedMessage: string) => {
	execSync(cmd, { cwd: ROOT_PATH, stdio: 'inherit' })
	log(`✅ ${completedMessage}`)
}

const log = (message: string = '') => console.log(`\n${message}`)

/* ---------- Run ---------- */

execFromWorkspaceRoot('pnpm types', 'Type check passed.')
execFromWorkspaceRoot('pnpm build', 'Build passed.')
execFromWorkspaceRoot('pnpm test', 'Test passed.\n')

const cmd = process.argv[2]
switch (cmd) {
	case 'next':
		execFromWorkspaceRoot('pnpm -r publish --tag next', 'Published next tagged version.')
		break
	default:
		execFromWorkspaceRoot('pnpm -r publish', 'Published latest tagged version.')
}
