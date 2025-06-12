import type { FetchContext, FetchOptions, FetchResponse } from './types'

export class FetchError extends Error {
	data?: any
	options?: FetchOptions
	request?: Request
	response?: FetchResponse
	status?: number
	statusText?: string

	constructor(c: FetchContext) {
		const { error: err, options: opts, request: req, response: res } = c

		const errMessage = err?.message || err?.toString() || ''
		const method = opts.method || req.method || 'GET'
		const url = req.url || '/'
		const statusStr = res ? `${res.status} ${res.statusText}` : '<no response>'

		const message = [`[${method}] ${url}:`, statusStr, errMessage].filter(Boolean).join(' ')

		super(message, err ? { cause: err } : undefined)
		if (err && !this.cause) this.cause = err

		this.name = 'FetchError'

		this.options = opts
		this.request = req
		this.response = res

		this.data = res?.data
		this.status = res?.status
		this.statusText = res?.statusText
	}
}

export class FetchTimeoutError extends Error {
	code: number
	request: Request

	constructor(request: Request) {
		super(`Request timed out: ${request.method} ${request.url}`)
		this.code = 23 // DOMException.TIMEOUT_ERR
		this.name = 'TimeoutError'
		this.request = request
	}
}
