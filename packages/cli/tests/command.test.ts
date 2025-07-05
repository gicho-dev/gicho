import type { ParsedArgv } from '../src/command'

import { describe, expect, test } from 'vitest'

import { CommandCenter } from '../src/command'
import { __DEF, __ROOT } from '../src/command/command'

describe('command', () => {
	test('new CommandCenter', () => {
		const cm = new CommandCenter('test-cli', '1.0.0', 'Test CLI Program')

		cm.command('').option('-t, --time', 'Time description')

		cm.command('build <entry> [tag] [...files]', 'Build the project')
			.alias('b')
			.option('-t, --tag', 'Tag to build')
			.option('--cheese, --c [what]', 'Cheese description', { default: 'cream' })
			.option('-s, --salad', 'Salad description')
			.option('-s, --salad2', 'Salad2 description')
			.option('--no-cheese', 'No cheese description')

		cm.command('todo add <name>', 'Add a new task')

		expect(Object.keys(cm.commandMap)).toEqual([__ROOT, __DEF, 'build', 'b', 'todo add'])

		const { build } = cm.commandMap
		expect(build.name).toEqual('build')
		expect(build.description).toEqual('Build the project')
		expect(build.aliases).toEqual(['b'])
		expect(build.args).toEqual([
			{ name: 'entry', required: true },
			{ name: 'tag' },
			{ name: 'files', variadic: true },
		])

		expect(Object.keys(build.options)).toEqual(['tag', 'cheese', 'salad', 'salad2', 'no-cheese'])

		expect(build.options.tag).toEqual({
			name: 'tag',
			description: 'Tag to build',
			short: 't',
			type: 'b',
		})
		expect(build.options.cheese).toEqual({
			name: 'cheese',
			argName: 'what',
			description: 'Cheese description',
			default: 'cream',
			short: 'c',
		})
		expect(build.options.salad).toEqual({
			name: 'salad',
			description: 'Salad description',
			short: 's',
			type: 'b',
		})
		expect(build.options['no-cheese']).toEqual({
			name: 'no-cheese',
			description: 'No cheese description',
			type: 'b',
		})
		cm.strict(false)

		_parse(cm, ['--flag'])
		expect(cm.matched?.commandName).toEqual('_')
		expect(cm.matched?.options).toEqual({ '--': [], flag: true })
		_parse(cm, ['-v'])
		expect(cm.matched?.options).toEqual({ '--': [], v: true, version: true })
		cm.displayHelp()
		_parse(cm, ['build', '-c'])
		expect(cm.matched?.commandName).toEqual('build')
		expect(cm.matched?.options).toEqual({ '--': [], c: 'cream', cheese: 'cream' })
		_parse(cm, ['build', '--cheese'])
		expect(cm.matched?.options).toEqual({ '--': [], c: 'cream', cheese: 'cream' })

		_parse(cm, ['build', '-c', 'new1'])
		expect(cm.matched?.options).toEqual({ '--': [], c: 'new1', cheese: 'new1' })

		_parse(cm, ['build', '--help', '--no-cheese', 'haha'])
		expect(cm.matched?.commandName).toEqual('build')
		expect(cm.matched?.args).toEqual(['haha'])
		expect(cm.matched?.options).toEqual({ '--': [], c: false, cheese: false, h: true, help: true })

		_parse(cm, ['todo', 'add', 'Some text', '--fake'])
		expect(cm.matched?.commandName).toEqual('todo add')
		expect(cm.matched?.args).toEqual(['Some text'])
		expect(cm.matched?.options).toEqual({ '--': [], fake: true })
	})
})

function _parse(cm: CommandCenter, args: string[]): ParsedArgv {
	return cm.parse(['', '', ...args], { run: false })
}
