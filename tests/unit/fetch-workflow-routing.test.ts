import { afterEach, describe, expect, it, vi } from 'vitest'
import BatchFetchAnswer from '../../src/api/batch/answer'
import BatchFetchArticle from '../../src/api/batch/article'
import BatchFetchAuthorActivity from '../../src/api/batch/author_activity'
import BatchFetchAuthorAnswer from '../../src/api/batch/author_answer'
import BatchFetchAuthorArticle from '../../src/api/batch/author_article'
import BatchFetchAuthorQuestion from '../../src/api/batch/author_ask_question'
import BatchFetchAuthorPin from '../../src/api/batch/author_pin'
import BlockAccountAnswer from '../../src/api/batch/block_account_answer'
import BatchFetchCollection from '../../src/api/batch/collection'
import BatchFetchColumn from '../../src/api/batch/column'
import BatchFetchPin from '../../src/api/batch/pin'
import BatchFetchQuestion from '../../src/api/batch/question'
import BatchFetchTopic from '../../src/api/batch/topic'
import FetchWorkflow from '../../src/application/workflow/fetch/customer'
import * as ConstTaskConfig from '../../src/constant/task_config'
import { taskTypeList } from '../../src/domain/task/task_config'
import Logger from '../../src/library/logger'

type FetcherConstructor = abstract new (...args: never[]) => unknown

const expectedFetcherByTaskType = new Map<string, FetcherConstructor>([
  [ConstTaskConfig.Const_Task_Type_用户提问过的所有问题, BatchFetchAuthorQuestion],
  [ConstTaskConfig.Const_Task_Type_用户的所有回答, BatchFetchAuthorAnswer],
  [ConstTaskConfig.Const_Task_Type_用户发布的所有文章, BatchFetchAuthorArticle],
  [ConstTaskConfig.Const_Task_Type_用户发布的所有想法, BatchFetchAuthorPin],
  [ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答, BatchFetchAuthorActivity],
  [ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章, BatchFetchAuthorActivity],
  [ConstTaskConfig.Const_Task_Type_用户关注过的所有问题, BatchFetchAuthorActivity],
  [ConstTaskConfig.Const_Task_Type_销号用户的所有回答, BlockAccountAnswer],
  [ConstTaskConfig.Const_Task_Type_话题, BatchFetchTopic],
  [ConstTaskConfig.Const_Task_Type_收藏夹, BatchFetchCollection],
  [ConstTaskConfig.Const_Task_Type_专栏, BatchFetchColumn],
  [ConstTaskConfig.Const_Task_Type_文章, BatchFetchArticle],
  [ConstTaskConfig.Const_Task_Type_问题, BatchFetchQuestion],
  [ConstTaskConfig.Const_Task_Type_回答, BatchFetchAnswer],
  [ConstTaskConfig.Const_Task_Type_想法, BatchFetchPin],
])

function task(type: string, id: string, skipFetch = false) {
  return {
    type,
    id,
    rawInputText: `https://example.invalid/${type}/${id}`,
    comment: '',
    skipFetch,
  }
}

function packageIds(taskPackage: Record<string, Set<string>>) {
  return Object.fromEntries(
    Object.entries(taskPackage)
      .filter(([, idSet]) => idSet.size > 0)
      .map(([taskType, idSet]) => [taskType, [...idSet]]),
  )
}

describe('FetchWorkflow 任务编排', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('将全部 15 种公开任务类型映射到具体批量抓取器', () => {
    const workflow = new FetchWorkflow()

    expect(taskTypeList).toHaveLength(15)
    expect([...expectedFetcherByTaskType.keys()]).toEqual(taskTypeList)
    for (const taskType of taskTypeList) {
      const fetcher = (workflow as any).createBatchFetcher(taskType)
      expect(fetcher, taskType).toBeInstanceOf(expectedFetcherByTaskType.get(taskType)!)
    }
  })

  it('按插入顺序合并同类任务，去除重复 id 并丢弃跳过任务', () => {
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)
    vi.spyOn(Logger, 'event').mockImplementation((entry) => entry as never)
    const workflow = new FetchWorkflow()

    const result = (workflow as any).mergeTaskList([
      task(ConstTaskConfig.Const_Task_Type_回答, 'answer-2'),
      task(ConstTaskConfig.Const_Task_Type_回答, 'answer-1'),
      task(ConstTaskConfig.Const_Task_Type_回答, 'answer-2'),
      task(ConstTaskConfig.Const_Task_Type_文章, 'skipped-article', true),
    ])

    expect(packageIds(result)).toEqual({ answer: ['answer-2', 'answer-1'] })
  })

  it('空列表或未知任务类型不返回任何可运行 id', () => {
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)
    vi.spyOn(Logger, 'event').mockImplementation((entry) => entry as never)
    const workflow = new FetchWorkflow()

    const emptyResult = (workflow as any).mergeTaskList([])
    const unknownResult = (workflow as any).mergeTaskList([task('future-task-type', 'entity-1')])

    expect(packageIds(emptyResult)).toEqual({})
    expect(packageIds(unknownResult)).toEqual({})
    expect((workflow as any).createBatchFetcher('future-task-type')).toBeUndefined()
  })
})
