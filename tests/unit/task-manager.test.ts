import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PathConfig from '../../src/config/path'
import { TaskExecutionError, TaskManager } from '../../src/library/util/common'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('TaskManager 失败传播', () => {
  let sandbox: TestSandbox
  let originalLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('task-manager')
    originalLogPath = PathConfig.logPath
    PathConfig.setLogPath(sandbox.logPath)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    PathConfig.setLogPath(originalLogPath)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('报告每个失败任务，而非按成功返回', async () => {
    const manager = new TaskManager({ maxTaskRunner: 2, protectMs: 0 })
    manager.addAsyncTaskFunc({ asyncTaskFunc: async () => undefined, needProtect: false })
    manager.addAsyncTaskFunc({
      asyncTaskFunc: async () => {
        throw new Error('expected failure')
      },
      needProtect: false,
    })

    try {
      await manager.asyncWaitAllTaskComplete({ needTTL: false })
      throw new Error('expected TaskExecutionError')
    } catch (error) {
      expect(error).toBeInstanceOf(TaskExecutionError)
      const taskError = error as TaskExecutionError
      expect(taskError.summary).toMatchObject({ totalCount: 2, successCount: 1, failureCount: 1 })
      expect(taskError.summary.failures[0].error.message).toBe('expected failure')
    }
  })

  it('任务超时并拒绝后清理计时器句柄', async () => {
    const manager = new TaskManager({ taskTimeoutMs: 10, protectMs: 0 })
    manager.addAsyncTaskFunc({
      asyncTaskFunc: () => new Promise(() => undefined),
      needProtect: false,
    })
    const startedAt = Date.now()
    await expect(manager.asyncWaitAllTaskComplete({ needTTL: true })).rejects.toBeInstanceOf(TaskExecutionError)
    expect(Date.now() - startedAt).toBeLessThan(1000)
  })
})
