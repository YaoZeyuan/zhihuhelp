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

describe('Zhihu paginated response validation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts an explicit empty data array', () => {
    expect(assertZhihuPaginatedData({ data: [] }, 'fixture.items')).toEqual([])
  })

  it.each([
    ['an empty object', {}],
    ['null data', { data: null }],
    ['object data', { data: {} }],
    ['a top-level array', []],
  ])('rejects %s with a structured error', (_label, payload) => {
    expect(() => assertZhihuPaginatedData(payload, 'fixture.items')).toThrowError(
      expect.objectContaining({ code: AppErrorCode.PAGINATION_RESPONSE_INVALID }),
    )
  })

  it('is used by question, collection, column, topic, author and activity pagination APIs', async () => {
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
    ['missing paging', { data: [] }],
    ['missing is_end', { data: [], paging: {} }],
    ['a string is_end', { data: [], paging: { is_end: 'false' } }],
    ['a null paging object', { data: [], paging: null }],
  ])('rejects activity pagination with %s', async (_label, payload) => {
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

  it('treats an explicit empty activity page as no last activity', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: [], paging: { is_end: true } })

    await expect(ActivityApi.asyncGetAutherLastActivityAt('author-id')).resolves.toBe(0)
  })

  it.each([
    ['missing totals', { data: [], paging: {} }],
    ['string totals', { data: [], paging: { totals: '0' } }],
    ['negative totals', { data: [], paging: { totals: -1 } }],
    ['fractional totals', { data: [], paging: { totals: 1.5 } }],
  ])('rejects blocked-author pagination with %s', async (_label, payload) => {
    vi.spyOn(http, 'get').mockResolvedValue(payload)

    await expect(AuthorApi.asyncGetBlockAccountAutherInfo('author-id')).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
  })

  it('accepts an explicit zero total for a blocked author with no answers', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: [], paging: { totals: 0 } })

    await expect(AuthorApi.asyncGetBlockAccountAutherInfo('author-id')).resolves.toMatchObject({
      answer_count: 0,
    })
  })
})
