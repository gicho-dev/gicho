import { detectIndent } from './indent'

/* ----------------------------------------
 *   JSON
 * ------------------------------------- */

interface ParseJsonOptions extends FormatOptions {
	reviver?: (this: any, key: string, value: any) => any
}
interface StringifyJsonOptions extends FormatOptions {
	replacer?: (this: any, key: string, value: any) => any
}

export function parseJsonWithFormat<T = any>(str: string, options: ParseJsonOptions = {}): T {
	return storeFormatInfo(str, JSON.parse(str, options.reviver), options)
}

export function stringifyJsonWithFormat(val: any, options: StringifyJsonOptions = {}): string {
	const { indent, leading, trailing } = getFormatInfo(val, options)
	const str = JSON.stringify(val, options.replacer, indent)
	return `${leading}${str}${trailing}`
}

/* ----------------------------------------
 *   Format
 * ------------------------------------- */

interface FormatInfo {
	indent?: number | string
	leading?: string
	text?: string
	trailing?: string
}

interface FormatOptions {
	indent?: number | string
}

const RE_LEADING = /^\s+/
const RE_TRAILING = /\s+$/

const formatInfoSymbol = Symbol('format')

export function getFormatInfo(obj: any, opts: FormatOptions = {}): FormatInfo {
	if (!obj || typeof obj !== 'object' || !(formatInfoSymbol in obj)) {
		return { indent: opts.indent ?? 2, leading: '', trailing: '' }
	}
	const formatInfo = obj[formatInfoSymbol] as FormatInfo
	const indent = opts.indent || detectIndent(formatInfo.text || '').indent

	return { indent, leading: formatInfo.leading || '', trailing: formatInfo.trailing || '' }
}

export function storeFormatInfo<T>(str: string, obj: T, options: ParseJsonOptions): T {
	if (!obj || typeof obj !== 'object') return obj

	Object.defineProperty(obj, formatInfoSymbol, {
		configurable: true,
		enumerable: false,
		writable: true,
		value: {
			text: options.indent === undefined ? str.slice(0, 1024) : undefined,
			leading: str.match(RE_LEADING)?.[0] || '',
			trailing: str.match(RE_TRAILING)?.[0] || '',
		},
	})
	return obj
}
