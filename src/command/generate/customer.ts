import Base from '~/src/command/generate/base'
import TypeTaskConfig from '~/src/type/namespace/task_config'
import TypeAnswer from '~/src/type/namespace/answer'
import TypePin from '~/src/type/namespace/pin'
import TypeArticle from '~/src/type/namespace/article'
import MAuthorAskQuestion from '~/src/model/author_ask_question'
import MActivity from '~/src/model/activity'
import MTotalAnswer from '~/src/model/total_answer'
import MArticle from '~/src/model/article'
import MTopic from '~/src/model/topic'
import MCollection from '~/src/model/collection'
import MColumn from '~/src/model/column'
import MPin from '~/src/model/pin'
import _ from 'lodash'

import AnswerView from '~/src/view/answer'
import PinView from '~/src/view/pin'
import ArticleView from '~/src/view/article'
import BaseView from '~/src/view/base'
import fs from 'fs'
import path from 'path'
import StringUtil from '~/src/library/util/string'

class FetchAuthor extends Base {
  static get signature() {
    return `
        Generate:Customer
        {fetchConfigJSON:[必填]json形式的抓取配置}
    `
  }

  static get description() {
    return '输出自定义电子书'
  }

  async execute(args: any, options: any): Promise<any> {
    let { fetchConfigJSON } = args
    let customerTaskConfig: TypeTaskConfig.Customer = JSON.parse(fetchConfigJSON)
    let bookname = customerTaskConfig.bookname

    let imageQuilty = customerTaskConfig.imageQuilty
    let coverImage = customerTaskConfig.coverImage
    let comment = customerTaskConfig.comment
    let order = customerTaskConfig.order
    let orderBy = customerTaskConfig.orderBy

    this.log(`开始输出自定义电子书, 共有${customerTaskConfig.configList.length}个任务`)
    // 将任务中的数据按照问题/文章/想法进行汇总
    let answerList: Array<TypeAnswer.Record> = []
    let questionList: Array<Array<TypeAnswer.Record>> = []
    let articleList: Array<TypeArticle.Record> = []
    let pinList: Array<TypePin.Record> = []

    this.log(`将任务中的数据按照问题/文章/想法进行汇总`)
    let taskIndex = 0
    for (let taskConfig of customerTaskConfig.configList) {
      taskIndex = taskIndex + 1
      this.log(`处理第${taskIndex}/${customerTaskConfig.configList.length}个任务, 任务类型:${taskConfig.type}, 任务备注:${taskConfig.comment}`)
      let taskType = taskConfig.type
      let targetId = `${taskConfig.id}`
      switch (taskConfig.type) {
        case 'author-ask-question':
          this.log(`获取用户${targetId}所有提问过的问题`)
          let questionIdList = await MAuthorAskQuestion.asyncGetAuthorAskQuestionIdList(targetId)
          this.log(`用户${targetId}所有提问过的问题id列表获取完毕`)
          this.log(`开始获取用户${targetId}所有提问过的问题下的回答列表`)
          let answerListInAuthorAskQuestion = await MTotalAnswer.asyncGetAnswerListByQuestionIdList(questionIdList)
          this.log(`用户${targetId}所有提问过的问题下的回答列表获取完毕`)
          answerList = answerList.concat(answerListInAuthorAskQuestion)
          break
        case 'author-answer':
          this.log(`获取用户${targetId}所有回答过的答案`)
          let answerListInAuthorHasAnswer = await MTotalAnswer.asyncGetAnswerListByAuthorUrlToken(targetId)
          this.log(`用户${targetId}所有回答过的答案获取完毕`)
          answerList = answerList.concat(answerListInAuthorHasAnswer)
          break
        case 'author-pin':
          this.log(`获取用户${targetId}所有发表过的想法`)
          let pinListByAuthorPost = await MPin.asyncGetPinListByAuthorUrlToken(targetId)
          this.log(`用户${targetId}所有发表过的想法获取完毕`)
          pinList = pinList.concat(pinListByAuthorPost)
          break
        case 'topic':
          this.log(`获取话题${targetId}下所有精华回答id`)
          let answerIdListInTopic = await MTopic.asyncGetAnswerIdList(targetId)
          this.log(`话题${targetId}下精华回答id列表获取完毕`)
          this.log(`话题${targetId}下精华回答列表`)
          let answerListInTopic = await MTotalAnswer.asyncGetAnswerList(answerIdListInTopic)
          this.log(`话题${targetId}下精华回答列表获取完毕`)
          answerList = answerList.concat(answerListInTopic)
          break
        case 'collection':
          this.log(`获取收藏夹${targetId}下所有回答id`)
          let answerIdListInCollection = await MCollection.asyncGetAnswerIdList(targetId)
          this.log(`收藏夹${targetId}下回答id列表获取完毕`)
          this.log(`获取收藏夹${targetId}下回答列表`)
          let answerListInCollection = await MTotalAnswer.asyncGetAnswerList(answerIdListInCollection)
          this.log(`收藏夹${targetId}下回答列表获取完毕`)
          answerList = answerList.concat(answerListInCollection)
          break
        case 'column':
          this.log(`获取专栏${targetId}下所有文章`)
          let articleListInColumn = await MArticle.asyncGetArticleListByColumnId(targetId)
          this.log(`专栏${targetId}下所有文章获取完毕`)
          articleList = articleList.concat(articleListInColumn)
          break
        case 'article':
          this.log(`获取文章${targetId}`)
          let singleArticle = await MArticle.asyncGetArticle(targetId)
          if (_.isEmpty(singleArticle)) {
            this.log(`文章${targetId}不存在, 自动跳过`)
            continue
          }
          this.log(`文章${targetId}获取完毕`)
          articleList.push(singleArticle)
          break
        case 'question':
          this.log(`获取问题${targetId}下的回答列表`)
          let answerListInQuestion = await MTotalAnswer.asyncGetAnswerListByQuestionIdList([targetId])
          this.log(`问题${targetId}下的回答列表获取完毕`)
          answerList = answerList.concat(answerListInQuestion)
          break
        case 'answer':
          this.log(`获取回答${targetId}`)
          let singleAnswer = await MTotalAnswer.asyncGetAnswer(targetId)
          if (_.isEmpty(singleAnswer)) {
            this.log(`回答${targetId}不存在, 自动跳过`)
            continue
          }
          this.log(`回答${targetId}获取完毕`)
          answerList.push(singleAnswer)
          break
        case 'pin':
          this.log(`获取想法${targetId}`)
          let singlePin = await MPin.asyncGetPin(targetId)
          if (_.isEmpty(singlePin)) {
            this.log(`想法${targetId}不存在, 自动跳过`)
            continue
          }
          this.log(`想法${targetId}获取完毕`)
          pinList.push(singlePin)
          break
        case 'author-agree-article':
          this.log(`获取用户${targetId}赞同过的所有文章id`)
          let articleIdListInAuthorAgreeArticle = await MActivity.asyncGetAllActivityTargetIdList(targetId, MActivity.VERB_MEMBER_VOTEUP_ARTICLE)
          this.log(`用户${targetId}赞同过的所有文章id获取完毕`)
          this.log(`获取用户${targetId}赞同过的所有文章`)
          let articleListInAuthorAgreeArticle = await MArticle.asyncGetArticleList(articleIdListInAuthorAgreeArticle)
          this.log(`用户${targetId}赞同过的所有文章获取完毕`)
          articleList = articleList.concat(articleListInAuthorAgreeArticle)
        case 'author-agree-answer':
          this.log(`获取用户${targetId}赞同过的所有回答id`)
          let answerIdListInAuthorAgreeAnswer = await MActivity.asyncGetAllActivityTargetIdList(targetId, MActivity.VERB_ANSWER_VOTE_UP)
          this.log(`用户${targetId}赞同过的所有回答id获取完毕`)
          this.log(`获取用户${targetId}赞同过的所有回答`)
          let answerListInAuthorAgreeAnswer = await MTotalAnswer.asyncGetAnswerList(answerIdListInAuthorAgreeAnswer)
          this.log(`用户${targetId}赞同过的所有回答获取完毕`)
          answerList = answerList.concat(answerListInAuthorAgreeAnswer)
        case 'author-watch-question':
          this.log(`获取用户${targetId}关注过的所有问题id`)
          let questionIdListInAuthorWatchQuestion = await MActivity.asyncGetAllActivityTargetIdList(targetId, MActivity.VERB_QUESTION_FOLLOW)
          this.log(`用户${targetId}关注过的所有问题id获取完毕`)
          this.log(`获取用户${targetId}关注过的所有问题id下的所有回答`)
          let answerListInAuthorWatchQuestion = await MTotalAnswer.asyncGetAnswerListByQuestionIdList(questionIdListInAuthorWatchQuestion)
          this.log(`用户${targetId}关注过的所有问题id下的所有回答获取完毕`)
          answerList = answerList.concat(answerListInAuthorWatchQuestion)
        default:
          this.log(`不支持的任务类型:${taskConfig.type}, 自动跳过`)
      }
    }
    // 将回答按照问题合并在一起
    let uniqQuestionMap: {
      [questionId: string]: {
        [answerId: string]: TypeAnswer.Record
      }
    } = {}
    for (let answer of answerList) {
      if (uniqQuestionMap[answer.question.id]) {
        uniqQuestionMap[answer.question.id][answer.id] = answer
      } else {
        uniqQuestionMap[answer.question.id] = {
          [answer.id]: answer,
        }
      }
    }

    for (let questionId of Object.keys(uniqQuestionMap)) {
      let answerMap = uniqQuestionMap[questionId]
      let answerList = []
      for (let answerId of Object.keys(answerMap)) {
        let answer = answerMap[answerId]
        answerList.push(answer)
      }
      questionList.push(answerList)
    }

    this.log(`所有数据获取完毕, 最终结果为=>`)
    this.log(`问题 => ${questionList.length}个`)
    this.log(`文章 => ${articleList.length}篇`)
    this.log(`想法 => ${pinList.length}条`)

    this.bookname = StringUtil.encodeFilename(`${bookname}`)
    // 初始化文件夹
    this.initStaticRecource()

    // 单独记录生成的元素, 以便输出成单页
    let totalElementListToGenerateSinglePage = []
    this.log(`生成问题html列表`)
    for (let answerRecordList of questionList) {
      let title = answerRecordList[0].question.id
      let content = AnswerView.render(answerRecordList)
      content = this.processContent(content)
      fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
      this.epub.addHtml(answerRecordList[0].question.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))

      // 单独记录生成的元素, 以便输出成单页文件
      let elememt = BaseView.generateQuestionElement(answerRecordList[0].question, answerRecordList)
      totalElementListToGenerateSinglePage.push(elememt)
    }

    this.log(`生成文章列表`)
    for (let articleRecord of articleList) {
      let title = articleRecord.id
      let content = ArticleView.render(articleRecord)
      content = this.processContent(content)
      fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
      this.epub.addHtml(articleRecord.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))

      // 单独记录生成的元素, 以便输出成单页文件
      let elememt = BaseView.generateSingleArticleElement(articleRecord)
      totalElementListToGenerateSinglePage.push(elememt)
    }

    this.log(`生成想法列表`)
    for (let pinRecord of pinList) {
      let title = pinRecord.id
      let content = PinView.render(pinRecord)
      content = this.processContent(content)
      fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
      this.epub.addHtml(pinRecord.excerpt_title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))

      // 单独记录生成的元素, 以便输出成单页文件
      let elememt = BaseView.generateSinglePinElement(pinRecord)
      totalElementListToGenerateSinglePage.push(elememt)
    }

    this.log(`生成单一html文件`)
    // 生成全部文件
    let pageElement = BaseView.generatePageElement(this.bookname, totalElementListToGenerateSinglePage)
    let content = BaseView.renderToString(pageElement)
    this.log(`内容渲染完毕, 开始对内容进行输出前预处理`)
    content = this.processContent(content)
    fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), content)

    //  生成目录
    this.log(`生成目录`)
    let firstAnswerInQuestionToRenderIndexList = []
    for (let answerRecordList of questionList) {
      // 只取回答列表中的第一个元素, 以便生成目录
      firstAnswerInQuestionToRenderIndexList.push(answerRecordList[0])
    }
    let indexContent = BaseView.renderIndex(this.bookname, [...firstAnswerInQuestionToRenderIndexList, ...articleList, ...pinList])
    fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `index.html`), indexContent)
    this.epub.addIndexHtml('目录', path.resolve(this.htmlCacheHtmlPath, `index.html`))

    // 处理静态资源
    await this.asyncProcessStaticResource()

    this.log(`自定义电子书${this.bookname}生成完毕`)
  }
}

export default FetchAuthor
