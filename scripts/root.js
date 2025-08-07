/*
 * Root path of the repository (general/monorepo)
 */

import { resolve } from 'node:path/posix'

const _dirname = import.meta ? import.meta.dirname : __dirname

export const ROOT_PATH = resolve(_dirname, '../')

/**
 * Return the resolved root path of the repository
 *
 * @param  {...string} paths
 * @returns {string} The resolved root path
 */
export const rootPath = (...paths) => resolve(ROOT_PATH, ...paths)
