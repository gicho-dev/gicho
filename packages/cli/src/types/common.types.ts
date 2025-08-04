export interface BaseLogMethods {
	/**
	 * Display log messages.
	 * Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to `printf(3)` (the arguments are all passed to `util.format()`).
	 *
	 * @example
	 * ```ts
	 * log('Hello, world!')                 // => Hello, world!
	 * log('Add - %d + %d = %d', 2, 3, 5)   // => Add - 2 + 3 = 5
	 * ```
	 */
	log(...messages: any[]): void
	/** Display info messages */
	info(...messages: any[]): void
	/** Display warning messages */
	warn(...messages: any[]): void
	/** Display error messages */
	error(...messages: any[]): void
}
