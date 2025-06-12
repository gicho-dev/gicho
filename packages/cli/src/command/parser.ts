import type {
	CommandArgValue,
	CommandOption,
	CommandOptionRecord,
	CommandOptionTypeCode,
	ParsedArgv,
} from './types'

import { UnknownOptionError } from './error'

export interface ParseArgsConfig {
	/** Argument array */
	args: string[]
	camelizedKey?: boolean
	/** Options object */
	options?: Record<string, Partial<CommandOption>>
	/** Whether to throw an error when an unknown option is found. @default true */
	strict?: boolean
}

/**
 * Parse argument options (process.argv.slice(n))
 *
 * @param config - Configuration
 */
export function parseArgs(config: ParseArgsConfig): ParsedArgv {
	const { args, camelizedKey, options: origOptions = {}, strict = true } = config

	const opts: Record<string, CommandOption> = {}

	for (const key of Object.keys(origOptions)) {
		const opt = (opts[key] = { ...origOptions[key], name: key })

		if (opt.short) {
			if (opt.short.length !== 1) throw new Error('`short` must be a single character')
			opts[opt.short] = opt
		}

		const type = typeof opt.default
		const typeCode = type === 'string' ? 's' : type === 'boolean' ? 'b' : undefined
		opt.type = typeCode
	}

	const a: string[] = []
	const o: CommandOptionRecord = { '--': [] }

	const optKeysSet = new Set(Object.keys(opts))
	const argsLen = args.length

	for (let i = 0; i < argsLen; i++) {
		const arg = args[i]

		if (arg === '--') {
			o['--'] = [...o['--'], ...args.slice(i + 1)]
			break
		}

		let namePos = 0
		while (arg[namePos] === '-') namePos += 1

		if (namePos === 0) {
			a.push(arg)
		} else if (arg.slice(namePos, namePos + 3) === 'no-') {
			const name = arg.slice(namePos + 3)
			if (strict && !optKeysSet.has(name)) throw new UnknownOptionError(arg)
			o[name] = false
		} else {
			const dashPrefix = arg.slice(0, namePos)
			let eqPos = arg.indexOf('=', namePos + 1)
			if (eqPos === -1) eqPos = arg.length

			const name = arg.slice(namePos, eqPos)
			const val =
				arg.slice(eqPos + 1) || i + 1 === argsLen || args[i + 1]?.startsWith('-') || args[++i]

			const names = namePos === 1 ? name : [name]

			for (let j = 0; j < names.length; j++) {
				const name = names[j]
				if (strict && !optKeysSet.has(name)) throw new UnknownOptionError(dashPrefix + name)

				const value = j + 1 < names.length || val
				const type = opts[name]?.type

				const orig = o[name]
				const next = getNextValue(value, type, a)

				if (orig == null) o[name] = next
				else if (Array.isArray(orig)) orig.push(next)
				else o[name] = [orig, next]
			}
		}
	}

	for (const key of optKeysSet) {
		const defValue = opts[key].default
		if (defValue && (o[key] == null || o[key] === '')) o[key] = defValue
	}

	for (const key in o) {
		const { name, short } = opts[key] || {}

		if (name && name !== key) o[name] = o[key]
		if (short && short !== key) o[short] = o[key]
	}

	if (camelizedKey) {
		for (const key in o) o[kebabToCamelCase(key)] = o[key]
	}

	return { args: a, options: o }
}

/* ----------------------------------------
 *   Internal functions
 * ------------------------------------- */

function getNextValue(
	v: any,
	type: CommandOptionTypeCode | undefined,
	args: CommandArgValue[],
): boolean | number | string {
	if (type === 's') return v == null || v === true ? '' : String(v)

	if (typeof v === 'boolean') return v

	if (type === 'b') {
		if (v === 'false') return false
		if (v === 'true') return true

		args.push(numOrStr(v))
		return !!v
	}

	return numOrStr(v)
}

function kebabToCamelCase(str: string): string {
	return str.replace(/-([a-z])/g, (_, s1) => s1.toUpperCase())
}

function numOrStr(v: string): number | string {
	const n = Number(v)
	return isNaN(n) ? v : n
}
