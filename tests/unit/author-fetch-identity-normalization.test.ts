import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BatchFetchAnswer from '../../src/api/batch/answer'
import BatchFetchArticle from '../../src/api/batch/article'
import BatchFetchAuthorActivity from '../../src/api/batch/author_activity'
import BatchFetchAuthorAnswer from '../../src/api/batch/author_answer'
import BatchFetchAuthorArticle from '../../src/api/batch/author_article'
import BatchFetchAuthorQuestion from '../../src/api/batch/author_ask_question'
import BatchFetchAuthorPin from '../../src/api/batch/author_pin'
import BaseBatchFetch from '../../src/api/batch/base'
import BatchFetchPin from '../../src/api/batch/pin'
import BatchFetchQuestion from '../../src/api/batch/question'
import ActivityApi from '../../src/api/single/activity'
import AuthorApi from '../../src/api/single/author'
import CommonUtil from '../../src/library/util/common'
import Logger from '../../src/library/logger'
import ActivityModel from '../../src/model/activity'
import AuthorModel from '../../src/model/author'
import AuthorAskQuestionModel from '../../src/model/author_ask_question'
import { createSuccessOutcome } from '../../src/shared/runtime/execution_outcome'

const stableAuthorId = '7eb8dd6d1e665c9b53832a0d8ab3a4c2'
const canonicalUrlToken = 'Hentioe'

function createAuthorRecord(countName: string, count: number) {
  return {
    id: stableAuthorId,
    url_token: canonicalUrlToken,
    name: 'Canonical Author',
    [countName]: count,
  }
}

describe('普通用户抓取身份归一化', () => {
  let queuedTasks: Array<() => Promise<unknown>>

  beforeEach(() => {
    queuedTasks = []
    vi.spyOn(Logger, 'event').mockImplementation(() => undefined as never)
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined)
    vi.spyOn(AuthorModel, 'asyncReplaceAuthor').mockResolvedValue(undefined as never)
    vi.spyOn(BaseBatchFetch.prototype as any, 'persist').mockImplementation(
      async (_entityType: string, _entityId: string, action: () => Promise<unknown>) => {
        await action()
      },
    )
    vi.spyOn(CommonUtil, 'addAsyncTaskFunc').mockImplementation(({ asyncTaskFunc }) => {
      queuedTasks.push(asyncTaskFunc)
    })
    vi.spyOn(CommonUtil, 'asyncWaitAllTaskComplete').mockImplementation(async () => {
      const currentTasks = queuedTasks.splice(0)
      await Promise.all(currentTasks.map((task) => task()))
      return {
        totalCount: currentTasks.length,
        successCount: currentTasks.length,
        failureCount: 0,
        failures: [],
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    {
      label: '回答',
      countName: 'answer_count',
      listMethod: 'asyncGetAutherAnswerList' as const,
      entityId: 'answer-id',
      createBatch: () => new BatchFetchAuthorAnswer(),
      detailPrototype: BatchFetchAnswer.prototype,
    },
    {
      label: '文章',
      countName: 'articles_count',
      listMethod: 'asyncGetAutherArticleList' as const,
      entityId: 'article-id',
      createBatch: () => new BatchFetchAuthorArticle(),
      detailPrototype: BatchFetchArticle.prototype,
    },
    {
      label: '想法',
      countName: 'pins_count',
      listMethod: 'asyncGetAutherPinList' as const,
      entityId: 'pin-id',
      createBatch: () => new BatchFetchAuthorPin(),
      detailPrototype: BatchFetchPin.prototype,
    },
  ])('解析稳定 id 输入后，使用规范 token 对 $label 执行分页', async (fixture) => {
    const authorInfo = vi
      .spyOn(AuthorApi, 'asyncGetAutherInfo')
      .mockResolvedValue(createAuthorRecord(fixture.countName, 1) as never)
    const list = vi.spyOn(AuthorApi, fixture.listMethod).mockResolvedValue([{ id: fixture.entityId }] as never)
    const fetchDetails = vi
      .spyOn(fixture.detailPrototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(1))

    await fixture.createBatch().fetch(stableAuthorId)

    expect(authorInfo).toHaveBeenCalledWith(stableAuthorId)
    expect(list).toHaveBeenCalledWith(canonicalUrlToken, 0, 20)
    expect(fetchDetails).toHaveBeenCalledWith([fixture.entityId])
    expect((BaseBatchFetch.prototype as any).persist).toHaveBeenCalledWith(
      'author',
      canonicalUrlToken,
      expect.any(Function),
    )
  })

  it('使用规范身份和稳定身份写入并读取用户提问关系', async () => {
    const question = { id: 'question-id' }
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue(createAuthorRecord('question_count', 1) as never)
    const list = vi.spyOn(AuthorApi, 'asyncGetAutherQuestionList').mockResolvedValue([question] as never)
    const replaceRelation = vi
      .spyOn(AuthorAskQuestionModel, 'asyncReplaceAuthorQuestion')
      .mockResolvedValue(undefined as never)
    const readRelations = vi
      .spyOn(AuthorAskQuestionModel, 'asyncGetAuthorAskQuestionIdListByAuthorIdentity')
      .mockResolvedValue([question.id])
    const fetchQuestions = vi
      .spyOn(BatchFetchQuestion.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(1))

    await new BatchFetchAuthorQuestion().fetch(stableAuthorId)

    expect(list).toHaveBeenCalledWith(canonicalUrlToken, 0, 20)
    expect(replaceRelation).toHaveBeenCalledWith(canonicalUrlToken, stableAuthorId, question)
    expect(readRelations).toHaveBeenCalledWith(stableAuthorId, [canonicalUrlToken, stableAuthorId])
    expect(fetchQuestions).toHaveBeenCalledWith([question.id])
  })

  it('动态 API 使用规范 token，读取持久化动态时使用全部已知别名', async () => {
    const firstActivityAt = ActivityModel.ZHIHU_ACTIVITY_START_MONTH_AT
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue(createAuthorRecord('answer_count', 0) as never)
    const getLastActivity = vi.spyOn(ActivityApi, 'asyncGetAutherLastActivityAt').mockResolvedValue(firstActivityAt)
    const checkActivity = vi.spyOn(ActivityApi, 'asyncCheckHasAutherActivityAfterAt').mockResolvedValue(true)
    const fetchActivityRange = vi
      .spyOn(BatchFetchAuthorActivity.prototype as any, 'fetchActivityInRange')
      .mockResolvedValue(undefined)
    const readTargets = vi.spyOn(ActivityModel, 'asyncGetAllActivityTargetIdListByAuthorAliases').mockResolvedValue([])
    vi.spyOn(BatchFetchAnswer.prototype, 'fetchListAndSaveToDb').mockResolvedValue(createSuccessOutcome(0))
    vi.spyOn(BatchFetchArticle.prototype, 'fetchListAndSaveToDb').mockResolvedValue(createSuccessOutcome(0))
    vi.spyOn(BatchFetchQuestion.prototype, 'fetchListAndSaveToDb').mockResolvedValue(createSuccessOutcome(0))

    await new BatchFetchAuthorActivity().fetch(stableAuthorId)

    expect(getLastActivity).toHaveBeenCalledWith(canonicalUrlToken)
    expect(checkActivity).toHaveBeenCalledWith(canonicalUrlToken, firstActivityAt)
    expect(fetchActivityRange).toHaveBeenCalledWith(canonicalUrlToken, firstActivityAt, expect.any(Number))
    expect(readTargets).toHaveBeenCalledTimes(3)
    for (const [aliases] of readTargets.mock.calls) {
      expect(aliases).toEqual([canonicalUrlToken, stableAuthorId])
    }
  })

  it('用户响应缺少公开 token 时回退到稳定 id', async () => {
    vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
      ...createAuthorRecord('answer_count', 0),
      url_token: '   ',
    } as never)
    const fetchDetails = vi
      .spyOn(BatchFetchAnswer.prototype, 'fetchListAndSaveToDb')
      .mockResolvedValue(createSuccessOutcome(0))

    await new BatchFetchAuthorAnswer().fetch(stableAuthorId)

    expect(fetchDetails).toHaveBeenCalledWith([])
    expect((BaseBatchFetch.prototype as any).persist).toHaveBeenCalledWith(
      'author',
      stableAuthorId,
      expect.any(Function),
    )
  })
})
