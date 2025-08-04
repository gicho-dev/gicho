// Inspired by `pkg-types`
// https://github.com/unjs/pkg-types/blob/main/src/resolve/utils.ts

import type { Arrayable } from '@gicho/core/types'

import { statSync } from 'node:fs'

import { join, resolve } from '../path'

export interface FindFileOptions {
	farthestFirst?: boolean
	rootPattern?: RegExp
	from?: string
	test?: (path: string) => boolean | undefined
}

const defaultOptions: Required<FindFileOptions> = {
	farthestFirst: false,
	rootPattern: /^node_modules$/,
	from: '.',
	test: (path) => {
		try {
			if (statSync(path).isFile()) return true
		} catch {}
	},
}

/**
 * Asynchronously finds a file by name,
 * starting from `startPath` and traversing up (or down if `farthestFirst` is true).
 */
export function findFile(file: Arrayable<string>, options: FindFileOptions = {}): string {
	const files = Array.isArray(file) ? file : [file]
	const { farthestFirst, rootPattern, from, test } = { ...defaultOptions, ...options }

	const basePath = resolve(from)
	const segments = basePath.split('/').filter(Boolean)
	const isAbsolutePath = basePath[0] === '/'

	if (files.includes(segments.at(-1)!) && test(basePath)) return basePath

	if (isAbsolutePath) segments[0] = `/${segments[0]}`

	let rootIndex = segments.findIndex((r) => r.match(rootPattern))
	if (rootIndex === -1) rootIndex = 0

	if (farthestFirst) {
		for (let i = rootIndex + 1; i <= segments.length; i++) {
			for (const file of files) {
				const path = join(...segments.slice(0, i), file)
				if (test(path)) return path
			}
		}
	} else {
		for (let i = segments.length; i > rootIndex; i--) {
			for (const file of files) {
				const path = join(...segments.slice(0, i), file)
				if (test(path)) return path
			}
		}
	}

	throw new Error(`Cannot find matching ${file} in ${from} or ascendant directories`)
}
