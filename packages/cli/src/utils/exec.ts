import type { ExecSyncOptions } from 'node:child_process'

import { exec as _exec, execSync as _execSync } from 'node:child_process'
import { promisify } from 'node:util'

export const exec = promisify(_exec)

export function execSync(
	command: string | string[],
	cwdOrOptions?: ExecSyncOptions | string,
): string {
	const opts: ExecSyncOptions =
		typeof cwdOrOptions === 'string' ? { cwd: cwdOrOptions } : cwdOrOptions || {}
	const cmd = Array.isArray(command) ? command.join(' ') : command

	return _execSync(cmd, { encoding: 'utf8', ...opts }).toString()
}

export function execCommandSync(command: string | string[], options?: ExecSyncOptions): string {
	const cmd = Array.isArray(command) ? command.join(' ') : command
	return _execSync(cmd, { encoding: 'utf8', ...options })
		.toString()
		.trim()
}
