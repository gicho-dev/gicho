import type { Awaitable } from '@gicho/core/types'

import type { CommandCenter } from './center'
import type { CommandArgument, CommandOption, CommandOptionConfig } from './types'

import { CommandError, InvalidCommandError } from './error'

export const __DEF = '_'
export const __ROOT = '*'

const RE_SPACES = /\s+/g
const RE_ARG_NAME = /^([<[])?(\.{3})?([a-z][a-z0-9-]*)[>\]]?$/i
const RE_OPT_NAME = /^-{0,2}([a-z][a-z0-9-]*),?$/i
const RE_OPT_ARG_NAME = /^([<[])([a-z][a-z0-9-]*)[>\]]$/i

export class Command {
	$: CommandCenter
	name: string
	nameText: string
	description: string
	aliases: string[] = []
	args: CommandArgument[]
	examples: string[] = []
	options: Record<string, CommandOption> = {}
	usageText?: string
	action?: (...args: any[]) => Awaitable<void>

	constructor(c: CommandCenter, nameText: string, description: string = '') {
		this.$ = c

		const { args, name, names } = parseCommandName(nameText)

		this.name = name
		this.args = args
		this.description = description

		this.nameText = generateNameText(name, args)

		if (c._maxCommandNameDepth < names.length) c._maxCommandNameDepth = names.length

		c.commandMap[name] = this
	}

	alias(...names: string[]): this {
		const { $, aliases, name } = this

		for (const alias of names) {
			if (alias === name) {
				throw new InvalidCommandError('alias', `"${alias}" must be different from command name`)
			}
			if (alias === '*') throw new InvalidCommandError('alias', `"*" is reserved for root command`)

			$.commandMap[alias] = this
			aliases.push(alias)
		}

		return this
	}

	example(example: string): this {
		this.examples.push(example)
		return this
	}

	option(nameText: string, description?: string, config?: CommandOptionConfig): this {
		const option: CommandOption = {
			...parseOptionName(nameText),
			...config,
			description,
		}

		if (!option.argName && !option.type) option.type = 'b'

		this.options[option.name] = option
		return this
	}

	usage(usage: string): this {
		this.usageText = usage
		return this
	}
}

/* ----------------------------------------
 *   Internal functions
 * ------------------------------------- */

function generateNameText(name: string, args: CommandArgument[]): string {
	const arr = [
		name === __DEF ? '' : name,
		...args.map((arg) => {
			const variadic = arg.variadic ? '...' : ''
			return arg.required ? `<${variadic}${arg.name}>` : `[${variadic}${arg.name}]`
		}),
	]
	return arr.filter(Boolean).join(' ') || '<command>'
}

function parseArgumentName(raw: string): Pick<CommandArgument, 'name' | 'required' | 'variadic'> {
	const [, open, dots, name] = raw.replace(RE_SPACES, '').match(RE_ARG_NAME) || []
	if (!name) throw new Error(`Invalid argument name: "${raw}"`)

	const result: Pick<CommandArgument, 'name' | 'required' | 'variadic'> = { name }
	if (open === '<') result.required = true
	if (dots) result.variadic = true

	return result
}

function parseCommandName(raw: string): { name: string; names: string[]; args: CommandArgument[] } {
	let index = -1
	for (let i = 0; i < raw.length; i++) {
		const c = raw[i]
		if (c === '<' || c === '[') {
			index = i
			break
		}
	}
	const found = index > -1

	let name = (found ? raw.slice(0, index) : raw).trim()
	if (!name) name = __DEF

	const args = found ? raw.slice(index).split(/\s+/).map(parseArgumentName) : []

	const names = name.split(/\s+/)

	return { name, names, args }
}

function parseOptionName(raw: string): CommandOption {
	const rawNames = raw.split(RE_SPACES)
	const result: Pick<CommandOption, 'name' | 'argName' | 'required' | 'short'> = { name: '' }

	const last = rawNames.at(-1)
	if (last && (last.startsWith('<') || last.startsWith('['))) {
		const [, open, name] = last.match(RE_OPT_ARG_NAME) || []
		if (!name) throw new CommandError(`Invalid option argument name: "${last}"`)
		result.argName = name
		if (open === '<') result.required = true
		rawNames.pop()
	}

	for (const rawName of rawNames) {
		const [, name] = rawName.match(RE_OPT_NAME) || []
		if (!name) throw new CommandError(`Invalid option name: "${rawName}"`)

		if (name.length === 1) result.short = name
		else result.name = name

		// if (name.startsWith('no-')) {
		// 	result.names.push(name.slice(3))
		// 	result.negated = true
		// } else {
		// 	result.names.push(name)
		// }
	}

	if (!result.name) throw new Error(`Invalid option name: "${raw}"`)

	return result
}
