import { Worker } from 'node:worker_threads'
import {
  PANDOC_MARKDOWN_OPTIONS,
  type MarkdownConversionResult,
  type MarkdownConverter,
  type PandocMarkdownOptions,
} from './types.js'

type SerializedError = {
  name?: string
  message?: string
  stack?: string
}

type WorkerResponse =
  | {
      id: number
      ok: true
      markdown: string
      warnings?: unknown[]
    }
  | {
      id: number
      ok: false
      error?: SerializedError
    }

export interface WorkerAdapter {
  postMessage(value: unknown): void
  on(event: string, listener: (...arguments_: any[]) => void): unknown
  removeAllListeners?(): unknown
  terminate(): Promise<number> | number
}

export type PandocWorkerConverterOptions = {
  timeoutMs?: number
  workerFactory?: () => WorkerAdapter
}

type PendingRequest = {
  id: number
  resolve: (result: MarkdownConversionResult) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

const DEFAULT_TIMEOUT_MS = 120_000

function createDefaultWorker(): WorkerAdapter {
  // Vitest executes the TypeScript source directly under Node 24, whose type
  // stripping can load the .ts Worker. Babel output runs from dist and must
  // continue resolving the emitted .js sibling.
  const workerModulePath = import.meta.url.endsWith('.ts')
    ? './pandoc_worker.ts'
    : './pandoc_worker.js'
  return new Worker(new URL(workerModulePath, import.meta.url)) as unknown as WorkerAdapter
}

function deserializeError(error: SerializedError | undefined): Error {
  const convertedError = new Error(error?.message || 'Pandoc conversion failed')
  convertedError.name = error?.name || 'Error'
  if (error?.stack) {
    convertedError.stack = error.stack
  }
  return convertedError
}

export class PandocWorkerConverter implements MarkdownConverter {
  private readonly timeoutMs: number
  private readonly workerFactory: () => WorkerAdapter
  private worker: WorkerAdapter | null = null
  private pendingRequest: PendingRequest | null = null
  private serialQueue: Promise<void> = Promise.resolve()
  private requestId = 0
  private disposed = false
  private termination: Promise<void> = Promise.resolve()

  constructor(options: PandocWorkerConverterOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    if (Number.isFinite(this.timeoutMs) === false || this.timeoutMs <= 0) {
      throw new RangeError('Pandoc Worker timeoutMs must be a positive finite number')
    }
    this.workerFactory = options.workerFactory ?? createDefaultWorker
  }

  convert(
    html: string,
    options: PandocMarkdownOptions = PANDOC_MARKDOWN_OPTIONS,
  ): Promise<MarkdownConversionResult> {
    if (this.disposed) {
      return Promise.reject(new Error('Pandoc Worker converter has been disposed'))
    }

    const conversion = this.serialQueue.then(() => {
      if (this.disposed) {
        throw new Error('Pandoc Worker converter has been disposed')
      }
      return this.runConversion(html, options)
    })
    this.serialQueue = conversion.then(() => undefined, () => undefined)
    return conversion
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      await this.termination
      return
    }
    this.disposed = true
    await this.failAndRestart(new Error('Pandoc Worker converter was disposed'))
    await this.serialQueue
  }

  private ensureWorker(): WorkerAdapter {
    if (this.worker !== null) {
      return this.worker
    }

    const worker = this.workerFactory()
    this.worker = worker
    worker.on('message', (response: WorkerResponse) => {
      this.handleMessage(worker, response)
    })
    worker.on('error', (error: Error) => {
      void this.handleWorkerFailure(worker, error)
    })
    worker.on('exit', (exitCode: number) => {
      if (this.worker !== worker) {
        return
      }
      const error = new Error(`Pandoc Worker exited unexpectedly with code ${exitCode}`)
      void this.handleWorkerFailure(worker, error, false)
    })
    return worker
  }

  private runConversion(
    html: string,
    options: PandocMarkdownOptions,
  ): Promise<MarkdownConversionResult> {
    return new Promise((resolve, reject) => {
      const worker = this.ensureWorker()
      const id = ++this.requestId
      const timeout = setTimeout(() => {
        void this.handleWorkerFailure(
          worker,
          new Error(`Pandoc conversion timed out after ${this.timeoutMs}ms`),
        )
      }, this.timeoutMs)
      this.pendingRequest = { id, resolve, reject, timeout }

      try {
        worker.postMessage({ id, html, options })
      } catch (error) {
        const postError = error instanceof Error ? error : new Error(String(error))
        void this.handleWorkerFailure(worker, postError)
      }
    })
  }

  private handleMessage(worker: WorkerAdapter, response: WorkerResponse): void {
    const pending = this.pendingRequest
    if (worker !== this.worker || pending === null || response.id !== pending.id) {
      return
    }

    this.pendingRequest = null
    clearTimeout(pending.timeout)
    if (response.ok) {
      if (typeof response.markdown !== 'string') {
        pending.reject(new TypeError('Pandoc Worker returned a non-string Markdown value'))
        return
      }
      pending.resolve({
        markdown: response.markdown,
        warnings: Array.isArray(response.warnings) ? response.warnings : [],
      })
      return
    }
    pending.reject(deserializeError(response.error))
  }

  private async handleWorkerFailure(
    worker: WorkerAdapter,
    error: Error,
    terminate = true,
  ): Promise<void> {
    if (worker !== this.worker) {
      return
    }
    await this.failAndRestart(error, terminate)
  }

  private async failAndRestart(error: Error, terminate = true): Promise<void> {
    const pending = this.pendingRequest
    this.pendingRequest = null
    if (pending !== null) {
      clearTimeout(pending.timeout)
    }

    const worker = this.worker
    this.worker = null
    if (worker !== null) {
      worker.removeAllListeners?.()
      if (terminate) {
        this.termination = Promise.resolve(worker.terminate())
          .then(() => undefined, () => undefined)
        await this.termination
      }
    }

    pending?.reject(error)
  }
}
