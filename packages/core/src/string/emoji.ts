/**
 * Returns the emoji regular expression.
 *
 * @example
 * ```
 * console.log(getEmojiRegex().test('😀'));  //=> true
 * ```
 */
export function getEmojiRegex(): RegExp {
	// Ref: https://github.com/slevithan/emoji-regex-xs/blob/ec9bc4f7fe4e42b447af2af8327accef4714705a/regex.mjs
	// License: MIT by Steven Levithan
	const base = `\\p{Emoji}(?:\\p{EMod}|[\\u{E0020}-\\u{E007E}]+\\u{E007F}|\\uFE0F?\\u20E3?)`
	return new RegExp(`\\p{RI}{2}|(?![#*\\d](?!\\uFE0F?\\u20E3))${base}(?:\\u200D${base})*`, 'gu')
}
