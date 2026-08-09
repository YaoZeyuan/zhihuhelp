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

describe('知乎实体数量校验', () => {
  beforeEach(() => {
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined)
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined)
    vi.spyOn(BaseBatchFetch.prototype as any, 'persist').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['缺失', undefined],
    ['null 值', null],
    ['数字字符串', '0'],
    ['NaN 值', Number.NaN],
    ['无穷大', Number.POSITIVE_INFINITY],
    ['负数', -1],
    ['小数', 1.5],
  ])('拒绝数量值（%s）并报告结构化致命 schema 错误', (_label, value) => {
    expect(() => assertZhihuNonNegativeIntegerCount(value, 'fixture.count')).toThrowError(
      expect.objectContaining({ code: AppErrorCode.PAGINATION_RESPONSE_INVALID }),
    )
  })

  it.each([0, 1, 20])('接受非负整数 %s', (value) => {
    expect(assertZhihuNonNegativeIntegerCount(value, 'fixture.count')).toBe(value)
  })

  it.each([
    {
      label: '问题 question.answer_count',
      run: async () => {
        vi.spyOn(QuestionApi, 'asyncGetQuestionInfo').mockResolvedValue({
          id: 'question-id',
          title: 'fixture question',
        } as never)
        return new BatchFetchQuestion().fetch('question-id')
      },
    },
    {
      label: '专栏 column.articles_count',
      run: async () => {
        vi.spyOn(ColumnApi, 'asyncGetColumnInfo').mockResolvedValue({
          id: 'column-id',
          title: 'fixture column',
        } as never)
        return new BatchFetchColumn().fetch('column-id')
      },
    },
    {
      label: '话题 topic.best_answers_count',
      run: async () => {
        vi.spyOn(TopicApi, 'asyncGetTopicInfo').mockResolvedValue({
          id: 'topic-id',
          name: 'fixture topic',
        } as never)
        return new BatchFetchTopic().fetch('topic-id')
      },
    },
    {
      label: '用户 author.answer_count',
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
      label: '用户 author.articles_count',
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
      label: '用户 author.pins_count',
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
      label: '用户 author.question_count',
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
      label: '销号用户 author.answer_count',
      run: async () => {
        vi.spyOn(AuthorApi, 'asyncGetBlockAccountAutherInfo').mockResolvedValue({
          id: 'author-id',
          url_token: 'author-token',
          name: 'fixture author',
        } as never)
        return new BatchFetchBlockedAuthorAnswer().fetch('author-token')
      },
    },
  ])('不会让缺失的 $label 被静默视为空抓取成功', async ({ run }) => {
    await expect(run()).rejects.toMatchObject({
      code: AppErrorCode.PAGINATION_RESPONSE_INVALID,
    })
  })
})
