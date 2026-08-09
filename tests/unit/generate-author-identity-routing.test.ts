import { afterEach, describe, expect, it, vi } from 'vitest'
import GenerateWorkflow from '../../src/application/workflow/generate/customer'
import * as Package from '../../src/application/workflow/generate/resource/library/package'
import * as ConstTaskConfig from '../../src/constant/task_config'
import ActivityModel from '../../src/model/activity'
import AnswerModel from '../../src/model/answer'
import ArticleModel from '../../src/model/article'
import AuthorModel from '../../src/model/author'
import AuthorAskQuestionModel from '../../src/model/author_ask_question'
import PinModel from '../../src/model/pin'

const requestedIdentifier = '7eb8dd6d1e665c9b53832a0d8ab3a4c2'
const canonicalUrlToken = 'Hentioe'
const aliases = [canonicalUrlToken, requestedIdentifier]

const taskCases = [
  {
    label: '用户提问',
    type: ConstTaskConfig.Const_Task_Type_用户提问过的所有问题,
    relation: 'questions',
  },
  {
    label: '用户回答',
    type: ConstTaskConfig.Const_Task_Type_用户的所有回答,
    relation: 'answers',
  },
  {
    label: '销号用户回答',
    type: ConstTaskConfig.Const_Task_Type_销号用户的所有回答,
    relation: 'answers',
  },
  {
    label: '用户想法',
    type: ConstTaskConfig.Const_Task_Type_用户发布的所有想法,
    relation: 'pins',
  },
  {
    label: '用户文章',
    type: ConstTaskConfig.Const_Task_Type_用户发布的所有文章,
    relation: 'articles',
  },
  {
    label: '赞同文章',
    type: ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章,
    relation: 'agreedArticles',
  },
  {
    label: '赞同回答',
    type: ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答,
    relation: 'agreedAnswers',
  },
  {
    label: '关注问题',
    type: ConstTaskConfig.Const_Task_Type_用户关注过的所有问题,
    relation: 'watchedQuestions',
  },
] as const

describe('用户任务生成身份路由', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(taskCases)('$label 使用稳定 id 与别名查询', async ({ type, relation }) => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const resolveSpy = vi.spyOn(AuthorModel, 'asyncResolveIdentity').mockResolvedValue({
      author: {
        id: requestedIdentifier,
        url_token: canonicalUrlToken,
        name: '测试作者',
      } as never,
      requestedIdentifier,
      authorId: requestedIdentifier,
      urlToken: canonicalUrlToken,
      aliases,
    })
    const questionSpy = vi
      .spyOn(AuthorAskQuestionModel, 'asyncGetAuthorAskQuestionIdListByAuthorIdentity')
      .mockResolvedValue([])
    const answerSpy = vi.spyOn(AnswerModel, 'asyncGetAnswerListByAuthorIdentity').mockResolvedValue([])
    const pinSpy = vi.spyOn(PinModel, 'asyncGetPinListByAuthorIdentity').mockResolvedValue([])
    const articleSpy = vi.spyOn(ArticleModel, 'asyncGetArticleListByAuthorIdentity').mockResolvedValue([])
    const activityTargetSpy = vi
      .spyOn(ActivityModel, 'asyncGetAllActivityTargetIdListByAuthorAliases')
      .mockResolvedValue([])
    const activityMapSpy = vi.spyOn(ActivityModel, 'asyncGetAllActionRecordMapByAuthorAliases').mockResolvedValue({})

    const unit = await new GenerateWorkflow().asyncGetUintPackageByFetchTask({
      type,
      id: requestedIdentifier,
    } as never)

    expect(resolveSpy).toHaveBeenCalledWith(requestedIdentifier)
    expect(unit).toBeInstanceOf(Package.Unit_用户)
    expect((unit as Package.Unit_用户).info).toMatchObject({
      id: requestedIdentifier,
      url_token: canonicalUrlToken,
    })

    switch (relation) {
      case 'questions':
        expect(questionSpy).toHaveBeenCalledWith(requestedIdentifier, aliases)
        break
      case 'answers':
        expect(answerSpy).toHaveBeenCalledWith(requestedIdentifier, aliases)
        break
      case 'pins':
        expect(pinSpy).toHaveBeenCalledWith(requestedIdentifier, aliases)
        break
      case 'articles':
        expect(articleSpy).toHaveBeenCalledWith(requestedIdentifier, aliases)
        break
      case 'agreedArticles':
        expect(activityTargetSpy).toHaveBeenCalledWith(aliases, ActivityModel.VERB_MEMBER_VOTEUP_ARTICLE)
        break
      case 'agreedAnswers':
        expect(activityMapSpy).toHaveBeenCalledWith(aliases, ActivityModel.VERB_ANSWER_VOTE_UP)
        break
      case 'watchedQuestions':
        expect(activityMapSpy).toHaveBeenCalledWith(aliases, ActivityModel.VERB_QUESTION_FOLLOW)
        break
    }
  })

  it.each([
    {
      label: '回答',
      type: ConstTaskConfig.Const_Task_Type_用户的所有回答,
      installRecordMock: () =>
        vi.spyOn(AnswerModel, 'asyncGetAnswerListByAuthorIdentity').mockResolvedValue([
          {
            id: 'answer-id',
            question: { id: 'question-id' },
            author: { id: requestedIdentifier, url_token: 'old-token' },
          } as never,
        ]),
    },
    {
      label: '文章',
      type: ConstTaskConfig.Const_Task_Type_用户发布的所有文章,
      installRecordMock: () =>
        vi.spyOn(ArticleModel, 'asyncGetArticleListByAuthorIdentity').mockResolvedValue([
          {
            id: 'article-id',
            author: { id: requestedIdentifier, url_token: 'old-token' },
          } as never,
        ]),
    },
    {
      label: '想法',
      type: ConstTaskConfig.Const_Task_Type_用户发布的所有想法,
      installRecordMock: () =>
        vi.spyOn(PinModel, 'asyncGetPinListByAuthorIdentity').mockResolvedValue([
          {
            id: 'pin-id',
            author: { id: requestedIdentifier, url_token: 'old-token' },
          } as never,
        ]),
    },
  ])('$label旧记录在内存中使用当前规范 token 展示', async ({ type, installRecordMock }) => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(AuthorModel, 'asyncResolveIdentity').mockResolvedValue({
      author: {
        id: requestedIdentifier,
        url_token: canonicalUrlToken,
        name: '测试作者',
      } as never,
      requestedIdentifier,
      authorId: requestedIdentifier,
      urlToken: canonicalUrlToken,
      aliases,
    })
    installRecordMock()

    const unit = (await new GenerateWorkflow().asyncGetUintPackageByFetchTask({
      type,
      id: requestedIdentifier,
    } as never)) as Package.Unit_用户

    expect(unit.pageList[0]).toHaveProperty('recordList.0.record.author', {
      id: requestedIdentifier,
      url_token: canonicalUrlToken,
    })
  })
})
