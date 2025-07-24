// Inspired by:
//   - https://github.com/sindresorhus/get-east-asian-width (MIT License)
//   - https://github.com/sindresorhus/string-width (MIT License)

import type { EastAsianWidthType } from './width.internal'

import { getEmojiRegex } from './emoji'
import { getWidthType, isAmbiguous, isFullWidth, isWide } from './width.internal'

export { type EastAsianWidthType } from './width.internal'

/* ----------------------------------------
 *   East Asian Width
 * ------------------------------------- */

/**
 * Returns the width as a number of the given code point.
 *
 * @param codePoint - A Unicode code point.
 *
 * @example
 * ```
 * console.log(getEastAsianWidth('字'.codePointAt(0)));  //=> 2
 * ```
 */
export function getEastAsianWidth(codePoint: number, opts: GetStringWidthOptions = {}): 1 | 2 {
	const cp = codePoint
	return isFullWidth(cp) || isWide(cp) || (opts.ambiguousAsWide && isAmbiguous(cp)) ? 2 : 1
}

/**
 * Returns the type of “East Asian Width” for the given code point.
 *
 * @param codePoint - A Unicode code point.
 *
 * @example
 * ```
 * console.log(getEastAsianWidthType('字'.codePointAt(0)));  //=> 'W' (wide)
 * ```
 */
export function getEastAsianWidthType(codePoint: number): EastAsianWidthType {
	return getWidthType(codePoint)
}

/* ----------------------------------------
 *   String Width
 * ------------------------------------- */

const defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u
const segmenter = new Intl.Segmenter()

export interface GetStringWidthOptions {
	/**
	 * Count [ambiguous width characters](https://www.unicode.org/reports/tr11/#Ambiguous)
	 * as having wide width (count of 2) instead of narrow width (count of 1).
	 *
	 * > Ambiguous characters behave like narrow or wide characters depending on the context
	 * (language tag, script identification, associated font, source of data, or explicit markup;
	 * all can provide the context).
	 * __If the context cannot be established reliably, they should be treated as narrow characters by default.__
	 * (http://www.unicode.org/reports/tr11/)
	 *
	 * @default false
	 */
	ambiguousAsWide?: boolean
}

/**
 * Get the visual width of a string - the number of columns required to display it.
 *
 * Some Unicode characters are [fullwidth](https://en.wikipedia.org/wiki/Halfwidth_and_fullwidth_forms) and use double the normal width. [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code) are stripped and doesn't affect the width.
 *
 * @example
 * ```
 * getStringWidth('a');  //=> 1
 * getStringWidth('古'); //=> 2
 * getStringWidth('안녕'); //=> 4
 *
 * import { stripVTControlCharacters } from 'node:util'
 * getStringWidth(stripVTControlCharacters('\u001B[1m古\u001B[22m')); //=> 2
 * ```
 */
export function getStringWidth(str: string, opts: GetStringWidthOptions = {}): number {
	if (!str) return 0

	const { ambiguousAsWide } = opts

	let width = 0
	for (const segmentObj of segmenter.segment(str)) {
		const char = segmentObj.segment
		const cp = char.codePointAt(0) as number

		// ignore control characters
		if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f)) continue

		// ignore zero-width characters
		// -- Zero-width space, non-joiner, joiner, left-to-right mark, right-to-left mark
		// -- Zero-width no-break space
		if ((cp >= 0x20_0b && cp <= 0x20_0f) || cp === 0xfe_ff) continue

		// ignore combining characters
		if (
			(cp >= 0x3_00 && cp <= 0x3_6f) || // Combining diacritical marks
			(cp >= 0x1a_b0 && cp <= 0x1a_ff) || // Combining diacritical marks extended
			(cp >= 0x1d_c0 && cp <= 0x1d_ff) || // Combining diacritical marks supplement
			(cp >= 0x20_d0 && cp <= 0x20_ff) || // Combining diacritical marks for symbols
			(cp >= 0xfe_20 && cp <= 0xfe_2f) // Combining half marks
		) {
			continue
		}

		// ignore surrogate pairs
		if (cp >= 0xd8_00 && cp <= 0xdf_ff) continue
		// ignore variation selectors
		if (cp >= 0xfe_00 && cp <= 0xfe_0f) continue

		// this covers some of the above cases, but still keep them for performance reasons.
		if (defaultIgnorableCodePointRegex.test(char)) continue

		if (getEmojiRegex().test(char)) {
			width += 2
			continue
		}

		width += getEastAsianWidth(cp, { ambiguousAsWide })
	}

	return width
}
