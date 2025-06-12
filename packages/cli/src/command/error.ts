export class CommandError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'CommandError'
	}
}

export class InvalidCommandError extends Error {
	constructor(source: string, desc: string) {
		super(`Invalid ${source}: ${desc}`)
		this.name = 'CommandInvalidError'
	}
}

export class UnknownOptionError extends Error {
	constructor(option: string) {
		super(`Unknown option: ${option}`)
		this.name = 'UnknownOptionError'
	}
}
