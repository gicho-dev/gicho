import type { ExecOptions } from 'node:child_process'

import { execSync } from 'node:child_process'

export function exec(command: string | string[], cwdOrOptions?: ExecOptions | string): string {
	const opts: ExecOptions =
		typeof cwdOrOptions === 'string' ? { cwd: cwdOrOptions } : cwdOrOptions || {}
	const cmd = Array.isArray(command) ? command.join(' ') : command

	return execSync(cmd, { encoding: 'utf8', ...opts }).trim()
}
