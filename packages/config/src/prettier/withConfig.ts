import type { Config } from 'prettier'

import type { ConfigName } from './configs'

import { configs } from './configs'

/**
 * Return a Prettier configuration merged with the base config.
 *
 * Base config:
 * - semi: false
 * - singleQuote: true
 *
 * @param options - Additional options to merge into the base config.
 * @returns The merged Prettier configuration.
 */
export function withBaseConfig(options: Config): Config {
	return { ...configs.base, ...options }
}

/**
 * Return a Prettier configuration merged with a shared config.
 *
 * @param configName - The name of the shared config to merge from.
 * @param options - Additional options to merge into the config.
 * @returns The merged Prettier configuration.
 */
export function withSharedConfig(configName: ConfigName, options: Config): Config {
	return { ...configs[configName], ...options }
}
