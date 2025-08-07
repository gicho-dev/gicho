/**
 * Asynchronously waits for the specified duration in milliseconds.
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Asynchronously waits for the specified duration in seconds.
 */
export function waitSeconds(seconds: number): Promise<void> {
	return wait(seconds * 1000)
}
