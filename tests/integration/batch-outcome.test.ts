import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaseBatchFetch, { BatchFetchError } from '../../src/api/batch/base'
import PathConfig from '../../src/config/path'
import { LogStatus } from '../../src/shared/logging/log_contract'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'
import { AppErrorCode, ApplicationError } from '../../src/shared/error/application_error'
import CommonUtil, { TaskManager } from '../../src/library/util/common'

class FixtureBatchFetch extends BaseBatchFetch {
  async fetch(id: string): Promise<void> {
    if (id.startsWith('fatal')) {
      throw new Error(`fixture failure: ${id}`)
    }
    if (id.startsWith('missing')) {
      throw new ApplicationError(AppErrorCode.ENTITY_NOT_FOUND, `fixture missing: ${id}`)
    }
  }
}

class NestedRecoverableBatchFetch extends BaseBatchFetch {
  async fetch(): Promise<void> {
    throw new BatchFetchError(
      'nested-answer',
      {
        status: LogStatus.PARTIAL_SUCCESS,
        successCount: 0,
        failureCount: 1,
        failures: [
          {
            entityType: 'answer',
            entityId: 'nested-missing',
            error: {
              name: 'ApplicationError',
              message: 'nested answer missing',
              code: AppErrorCode.ENTITY_NOT_FOUND,
            },
          },
        ],
      },
    )
  }
}

class EntityValidationBatchFetch extends BaseBatchFetch {
  validate(value: unknown, stableKeyList?: string[]) {
    this.assertEntityRecord(value, 'fixture', 'requested-id', stableKeyList)
  }
}

class NestedPaginationBatchFetch extends BaseBatchFetch {
  activeParentCount = 0
  maxActiveParentCount = 0
  nestedCompletedList: string[] = []

  async fetch(id: string): Promise<void> {
    this.activeParentCount += 1
    this.maxActiveParentCount = Math.max(this.maxActiveParentCount, this.activeParentCount)
    CommonUtil.addAsyncTaskFunc({
      asyncTaskFunc: async () => {
        await CommonUtil.asyncSleep(id === 'first' ? 15 : 1)
        this.nestedCompletedList.push(id)
      },
      needProtect: false,
    })
    await CommonUtil.asyncWaitAllTaskComplete({ needTTL: false })
    this.activeParentCount -= 1
  }
}

describe('batch partial and fatal semantics', () => {
  let sandbox: TestSandbox
  let originalLogPath: string
  let originalTaskManager: TaskManager

  beforeEach(() => {
    sandbox = createTestSandbox('batch-outcome')
    originalLogPath = PathConfig.logPath
    originalTaskManager = CommonUtil.taskManager
    CommonUtil.taskManager = new TaskManager()
    PathConfig.setLogPath(sandbox.logPath)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    PathConfig.setLogPath(originalLogPath)
    CommonUtil.taskManager = originalTaskManager
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('returns partial_success with the failed entity when other entities succeed', async () => {
    const outcome = await new FixtureBatchFetch().fetchListAndSaveToDb(['ok-1', 'missing-2', 'ok-3'])

    expect(outcome).toMatchObject({
      status: LogStatus.PARTIAL_SUCCESS,
      successCount: 2,
      failureCount: 1,
    })
    expect(outcome.failures).toEqual([
      expect.objectContaining({
        entityId: 'missing-2',
        error: expect.objectContaining({ message: 'fixture missing: missing-2' }),
      }),
    ])
  })

  it('throws BatchFetchError with a complete outcome when every entity fails', async () => {
    await expect(new FixtureBatchFetch().fetchListAndSaveToDb(['fatal-1', 'fatal-2'])).rejects.toMatchObject({
      name: 'BatchFetchError',
      outcome: {
        status: LogStatus.PARTIAL_SUCCESS,
        successCount: 0,
        failureCount: 2,
        failures: [
          expect.objectContaining({ entityId: 'fatal-1' }),
          expect.objectContaining({ entityId: 'fatal-2' }),
        ],
      },
    } satisfies Partial<BatchFetchError>)
  })

  it('preserves recoverable failures from a nested batch instead of converting them to fatal errors', async () => {
    await expect(new NestedRecoverableBatchFetch().fetchListAndSaveToDb(['collection-1'])).rejects.toMatchObject({
      name: 'BatchFetchError',
      outcome: {
        failures: [
          expect.objectContaining({
            entityType: 'answer',
            entityId: 'nested-missing',
            error: expect.objectContaining({ code: AppErrorCode.ENTITY_NOT_FOUND }),
          }),
        ],
      },
    })
  })

  it('rejects empty or identifier-less entity responses before persistence', () => {
    const batch = new EntityValidationBatchFetch()
    expect(() => batch.validate({})).toThrowError(expect.objectContaining({ code: AppErrorCode.ENTITY_RESPONSE_EMPTY }))
    expect(() => batch.validate({ title: 'missing id' })).toThrowError(
      expect.objectContaining({ code: AppErrorCode.ENTITY_RESPONSE_EMPTY }),
    )
    expect(() => batch.validate({ url_token: 'stable-user' }, ['id', 'url_token'])).not.toThrow()
  })

  it('isolates nested pagination waits by running parent entities sequentially', async () => {
    const batch = new NestedPaginationBatchFetch()
    const outcome = await batch.fetchListAndSaveToDb(['first', 'second'])

    expect(outcome).toMatchObject({ status: LogStatus.SUCCESS, successCount: 2 })
    expect(batch.maxActiveParentCount).toBe(1)
    expect(batch.nestedCompletedList).toEqual(['first', 'second'])
  })
})
