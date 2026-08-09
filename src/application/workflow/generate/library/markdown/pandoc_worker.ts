import { parentPort } from 'node:worker_threads'
import type { PandocMarkdownOptions } from './types.js'

type WorkerRequest = {
  id: number
  html: string
  options: PandocMarkdownOptions
}

type SerializedError = {
  name: string
  message: string
  stack?: string
}

type WorkerResponse =
  | {
      id: number
      ok: true
      markdown: string
      warnings: unknown[]
    }
  | {
      id: number
      ok: false
      error: SerializedError
    }

function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return {
    name: 'Error',
    message: String(error),
  }
}

if (parentPort === null) {
  throw new Error('pandoc_worker must run inside a worker_threads Worker')
}
const workerPort = parentPort

let requestQueue = Promise.resolve()

workerPort.on('message', (request: WorkerRequest) => {
  requestQueue = requestQueue.then(async () => {
    try {
      // Keep the 58 MiB Pandoc runtime out of the Electron main process and do
      // not initialize it until the first Markdown conversion is requested.
      const { convert } = await import('pandoc-wasm')
      const result = await convert(request.options, request.html, {})
      if (typeof result.stdout !== 'string') {
        throw new TypeError('pandoc-wasm returned a non-string stdout value')
      }
      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        markdown: result.stdout,
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
      }
      workerPort.postMessage(response)
    } catch (error) {
      const response: WorkerResponse = {
        id: request.id,
        ok: false,
        error: serializeError(error),
      }
      workerPort.postMessage(response)
    }
  })
})
