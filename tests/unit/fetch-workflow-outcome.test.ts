import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FetchWorkflow from '../../src/application/workflow/fetch/customer'
import { BatchFetchError } from '../../src/api/batch/base'
import PathConfig from '../../src/config/path'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { LogStatus } from '../../src/shared/logging/log_contract'
import { createPartialOutcome, createSuccessOutcome } from '../../src/shared/runtime/execution_outcome'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

function createConfig() {
  return {
    fetchTaskList: [
      { type: 'answer', id: 'missing-answer', rawInputText: '', comment: '', skipFetch: false },
      { type: 'article', id: 'valid-article', rawInputText: '', comment: '', skipFetch: false },
    ],
    generateConfig: {
      imageQuilty: 'hd',
      bookTitle: '',
      comment: '',
      maxItemInBook: 100,
      orderByList: [],
      generateType: 'single',
    },
    requestConfig: { ua: 'fixture-agent', cookie: '' },
  } as const
}

function recoverableBatchError(entityType = 'answer', entityId = 'missing-answer') {
  return new BatchFetchError(
    entityType,
    createPartialOutcome(0, [
      {
        entityType,
        entityId,
        error: {
          name: 'ApplicationError',
          message: `${entityType} missing`,
          code: AppErrorCode.ENTITY_NOT_FOUND,
        },
      },
    ]),
  )
}

describe('FetchWorkflow 跨任务类型结果汇总', () => {
  let sandbox: TestSandbox
  let originalLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('fetch-workflow-outcome')
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

  it('一个任务类型的实体全部失效后仍继续其它类型并汇总 partial_success', async () => {
    const workflow = new FetchWorkflow()
    const articleFetcher = {
      fetchListAndSaveToDb: vi.fn().mockResolvedValue(createSuccessOutcome(1)),
    }
    const fetcherMap = new Map<string, unknown>([
      ['answer', { fetchListAndSaveToDb: vi.fn().mockRejectedValue(recoverableBatchError()) }],
      ['article', articleFetcher],
    ])
    vi.spyOn(workflow as any, 'createBatchFetcher').mockImplementation((taskType: string) => fetcherMap.get(taskType))

    const outcome = await workflow.execute(createConfig() as any)

    expect(articleFetcher.fetchListAndSaveToDb).toHaveBeenCalledWith(['valid-article'])
    expect(outcome).toMatchObject({
      status: LogStatus.PARTIAL_SUCCESS,
      successCount: 1,
      failureCount: 1,
    })
    expect(outcome.failures[0]).toMatchObject({
      taskType: 'answer',
      entityId: 'missing-answer',
      error: { code: AppErrorCode.ENTITY_NOT_FOUND },
    })
  })

  it('不可恢复错误立即中止且不会运行后续任务类型', async () => {
    const workflow = new FetchWorkflow()
    const fatalError = new Error('database unavailable')
    const articleFetcher = {
      fetchListAndSaveToDb: vi.fn().mockResolvedValue(createSuccessOutcome(1)),
    }
    const fetcherMap = new Map<string, unknown>([
      ['answer', { fetchListAndSaveToDb: vi.fn().mockRejectedValue(fatalError) }],
      ['article', articleFetcher],
    ])
    vi.spyOn(workflow as any, 'createBatchFetcher').mockImplementation((taskType: string) => fetcherMap.get(taskType))

    await expect(workflow.execute(createConfig() as any)).rejects.toBe(fatalError)
    expect(articleFetcher.fetchListAndSaveToDb).not.toHaveBeenCalled()
  })

  it('全部任务类型只有可恢复实体失败时仍返回 zero-success partial_success', async () => {
    const workflow = new FetchWorkflow()
    const answerFetcher = {
      fetchListAndSaveToDb: vi.fn().mockRejectedValue(recoverableBatchError()),
    }
    const articleFetcher = {
      fetchListAndSaveToDb: vi.fn().mockRejectedValue(recoverableBatchError('article', 'missing-article')),
    }
    const fetcherMap = new Map<string, unknown>([
      ['answer', answerFetcher],
      ['article', articleFetcher],
    ])
    vi.spyOn(workflow as any, 'createBatchFetcher').mockImplementation((taskType: string) => fetcherMap.get(taskType))

    await expect(workflow.execute(createConfig() as any)).resolves.toMatchObject({
      status: LogStatus.PARTIAL_SUCCESS,
      successCount: 0,
      failureCount: 2,
    })
    expect(answerFetcher.fetchListAndSaveToDb).toHaveBeenCalledOnce()
    expect(articleFetcher.fetchListAndSaveToDb).toHaveBeenCalledOnce()
  })
})
