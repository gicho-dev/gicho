import type { Arrayable, Awaitable } from '@gicho/core/types'

export interface Command {
	name: string
	description: string
	aliases: string[]
	args: CommandArgument[]
	options: CommandOption[]
	action?: (...args: any[]) => Awaitable<void>
}

export interface CommandArgument {
	name: string
	required?: boolean
	variadic?: boolean
}

export interface CommandOption {
	name: string
	argName?: string
	description?: string
	default?: CommandOptionValue
	// negated?: boolean
	required?: boolean
	short?: string
	type?: CommandOptionTypeCode
}

export interface CommandOptionConfig {
	default?: CommandOptionValue
	type?: CommandOptionTypeCode
}

export interface CommandOptionRecord {
	'--': string[]
	[key: string]: CommandOptionValue
}

export type CommandArgValue = number | string
export type CommandOptionValue = Arrayable<boolean | number | string>
export type CommandOptionTypeCode = 'b' | 's'

export interface CommandHelpSection {
	title?: string
	body?: string[]
}

export interface ParsedArgv {
	args: CommandArgValue[]
	options: CommandOptionRecord
}
