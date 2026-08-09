import { describe, expect, it } from 'vitest'
import {
  PandocWorkerClient,
  type WorkerAdapter,
} from '../../src/application/workflow/generate/library/markdown/index.js'

type Listener = (...arguments_: any[]) => void
type WorkerRequest = { id: number; html: string }

class FakeWorker implements WorkerAdapter {
  readonly listeners = new Map<string, Set<Listener>>()
  readonly postedMessages: WorkerRequest[] = []
  terminated = false
  behavior: (request: WorkerRequest, worker: FakeWorker) => void = () => undefined

  on(event: string, listener: Listener): this {
    const eventListeners = this.listeners.get(event) ?? new Set()
    eventListeners.add(listener)
    this.listeners.set(event, eventListeners)
    return this
  }

  postMessage(value: unknown): void {
    const request = value as WorkerRequest
    this.postedMessages.push(request)
    this.behavior(request, this)
  }

  emit(event: string, ...arguments_: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...arguments_)
    }
  }

  removeAllListeners(): this {
    this.listeners.clear()
    return this
  }

  async terminate(): Promise<number> {
    this.terminated = true
    return 0
  }
}

function respondingWorker(delayMs = 0): FakeWorker {
  const worker = new FakeWorker()
  worker.behavior = (request, currentWorker) => {
    setTimeout(() => {
      currentWorker.emit('message', {
        id: request.id,
        ok: true,
        markdown: `converted:${request.html}`,
        warnings: [],
      })
    }, delayMs)
  }
  return worker
}

describe('PandocWorkerClient 客户端', () => {
  it('惰性创建一个 Worker 并串行处理并发请求', async () => {
    const worker = respondingWorker(5)
    let factoryCalls = 0
    const client = new PandocWorkerClient({
      workerFactory: () => {
        factoryCalls += 1
        return worker
      },
      timeoutMs: 1_000,
    })

    expect(factoryCalls).toBe(0)
    const first = client.convert('first')
    const second = client.convert('second')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(worker.postedMessages.map((request) => request.html)).toEqual(['first'])
    await expect(Promise.all([first, second])).resolves.toEqual([
      { markdown: 'converted:first', warnings: [] },
      { markdown: 'converted:second', warnings: [] },
    ])
    expect(factoryCalls).toBe(1)

    await client.dispose()
    expect(worker.terminated).toBe(true)
    await expect(client.convert('after-dispose')).rejects.toThrow(/disposed/)
  })

  it('请求超时后拒绝、终止该 Worker，并按需重启', async () => {
    const timedOutWorker = new FakeWorker()
    const restartedWorker = respondingWorker()
    const workers = [timedOutWorker, restartedWorker]
    const client = new PandocWorkerClient({
      timeoutMs: 10,
      workerFactory: () => {
        const worker = workers.shift()
        if (worker === undefined) {
          throw new Error('unexpected Worker creation')
        }
        return worker
      },
    })

    await expect(client.convert('timeout')).rejects.toThrow(/timed out/)
    expect(timedOutWorker.terminated).toBe(true)
    await expect(client.convert('retry')).resolves.toEqual({
      markdown: 'converted:retry',
      warnings: [],
    })
    await client.dispose()
    expect(restartedWorker.terminated).toBe(true)
  })

  it('Worker 崩溃时拒绝请求，并为下一次请求使用新 Worker', async () => {
    const crashedWorker = new FakeWorker()
    crashedWorker.behavior = (_request, worker) => {
      queueMicrotask(() => worker.emit('error', new Error('worker crashed')))
    }
    const restartedWorker = respondingWorker()
    const workers = [crashedWorker, restartedWorker]
    const client = new PandocWorkerClient({
      timeoutMs: 1_000,
      workerFactory: () => workers.shift() as FakeWorker,
    })

    await expect(client.convert('crash')).rejects.toThrow('worker crashed')
    expect(crashedWorker.terminated).toBe(true)
    await expect(client.convert('retry')).resolves.toEqual({
      markdown: 'converted:retry',
      warnings: [],
    })
    await client.dispose()
  })
})

