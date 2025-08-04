import type { Awaitable } from '@gicho/core/types'

import type { BaseLogMethods } from '../types'
import type { CommandHelpSection, CommandOption, CommandOptionConfig, ParsedArgv } from './types'

import EventEmitter from 'node:events'

import { __DEF, __ROOT, Command } from './command'
import { CommandError, UnknownOptionError } from './error'
import { parseArgs } from './parser'

interface MatchedInfo extends ParsedArgv {
	command: Command
	commandName: string
}

const GAP = 2
const PLATFORM_INFO = `${process.platform}-${process.arch} node-${process.version}`

export class CommandCenter extends EventEmitter {
	name: string
	description?: string
	usageText?: string
	versionText: string = '0.0.0'
	rootCommand: Command
	commandMap: Record<string, Command> = {}
	matched: MatchedInfo | null = null

	private _output: BaseLogMethods = console
	private _strict: boolean = true
	_maxCommandNameDepth: number = 0

	constructor(appName: string, version: string = '0.0.0', description?: string) {
		super()
		this.name = appName
		this.versionText = version
		this.description = description

		this.rootCommand = this.command(__ROOT)

		this.option('-h, --help', 'Display help message')
		this.option('-v, --version', 'Display version number')
	}

	/**
	 * Set the output object.
	 */
	output(output: BaseLogMethods): this {
		this._output = output
		return this
	}

	/**
	 * Set whether to throw an error when an unknown option is found.
	 */
	strict(strict: boolean): this {
		this._strict = strict
		return this
	}

	/**
	 * Add a new command.
	 */
	command(name: string, description?: string): Command {
		return new Command(this, name, description)
	}

	option(name: string, description: string, config?: CommandOptionConfig): this {
		this.rootCommand.option(name, description, config)
		return this
	}

	/**
	 * Parse command line arguments.
	 *
	 * @param argv - The command line arguments (generally `process.argv`).
	 */
	parse(argv: string[] = process.argv, options: { run?: boolean } = {}): ParsedArgv {
		const { run = true } = options

		const rawArgs = argv.slice(2)

		let [command, commandName, index] = [this.commandMap[__DEF], __DEF, 0]
		const len = Math.min(this._maxCommandNameDepth, rawArgs.length) + 1
		for (let i = 1; i < len; i++) {
			const key = rawArgs.slice(0, i).join(' ')
			const cmd = this.commandMap[key]
			if (cmd) [command, commandName, index] = [cmd, key, i]
		}

		const parsed = parseArgs({
			args: index ? rawArgs.slice(index) : rawArgs,
			camelizedKey: true,
			options: { ...this.rootCommand.options, ...command.options },
			strict: this._strict,
		})

		this.matched = { command, commandName, ...parsed }
		this.emit('command', this.matched)

		if (run) this.run()

		return parsed
	}

	/** Run matched command */
	run(): Awaitable<void> {
		if (!this.matched) return
		const { args, command, options } = this.matched

		let done = false
		if (options?.version) {
			this.displayVersion()
			done = true
		}
		if (options?.help) {
			this.displayHelp()
			done = true
		}

		if (done || !command.action) return

		// Check Unknown Options
		if (this._strict) {
			for (const name in options) {
				if (name !== '--' && !command.options[name] && !this.rootCommand.options[name]) {
					throw new UnknownOptionError(`${name.length === 1 ? '-' : '--'}${name}`)
				}
			}
		}

		// Check Required Args
		const minArgsCount = command.args.filter((arg) => arg.required).length
		if (args.length < minArgsCount) {
			throw new CommandError(`Missing required arguments for command "${command.name}"`)
		}

		const actionArgs = []
		command.args.forEach((arg, i) => {
			actionArgs.push(arg.variadic ? args.slice(i) : args[i])
		})
		actionArgs.push(options)

		return command.action.apply(this, actionArgs)
	}

	displayHelp(): void {
		const { command = this.commandMap[__DEF], commandName = __DEF } = this.matched || {}
		const { commandMap, description, name, rootCommand, versionText } = this

		const helpText = generateHelpText({
			command,
			commandName,
			commandMap,
			description,
			name,
			rootCommand,
			versionText,
		})

		this._output.log(helpText)
	}

	displayVersion(): void {
		this._output.log(generateVersion(this.name, this.versionText))
	}
}

/* ----------------------------------------
 *   Internal functions
 * ------------------------------------- */

function generateHelpText({
	command,
	commandMap,
	commandName,
	description,
	name,
	rootCommand,
	versionText,
}: Pick<MatchedInfo, 'command' | 'commandName'> &
	Pick<
		CommandCenter,
		'commandMap' | 'description' | 'name' | 'rootCommand' | 'versionText'
	>): string {
	const sections: CommandHelpSection[] = [{ title: `${name} / Version ${versionText}` }]

	// Description
	const desc = command.description || description
	if (desc) sections.push({ title: desc })

	// Usage
	const usageArr = ['$', name]
	if (command.usageText) usageArr.push(command.usageText)
	else usageArr.push(command.nameText, '[options]')

	sections.push({ title: 'Usage:', body: [usageArr.join(' ')] })

	// Commands
	if (commandName === __DEF) {
		const commandsObj = Object.keys(commandMap).reduce(
			(obj, key) => {
				const cmd = commandMap[key]
				const name = cmd.name
				if (key !== name || name === __ROOT) return obj

				key = cmd.nameText
				obj[key] = cmd.description
				if (cmd.aliases.length) obj[key] += ` (aliases: ${cmd.aliases.join(', ')})`

				return obj
			},
			{} as Record<string, string>,
		)
		sections.push({ title: 'Commands:', body: toArrSectionBody(commandsObj) })
	}

	// Help info
	sections.push({
		title: 'For more info, run any command with the `--help` flag:',
		body: [
			['$', name, commandName === __DEF ? '' : commandName, '--help'].filter(Boolean).join(' '),
		],
	})

	// Options
	const { help, version, ...rootOptions } = rootCommand.options
	const mergedOptions: Record<string, CommandOption> = {
		...rootOptions,
		...command.options,
		help,
		version,
	}
	const optionsObj = Object.keys(mergedOptions).reduce(
		(obj, key) => {
			const opt = mergedOptions[key]
			if (key !== opt.name) return obj

			let nameText = [opt.short ? `-${opt.short}` : '', `--${opt.name}`].filter(Boolean).join(', ')
			if (opt.argName) nameText += ` ${opt.required ? `<${opt.argName}>` : `[${opt.argName}]`}`
			obj[nameText] = opt.description || ''
			return obj
		},
		{} as Record<string, string>,
	)
	sections.push({ title: 'Options:', body: toArrSectionBody(optionsObj) })

	// Examples
	if (command.examples.length) {
		sections.push({ title: 'Examples:', body: command.examples })
	}

	// Output
	const SPACES = ' '.repeat(GAP)
	return sections
		.filter((v) => v.title || v.body)
		.map((section) => {
			const { title, body } = section
			return [title, body?.length ? `${SPACES}${body.join(`\n${SPACES}`)}` : '']
				.filter(Boolean)
				.join('\n')
		})
		.join('\n\n')
}

function generateVersion(name: string, version: string): string {
	return `${name}/${version} ${PLATFORM_INFO}`
}

function toArrSectionBody(obj: Record<string, string>): string[] {
	const keys = Object.keys(obj)
	const maxLen = keys.reduce((max, key) => Math.max(max, key.length), 0) + GAP
	return keys.map((key) => key.padEnd(maxLen, ' ') + obj[key])
}
