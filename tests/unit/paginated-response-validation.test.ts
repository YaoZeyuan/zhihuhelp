import { afterEach, describe, expect, it, vi } from 'vitest'
import ActivityApi from '../../src/api/single/activity'
import AuthorApi from '../../src/api/single/author'
import CollectionApi from '../../src/api/single/collection'
import ColumnApi from '../../src/api/single/column'
import QuestionApi from '../../src/api/single/question'
import TopicApi from '../../src/api/single/topic'
import http from '../../src/library/http'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { assertZhihuPaginatedData } from '../../src/shared/error/zhihu_response_validation'

describe('知乎分页响应校验', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('接受显式空 data 数组', () => {
    expect(assertZhihuPaginatedData({ data: [] }, 'fixture.items')).toEqual([])
  })

  it.each([
    ['空对象', {}],
    ['data 为 null', { data: null }],
    ['data 为对象', { data: {} }],
    ['顶层数组', []],
  ])('遇到“%s”时抛出结构化错误', (_label, payload) => {
    expect(() => assertZhihuPaginatedData(payload, 'fixture.items')).toThrowError(
      expect.objectContaining({ code: AppErrorCode.PAGINATION_RESPONSE_INVALID }),
    )
  })

  it('问题、收藏夹、专栏、话题、用户和动态分页 API 均使用该校验', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({})
    const requestList: Array<() => Promise<unknown>> = [
      () => QuestionApi.asyncGetAnswerList('question-id'),
      () => CollectionApi.asyncGetItemList('collection-id'),
      () => CollectionApi.asyncGetAnswerExcerptList('collection-id'),
      () => ColumnApi.asyncGetArticleExcerptList('column-id'),
      () => TopicApi.asyncGetAnswerList('topic-id'),
      () => AuthorApi.asyncGetAutherAnswerList('author-id'),
      () => AuthorApi.asyncGetAutherQuestionList('author-id'),
      () => AuthorApi.asyncGetAutherPinList('author-id'),
      () => AuthorApi.asyncGetAutherArticleList('author-id'),
      () => AuthorApi.asyncGetBlockAccountAutherInfo('author-id'),
      () => ActivityApi.asyncGetAutherActivityList('author-id'),
      () => ActivityApi.asyncCheckHasAutherActivityAfterAt('author-id'),
      () => ActivityApi.asyncGetAutherLastActivityAt('author-id'),
    ]

    for (const request of requestList) {
      await expect(request()).rejects.toMatchObject({
        code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
      })
    }
  })

  it.each([
    ['缺少 paging', { data: [] }],
    ['缺少 is_end', { data: [], paging: {} }],
    ['is_end 为字符串', { data: [], paging: { is_end: 'false' } }],
    ['paging 为 null', { data: [], paging: null }],
  ])('动态分页“%s”时拒绝响应', async (_label, payload) => {
    vi.spyOn(http, 'get').mockResolvedValue(payload)

    await expect(ActivityApi.asyncGetAutherActivityList('author-id')).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
    await expect(ActivityApi.asyncCheckHasAutherActivityAfterAt('author-id')).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
    await expect(ActivityApi.asyncGetAutherLastActivityAt('author-id')).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
  })

  it('显式空动态页视为没有最新动态', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: [], paging: { is_end: true } })

    await expect(ActivityApi.asyncGetAutherLastActivityAt('author-id')).resolves.toBe(0)
  })

  it.each([
    ['缺少 totals', { data: [], paging: {} }],
    ['totals 为字符串', { data: [], paging: { totals: '0' } }],
    ['totals 为负数', { data: [], paging: { totals: -1 } }],
    ['totals 为小数', { data: [], paging: { totals: 1.5 } }],
  ])('被封禁用户分页“%s”时拒绝响应', async (_label, payload) => {
    vi.spyOn(http, 'get').mockResolvedValue(payload)

    await expect(AuthorApi.asyncGetBlockAccountAutherInfo('author-id')).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
  })

  it('被封禁用户无回答时接受显式 totals=0', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: [], paging: { totals: 0 } })

    await expect(AuthorApi.asyncGetBlockAccountAutherInfo('author-id')).resolves.toMatchObject({
      answer_count: 0,
    })
  })
})
