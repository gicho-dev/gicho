type LoggerLogFunction = (...message: any[]) => void

export interface LoggerOutput {
	error: LoggerLogFunction
	info: LoggerLogFunction
	log: LoggerLogFunction
	warn: LoggerLogFunction
}

export class Logger implements LoggerOutput {
	output: LoggerOutput

	constructor(output: LoggerOutput) {
		this.output = output
	}

	/** Display error messages */
	error(...messages: any[]): void {
		this.output.error(...messages)
	}

	/** Display info messages */
	info(...messages: any[]): void {
		this.output.info(...messages)
	}

	/** Display log messages */
	log(...messages: any[]): void {
		this.output.log(...messages)
	}

	/** Display warning messages */
	warn(...messages: any[]): void {
		this.output.warn(...messages)
	}
}

export const con = new Logger(console)
