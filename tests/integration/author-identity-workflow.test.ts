import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FetchWorkflow from '../../src/application/workflow/fetch/customer'
import GenerateWorkflow from '../../src/application/workflow/generate/customer'
import InitWorkflow from '../../src/application/workflow/init/init_workflow'
import AnswerApi from '../../src/api/single/answer'
import AuthorApi from '../../src/api/single/author'
import CommonConfig from '../../src/config/common'
import PathConfig from '../../src/config/path'
import { toLegacyTaskConfig, createDefaultTaskConfig } from '../../src/domain/task/task_config'
import Knex from '../../src/library/knex'
import AnswerModel from '../../src/model/answer'
import AuthorModel from '../../src/model/author'
import { createRunContext } from '../../src/shared/runtime/run_context'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

const stableAuthorId = '7eb8dd6d1e665c9b53832a0d8ab3a4c2'
const canonicalUrlToken = 'Hentioe'
const answerId = 'author-identity-answer'

type MutableRuntimeState = {
  databasePath: string
  outputPath: string
  cachePath: string
  logPath: string
}

function createAuthorRecord() {
  return {
    id: stableAuthorId,
    url_token: canonicalUrlToken,
    name: 'Canonical Author',
    answer_count: 1,
    avatar_url: '',
    headline: '',
    type: 'people',
  }
}

function createAnswerRecord() {
  return {
    id: answerId,
    type: 'answer',
    content: '<p>identity fixture</p>',
    voteup_count: 1,
    comment_count: 0,
    created_time: 1,
    updated_time: 1,
    author: createAuthorRecord(),
    question: {
      id: 'author-identity-question',
      title: 'Identity fixture question',
      detail: '',
      answer_count: 1,
      follower_count: 0,
      created: 1,
      updated_time: 1,
    },
  }
}

function createConfig(identifier: string) {
  const config = createDefaultTaskConfig()
  config.tasks = [
    {
      type: 'author-answer',
      id: identifier,
      rawInputText: `https://www.zhihu.com/people/${identifier}/answers`,
      comment: 'author identity integration fixture',
      skipFetch: false,
    },
  ]
  config.generate.title = ''
  config.generate.imageQuality = 'none'
  return toLegacyTaskConfig(config)
}

describe('用户身份抓取、持久化与生成', () => {
  let sandbox: TestSandbox
  let originalState: MutableRuntimeState

  beforeEach(() => {
    sandbox = createTestSandbox('author-identity-workflow')
    originalState = {
      databasePath: CommonConfig.db_uri,
      outputPath: PathConfig.outputPath,
      cachePath: PathConfig.cachePath,
      logPath: PathConfig.logPath,
    }
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    await Knex.destroy()
    CommonConfig.setDatabaseUri(originalState.databasePath)
    PathConfig.setOutputPath(originalState.outputPath)
    PathConfig.setCachePath(originalState.cachePath)
    PathConfig.setLogPath(originalState.logPath)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it.each([
    ['稳定用户 ID', stableAuthorId],
    ['规范 url_token', canonicalUrlToken],
  ])('将 %s 解析为规范用户并生成相同单元', async (_label, identifier) => {
    const context = createRunContext({
      configPath: sandbox.configPath,
      databasePath: sandbox.databasePath,
      cachePath: sandbox.cachePath,
      logPath: sandbox.logPath,
      outputPath: sandbox.outputPath,
      skipUpgradeCheck: true,
      traceId: `author-identity-${identifier}`,
      runId: `author-identity-${identifier}`,
      trigger: 'cli',
    })
    await new InitWorkflow().execute({ rebase: false }, context)

    const authorRecord = createAuthorRecord()
    const answerRecord = createAnswerRecord()
    const authorInfoSpy = vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue(authorRecord as never)
    const answerListSpy = vi.spyOn(AuthorApi, 'asyncGetAutherAnswerList').mockResolvedValue([answerRecord] as never)
    vi.spyOn(AnswerApi, 'asyncGetAnswer').mockResolvedValue(answerRecord as never)

    const config = createConfig(identifier)
    const fetchOutcome = await new FetchWorkflow().execute(config, context)
    const generateWorkflow = new GenerateWorkflow()
    const outputSpy = vi.spyOn(generateWorkflow, 'generateEpub').mockResolvedValue(undefined)
    const generateStatus = await generateWorkflow.execute(config, context)

    expect(authorInfoSpy).toHaveBeenCalledWith(identifier)
    expect(answerListSpy).toHaveBeenCalledWith(canonicalUrlToken, 0, 20)
    expect(fetchOutcome).toMatchObject({ status: 'success', successCount: 1, failureCount: 0 })
    expect(generateStatus).toBe('success')
    expect(await AuthorModel.asyncGetAuthor(stableAuthorId)).toMatchObject({
      id: stableAuthorId,
      url_token: canonicalUrlToken,
    })
    expect(await AuthorModel.asyncGetAuthor(canonicalUrlToken)).toMatchObject({
      id: stableAuthorId,
      url_token: canonicalUrlToken,
    })
    expect(await AnswerModel.asyncGetAnswerCount()).toBe(1)
    expect(outputSpy).toHaveBeenCalledOnce()

    const generatedColumn = outputSpy.mock.calls[0][0].epubColumn
    expect(generatedColumn.bookname).toContain(canonicalUrlToken)
    expect(generatedColumn.bookname).not.toContain(stableAuthorId)
    expect(generatedColumn.unitList).toHaveLength(1)
    expect(generatedColumn.unitList[0].info).toMatchObject({
      id: stableAuthorId,
      url_token: canonicalUrlToken,
    })
    expect(generatedColumn.unitList[0].getItemCount()).toBe(1)
  })
})
