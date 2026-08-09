import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BatchFetchAuthorAnswer from '../../src/api/batch/author_answer'
import BatchFetchAuthorArticle from '../../src/api/batch/author_article'
import BatchFetchAuthorQuestion from '../../src/api/batch/author_ask_question'
import BatchFetchAuthorPin from '../../src/api/batch/author_pin'
import BaseBatchFetch from '../../src/api/batch/base'
import BatchFetchBlockedAuthorAnswer from '../../src/api/batch/block_account_answer'
import BatchFetchColumn from '../../src/api/batch/column'
import BatchFetchQuestion from '../../src/api/batch/question'
import BatchFetchTopic from '../../src/api/batch/topic'
import AuthorApi from '../../src/api/single/author'
import ColumnApi from '../../src/api/single/column'
import QuestionApi from '../../src/api/single/question'
import TopicApi from '../../src/api/single/topic'
import Logger from '../../src/library/logger'
import { AppErrorCode } from '../../src/shared/error/application_error'
import { assertZhihuNonNegativeIntegerCount } from '../../src/shared/error/zhihu_response_validation'

describe('Zhihu entity count validation', () => {
  beforeEach(() => {
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined)
    vi.spyOn(BaseBatchFetch.prototype as any, 'persist').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['numeric string', '0'],
    ['NaN', Number.NaN],
    ['infinity', Number.POSITIVE_INFINITY],
    ['negative', -1],
    ['fractional', 1.5],
  ])('rejects a %s count with a structured fatal schema error', (_label, value) => {
    expect(() => assertZhihuNonNegativeIntegerCount(value, 'fixture.count')).toThrowError(
      expect.objectContaining({ code: AppErrorCode.PAGINATION_RESPONSE_INVALID }),
    )
  })

  it.each([0, 1, 20])('accepts the non-negative integer %s', (value) => {
    expect(assertZhihuNonNegativeIntegerCount(value, 'fixture.count')).toBe(value)
  })

  it.each([
    {
      label: 'question.answer_count',
      run: async () => {
        vi.spyOn(QuestionApi, 'asyncGetQuestionInfo').mockResolvedValue({
          id: 'question-id',
          title: 'fixture question',
        } as never)
        return new BatchFetchQuestion().fetch('question-id')
      },
    },
    {
      label: 'column.articles_count',
      run: async () => {
        vi.spyOn(ColumnApi, 'asyncGetColumnInfo').mockResolvedValue({
          id: 'column-id',
          title: 'fixture column',
        } as never)
        return new BatchFetchColumn().fetch('column-id')
      },
    },
    {
      label: 'topic.best_answers_count',
      run: async () => {
        vi.spyOn(TopicApi, 'asyncGetTopicInfo').mockResolvedValue({
          id: 'topic-id',
          name: 'fixture topic',
        } as never)
        return new BatchFetchTopic().fetch('topic-id')
      },
    },
    {
      label: 'author.answer_count',
      run: async () => {
        vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
          id: 'author-id',
          url_token: 'author-token',
          name: 'fixture author',
        } as never)
        return new BatchFetchAuthorAnswer().fetch('author-token')
      },
    },
    {
      label: 'author.articles_count',
      run: async () => {
        vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
          id: 'author-id',
          url_token: 'author-token',
          name: 'fixture author',
        } as never)
        return new BatchFetchAuthorArticle().fetch('author-token')
      },
    },
    {
      label: 'author.pins_count',
      run: async () => {
        vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
          id: 'author-id',
          url_token: 'author-token',
          name: 'fixture author',
        } as never)
        return new BatchFetchAuthorPin().fetch('author-token')
      },
    },
    {
      label: 'author.question_count',
      run: async () => {
        vi.spyOn(AuthorApi, 'asyncGetAutherInfo').mockResolvedValue({
          id: 'author-id',
          url_token: 'author-token',
          name: 'fixture author',
        } as never)
        return new BatchFetchAuthorQuestion().fetch('author-token')
      },
    },
    {
      label: 'blocked author.answer_count',
      run: async () => {
        vi.spyOn(AuthorApi, 'asyncGetBlockAccountAutherInfo').mockResolvedValue({
          id: 'author-id',
          url_token: 'author-token',
          name: 'fixture author',
        } as never)
        return new BatchFetchBlockedAuthorAnswer().fetch('author-token')
      },
    },
  ])('does not let $label silently become a successful empty fetch', async ({ run }) => {
    await expect(run()).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
  })
})
