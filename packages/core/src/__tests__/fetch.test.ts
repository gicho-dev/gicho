import type { Server } from 'http'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { afterAll, beforeAll, beforeEach, describe, expect, it, suite, vi } from 'vitest'

import { createFetchClient } from '../fetch'

describe('fetch', () => {
	let server: Server
	let host!: string
	const $url = (url: string): string => `${host}/${url}`

	const fetch = vi.spyOn(globalThis, 'fetch')

	beforeAll(async () => {
		const app = new Hono()

		app.get('/ok', (c) => c.text('OK'))
		app.get('/hello', (c) => c.json({ message: 'Hello~!' }))

		server = serve({ fetch: app.fetch, port: 0 }) as Server

		await new Promise<void>((resolve) => {
			server.once('listening', () => {
				const addr = server.address()
				if (addr && typeof addr === 'object') host = `http://localhost:${addr.port}`
				resolve()
			})
		})
	})

	afterAll(() => {
		server?.close()
	})

	beforeEach(() => {
		fetch.mockClear()
	})

	suite('createFetchClient()', () => {
		it('create fetch client', async () => {
			const c = createFetchClient()

			expect(await c.fetch.text($url('ok'))).toBe('OK')
			expect(await c.get.json($url('hello'))).toEqual({ message: 'Hello~!' })
			expect(fetch).toHaveBeenCalledTimes(2)

			// const source = new URLSearchParams('a=1&b=2&c=3&a=11')
			// const target = new URLSearchParams('a=100')

			// // copyURLSearchParams(source, target)
			// expect(target.toString()).toEqual('a=1&b=2&c=3&a=11')
		})
	})
})
