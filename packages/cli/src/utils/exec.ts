import type { ExecOptions } from 'node:child_process'

import { execSync as _execSync } from 'node:child_process'

export function execSync(command: string | string[], cwdOrOptions?: ExecOptions | string): string {
	const opts: ExecOptions =
		typeof cwdOrOptions === 'string' ? { cwd: cwdOrOptions } : cwdOrOptions || {}
	const cmd = Array.isArray(command) ? command.join(' ') : command

	return _execSync(cmd, { encoding: 'utf8', ...opts }).trim()
}
