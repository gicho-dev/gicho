/**
 * Check if the given function has multiple call signatures.
 */
export type HasMultipleCallSignatures<T extends (...arguments_: any[]) => unknown> = T extends {
	(...arguments_: infer A): unknown
	(...arguments_: infer B): unknown
}
	? B extends A
		? A extends B
			? false
			: true
		: true
	: false
