import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BatchFetchAnswer from '../../src/api/batch/answer'
import BatchFetchQuestion from '../../src/api/batch/question'
import QuestionApi from '../../src/api/single/question'
import PathConfig from '../../src/config/path'
import http from '../../src/library/http'
import Logger from '../../src/library/logger'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { TaskExecutionError } from '../../src/library/util/common'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('paginated batch response validation', () => {
  let sandbox: TestSandbox
  let originalLogPath: string

  beforeEach(() => {
    sandbox = createTestSandbox('pagination-empty-object')
    originalLogPath = PathConfig.logPath
    PathConfig.setLogPath(sandbox.logPath)
  })

  afterEach(() => {
    PathConfig.setLogPath(originalLogPath)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('fails a question with count > 0 when its HTTP 200 page is an empty object', async () => {
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined)
    vi.spyOn(QuestionApi, 'asyncGetQuestionInfo').mockResolvedValue({
      id: 'question-id',
      title: 'fixture question',
      answer_count: 1,
    } as never)
    vi.spyOn(http, 'get').mockResolvedValue({})
    const childFetchSpy = vi.spyOn(BatchFetchAnswer.prototype, 'fetchListAndSaveToDb')

    let capturedError: unknown
    try {
      await new BatchFetchQuestion().fetch('question-id')
    } catch (error) {
      capturedError = error
    }

    expect(capturedError).toBeInstanceOf(TaskExecutionError)
    expect(capturedError).toMatchObject({
      summary: {
        failureCount: 1,
        failures: [
          expect.objectContaining({
            error: expect.objectContaining({ code: AppErrorCode.PAGINATION_RESPONSE_INVALID }),
          }),
        ],
      },
    })
    expect(childFetchSpy).not.toHaveBeenCalled()
  })
})
