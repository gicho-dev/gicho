import type { Server } from 'node:http'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { createFetchClient } from '../src/fetch'

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

	beforeEach(() => {
		fetch.mockClear()
	})

	afterAll(() => {
		server?.close()
	})

	describe('createFetchClient()', () => {
		test('create fetch client', async () => {
			const c = createFetchClient()

			expect(await c.fetch.text($url('ok'))).toBe('OK')
			expect(await c.get.json($url('hello'))).toEqual({ message: 'Hello~!' })
			expect(fetch).toHaveBeenCalledTimes(2)

			const data = await c.get.json<{ x: number }>('ss')
			const res = await c.get('ss')

			c.get('', { bodyType: 'raw' })

			// c.get('')

			// const source = new URLSearchParams('a=1&b=2&c=3&a=11')
			// const target = new URLSearchParams('a=100')

			// // copyURLSearchParams(source, target)
			// expect(target.toString()).toEqual('a=1&b=2&c=3&a=11')
		})
	})
})
