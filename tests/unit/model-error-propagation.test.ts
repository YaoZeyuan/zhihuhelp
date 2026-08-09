import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CacheJsonTransfer from '../../src/application/cache_transfer/json_transfer'
import CommonConfig from '../../src/config/common'
import PathConfig from '../../src/config/path'
import { Const_Task_Type_回答 } from '../../src/constant/task_config'
import Knex from '../../src/library/knex'
import Answer from '../../src/model/answer'
import AuthorAskQuestion from '../../src/model/author_ask_question'
import Summary from '../../src/model/summary'
import { AppErrorCode, ApplicationError } from '../../src/shared/error/application_error'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

async function createAnswerTable(): Promise<void> {
  await Knex.raw(`
    CREATE TABLE Answer (
      answer_id TEXT PRIMARY KEY,
      question_id TEXT,
      author_url_token TEXT,
      author_id TEXT,
      raw_json TEXT
    )
  `)
}

describe('模型层 SQLite 错误传播', () => {
  let sandbox: TestSandbox
  let originalDatabasePath: string
  let originalOutputPath: string

  beforeEach(async () => {
    await Knex.destroy()
    sandbox = createTestSandbox('model-errors')
    originalDatabasePath = CommonConfig.db_uri
    originalOutputPath = PathConfig.outputPath
    CommonConfig.setDatabaseUri(sandbox.databasePath)
    PathConfig.setOutputPath(sandbox.outputPath)
  })

  afterEach(async () => {
    await Knex.destroy()
    CommonConfig.setDatabaseUri(originalDatabasePath)
    PathConfig.setOutputPath(originalOutputPath)
    sandbox.cleanup()
  })

  it('被查询的表不存在时传播 SQLite 错误', async () => {
    await expect(Answer.asyncGetAnswer('missing-table-entity')).rejects.toThrow(/no such table.*Answer/i)
    await expect(AuthorAskQuestion.asyncGetAuthorAskQuestionIdList('missing-author')).rejects.toThrow(
      /no such table.*Author_Ask_Question/i,
    )
    await expect(
      Summary.asyncGetTabList({ type: 'answer' as any, pageNo: 0, pageSize: 10 }),
    ).rejects.toThrow(/no such table.*Answer/i)
    await expect(
      CacheJsonTransfer.exportDbRecordJson({ type: Const_Task_Type_回答 }),
    ).rejects.toThrow(/no such table.*Answer/i)
  })

  it('实体不存在时返回空结果', async () => {
    await createAnswerTable()

    await expect(Answer.asyncGetAnswer('not-persisted')).resolves.toEqual({})
    await expect(Answer.asyncGetAnswerList(['not-persisted'])).resolves.toEqual([])
  })

  it('持久化 raw_json 损坏时抛出包含诊断信息的 ApplicationError', async () => {
    await createAnswerTable()
    await Knex.raw(
      `INSERT INTO Answer (answer_id, question_id, author_url_token, author_id, raw_json)
       VALUES (?, ?, ?, ?, ?)`,
      ['broken-answer', 'question-1', 'author-token', 'author-1', '{"id":'],
    )

    let capturedError: unknown
    try {
      await Answer.asyncGetAnswer('broken-answer')
    } catch (error) {
      capturedError = error
    }

    expect(capturedError).toBeInstanceOf(ApplicationError)
    expect(capturedError).toMatchObject({
      code: AppErrorCode.PERSIST_DATA_INVALID,
      message: expect.stringMatching(/Answer.*broken-answer/),
    })
    expect((capturedError as ApplicationError).cause).toBeInstanceOf(SyntaxError)
    await expect(
      Summary.asyncGetTabList({ type: 'answer' as any, pageNo: 0, pageSize: 10 }),
    ).rejects.toMatchObject({
      code: AppErrorCode.PERSIST_DATA_INVALID,
      message: expect.stringMatching(/Answer.*broken-answer/),
    })
    await expect(
      CacheJsonTransfer.exportDbRecordJson({ type: Const_Task_Type_回答 }),
    ).rejects.toMatchObject({
      code: AppErrorCode.PERSIST_DATA_INVALID,
      message: expect.stringMatching(/Answer.*broken-answer/),
    })
  })
})
