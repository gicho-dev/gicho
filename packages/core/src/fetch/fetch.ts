import type { RequiredByKeys } from '../types'
import type {
	FetchClient,
	FetchClientOptions,
	FetchContext,
	FetchDataFn,
	FetchInput,
	FetchOptions,
	FetchResponse,
	FetchResponseBodyDataMethods,
	HttpMethodLowercase,
	ResponseBodyType,
	ResponseData,
} from './types'

import { REQUEST_METHODS } from './constants'
import { FetchError } from './error'
import { appendTimeoutSignal, callHooks, resolveRequestAndOptions } from './utils'

const BODYLESS_STATUS_CODES = new Set([204, 205, 304])
const RETRY_STATUS_CODES = new Set([408, 413, 429, 500, 502, 503, 504])

const RESPONSE_BODY_TYPES: ResponseBodyType[] = [
	'arrayBuffer',
	'blob',
	'formData',
	'json',
	'stream',
	'text',
]

export function createFetchClient(globalOptions: FetchClientOptions = {}): FetchClient {
	const onError = async (c: FetchContext): Promise<FetchResponse> => {
		const { error: err, options: opts, response: res } = c

		const isAbortError = err?.name === 'AbortError' && !opts.timeout

		if (opts.retry && !isAbortError) {
			const retries: number = opts.retry ?? 0
			const status = res?.status || 500

			if (
				retries > 0 &&
				(Array.isArray(opts.retryStatusCodes)
					? opts.retryStatusCodes.includes(status)
					: RETRY_STATUS_CODES.has(status))
			) {
				const retryDelayMs = opts.retryDelay?.(c, opts._retryCount + 1) || 0
				if (retryDelayMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
				}

				return _fetch(c.request, { ...c.options, retry: retries - 1 })
			}
		}

		throw new FetchError(c)
	}

	async function _fetch(
		input: FetchInput,
		options: FetchOptions = {},
		resType?: ResponseBodyType,
	): Promise<FetchResponse<ResponseData<any>>> {
		const c = resolveRequestAndOptions(globalOptions, input, options)

		const abortTimeoutId = appendTimeoutSignal(c.request, c.options)

		const { onRequest, onRequestError, onResponse, onResponseError } = c.options

		if (onRequest) {
			await callHooks(onRequest, c)
		}

		try {
			c.response = await c.options.fetch(c.request, c.options)
		} catch (err) {
			c.error = err as Error

			if (onRequestError) {
				await callHooks(onRequestError, c as RequiredByKeys<FetchContext, 'error'>)
			}

			return await onError(c)
		} finally {
			if (abortTimeoutId) clearTimeout(abortTimeoutId)
		}

		const { response: res } = c

		// Override json() method (using parseJson option)
		res.json = async () => c.options.parseJson(await res.text())

		if (resType) {
			const hasBody =
				res.body && !BODYLESS_STATUS_CODES.has(res.status) && c.options.method !== 'HEAD'
			if (hasBody) {
				res.data = resType === 'stream' ? res.body : await res[resType]()
			}
		}

		if (onResponse) {
			await callHooks(onResponse, c as RequiredByKeys<FetchContext, 'response'>)
		}

		if (res.status >= 400 && res.status < 600) {
			if (onResponseError) {
				await callHooks(onResponseError, c as RequiredByKeys<FetchContext, 'response'>)
			}

			return await onError(c)
		}

		return res
	}

	const client = {
		create: (clientOptions) => createFetchClient({ ...globalOptions, ...clientOptions }),
		fetch: _fetch,
	} as FetchClient

	for (const resType of RESPONSE_BODY_TYPES) {
		client.fetch[resType] = (async (input, options) => {
			return (await _fetch(input, options, resType)).data
		}) as FetchDataFn<any>
	}

	for (const method of REQUEST_METHODS) {
		const m = method.toLowerCase() as HttpMethodLowercase

		client[m] = (async (input, options = {}) => {
			options.method = method
			return await _fetch(input, options)
		}) as FetchResponseBodyDataMethods

		for (const resType of RESPONSE_BODY_TYPES) {
			client[m][resType] = (async (input, options = {}) => {
				options.method = method
				return (await _fetch(input, options, resType)).data
			}) as FetchDataFn<any>
		}
	}

	return client
}
