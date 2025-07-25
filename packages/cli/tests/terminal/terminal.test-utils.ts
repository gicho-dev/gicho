import { Readable, Writable } from 'node:stream'

export class MockReadable extends Readable {
	protected _buffer: unknown[] | null = []

	_read(): void {
		if (this._buffer === null) return void this.push(null)

		for (const val of this._buffer) this.push(val)

		this._buffer = []
	}

	pushValue(val: unknown): void {
		this._buffer?.push(val)
	}

	close(): void {
		this._buffer = null
	}
}

export class MockWritable extends Writable {
	public buffer: string[] = []
	public readonly isTTY = false

	_write(
		chunk: any,
		_encoding: BufferEncoding,
		callback: (error?: Error | null | undefined) => void,
	): void {
		this.buffer.push(chunk.toString())
		callback()
	}
}
