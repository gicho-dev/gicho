import type { LiteralUnion } from '../types'
import type {
	ArrayableFetchHook,
	FetchClientOptions,
	FetchContext,
	FetchInput,
	FetchOptions,
	HttpMethod,
	HttpPayloadableMethod,
	ResolvedFetchOptions,
} from './types'

import { toURLSearchParams } from '../url'
import { FetchTimeoutError } from './error'

const PAYLOAD_METHODS = new Set<HttpPayloadableMethod>(['POST', 'PATCH', 'PUT', 'DELETE'])

export function anyAbortSignal(signals: AbortSignal[]): AbortSignal {
	// Safari 17.4+
	if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals)
	if (signals.length === 1) return signals[0]

	const controller = new AbortController()

	function onAbort(this: AbortSignal): void {
		controller.abort(this.reason)
		for (const signal of signals) signal.removeEventListener('abort', onAbort)
	}

	for (const signal of signals) {
		if (signal.aborted) {
			controller.abort(signal.reason)
			break
		}
		signal.addEventListener('abort', onAbort)
	}

	return controller.signal
}

export function appendTimeoutSignal(
	request: Request,
	options: FetchOptions,
): number | NodeJS.Timeout | undefined {
	const { timeout } = options
	if (!timeout) return undefined

	const controller = new AbortController()

	const timeoutId = setTimeout(() => {
		controller.abort(new FetchTimeoutError(request))
	}, timeout)

	options.signal = options.signal
		? anyAbortSignal([options.signal, controller.signal])
		: controller.signal

	return timeoutId
}

export async function callHooks<TContext extends FetchContext>(
	hooks: ArrayableFetchHook<TContext>,
	context: TContext,
): Promise<void> {
	if (Array.isArray(hooks)) {
		for (const hook of hooks) await hook(context)
	} else {
		await hooks(context)
	}
}

export function canHaveBody(method: LiteralUnion<HttpMethod, string>): boolean {
	return PAYLOAD_METHODS.has(method.toUpperCase() as HttpPayloadableMethod)
}

export function isJSONSerializable(x: unknown): boolean {
	if (x === undefined) return false

	const t = typeof x
	if (t === 'string' || t === 'number' || t === 'boolean' || x === null) return true
	if (t !== 'object') return false // bigint, symbol, function

	if (Array.isArray(x)) return true
	if ((x as any).buffer) return false

	return x.constructor?.name === 'Object' || typeof (x as any).toJSON === 'function'
}

export function resolveRequestAndOptions<TData = any>(
	rootOpts: FetchClientOptions,
	input: FetchInput,
	opts: FetchOptions,
): FetchContext<TData> {
	const inputHeaders = opts?.headers ?? (input as Request)?.headers

	// Resolve headers
	let headers: Headers
	if (rootOpts.headers) {
		headers = new Headers(rootOpts.headers)
		if (inputHeaders) {
			for (const [key, value] of Symbol.iterator in inputHeaders || Array.isArray(inputHeaders)
				? inputHeaders
				: new Headers(inputHeaders)) {
				headers.append(key, value)
			}
		}
	} else {
		headers = new Headers(inputHeaders)
	}

	const _withDefault = <K extends keyof FetchOptions>(
		key: K,
		defaultValue: NonNullable<FetchOptions[K]>,
	): NonNullable<FetchOptions[K]> => rootOpts[key] || opts[key] || defaultValue

	const resolvedOpts = {
		...rootOpts,
		...opts,

		fetch: _withDefault('fetch', globalThis.fetch),
		parseJson: _withDefault('parseJson', JSON.parse),
		stringifyJson: _withDefault('stringifyJson', JSON.stringify),

		headers,
		method: _withDefault('method', 'GET'),
		searchParams: opts.searchParams ? toURLSearchParams(opts.searchParams) : undefined,
	} as ResolvedFetchOptions<TData>

	// Resolve url
	const url = new URL(input instanceof Request ? input.url : input, resolvedOpts.baseUrl)
	if (resolvedOpts.searchParams) {
		url.search = resolvedOpts.searchParams.toString()
	}
	const request = new Request(url, input instanceof Request ? input : undefined)

	// Resolve signal
	if (request.signal && resolvedOpts.signal === undefined) resolvedOpts.signal = request.signal

	// Resolve Internal config
	resolvedOpts._retryCount = (resolvedOpts._retryCount ?? -1) + 1

	const { body, bodyType, method } = resolvedOpts

	if (body && canHaveBody(method)) {
		if (bodyType === 'json' || (bodyType === 'auto' && isJSONSerializable(body))) {
			if (typeof body !== 'string') resolvedOpts.body = JSON.stringify(body)

			if (!headers.has('Content-Type')) {
				headers.set('Content-Type', 'application/json')
			}
			if (!headers.has('Accept')) {
				headers.set('Accept', 'application/json')
			}
		} else if (
			'pipeTo' in (body as ReadableStream) &&
			typeof (body as ReadableStream).pipeTo === 'function'
		) {
			// Set experimental duplex attribute to `half`
			resolvedOpts.duplex = 'half'
		}
	}

	return {
		request,
		options: resolvedOpts,
	} as FetchContext<TData>
}
