import type { Arrayable, LiteralUnion, RequiredByKeys } from '../types'
import type { SearchParams } from '../url'

// ---------- Client & Options ----------

export type FetchRawFn = (input: FetchInput, options?: FetchOptions) => Promise<FetchResponse>

export type FetchDataFn<TResType extends ResponseBodyType> = <
	TData extends ResponseData<TResType> = ResponseData<TResType, any>,
>(
	input: FetchInput,
	options?: FetchOptions<ResponseData<TResType, TData>>,
) => Promise<TData>

export interface FetchClient {
	create: (clientOptions?: FetchClientOptions) => FetchClient
	delete: FetchResponseBodyDataMethods
	/**
	 * Fetch the given `input`.
	 *
	 * @params input - fetch input (string, URL, Request)
	 * @params options - fetch options
	 * @params responseType - response body type, defaults to `json`.
	 */
	fetch: FetchResponseBodyDataMethods
	get: FetchResponseBodyDataMethods
	head: FetchResponseBodyDataMethods
	patch: FetchResponseBodyDataMethods
	post: FetchResponseBodyDataMethods
	put: FetchResponseBodyDataMethods
}

export interface FetchResponseBodyDataMethods extends FetchRawFn {
	arrayBuffer: FetchDataFn<'arrayBuffer'>
	blob: FetchDataFn<'blob'>
	formData: FetchDataFn<'formData'>
	json: FetchDataFn<'json'>
	stream: FetchDataFn<'stream'>
	text: FetchDataFn<'text'>
}

export interface FetchClientOptions<TData = any> extends FetchOptions<TData> {}

export interface FetchOptions<TData = any> extends RequestInit, FetchHooksOptions<TData> {
	/** Base url */
	baseUrl?: string
	/** Request body content type. */
	bodyType?: 'auto' | 'json' | 'raw'
	/**
	 * @experimental Set to "half" to enable duplex streaming.
	 * Will be automatically set to "half" when using a ReadableStream as body.
	 * @see https://fetch.spec.whatwg.org/#enumdef-requestduplex
	 */
	duplex?: 'half' | undefined
	/** Custom fetch implementation */
	fetch?: typeof globalThis.fetch
	/** Custom json parsing implementation */
	parseJson?: typeof JSON.parse

	/** The number of times to retry failed requests */
	retry?: number
	/**
	 * A function to calculate the delay between retries given `retryCount` (starts from 1)
	 */
	retryDelay?: (context: FetchContext, retryCount: number) => number
	/**
	 * Status codes that trigger a retry
	 * @default [408, 413, 429, 500, 502, 503, 504]
	 */
	retryStatusCodes?: number[]

	/** search params (url query string) object, array or string */
	searchParams?: SearchParams
	/** Custom json stringification implementation */
	stringifyJson?: (
		value: any,
		replacer?: (this: any, key: string, value: any) => any,
		space?: string | number,
	) => string
	/** Request timeout in milliseconds */
	timeout?: number
}

export interface ResolvedFetchOptions<TData = any>
	extends RequiredByKeys<FetchOptions<TData>, 'fetch' | 'parseJson' | 'stringifyJson'> {
	/** @internal */
	_retryCount: number

	headers: Headers
	method: LiteralUnion<HttpMethod, string>
	searchParams?: URLSearchParams
}

// ---------- Context & Hooks ----------

export interface FetchContext<TData = any> {
	error?: Error
	options: ResolvedFetchOptions<TData>
	request: Request
	response?: FetchResponse<TData>
}

export interface FetchHooksOptions<TData = any> {
	onRequest?: ArrayableFetchHook<FetchContext<TData>>
	onRequestError?: ArrayableFetchHook<RequiredByKeys<FetchContext<TData>, 'error'>>
	onResponse?: ArrayableFetchHook<RequiredByKeys<FetchContext<TData>, 'response'>>
	onResponseError?: ArrayableFetchHook<RequiredByKeys<FetchContext<TData>, 'response'>>
}

export type ArrayableFetchHook<TContext = FetchContext> = Arrayable<FetchHook<TContext>>
export type FetchHook<TContext = FetchContext> = (context: TContext) => Promise<void>
export type FetchInput = RequestInfo | URL

// ---------- Response ----------

export interface FetchResponse<TData = any> extends Response {
	data?: TData
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/json) */
	json<T = TData>(): Promise<T>
}

export interface ResponseDataMap {
	arrayBuffer: ArrayBuffer
	blob: Blob
	formData: FormData
	stream: ReadableStream<Uint8Array>
	text: string
}
export type ResponseBodyType = keyof ResponseDataMap | 'json'

export type ResponseData<
	TResType extends ResponseBodyType,
	TData = any,
> = TResType extends keyof ResponseDataMap
	? ResponseDataMap[TResType]
	: TResType extends 'json'
		? TData
		: never

// ---------- Misc ----------

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD'
export type HttpMethodLowercase = Lowercase<HttpMethod>
export type HttpPayloadableMethod = Exclude<HttpMethod, 'GET' | 'HEAD'>
