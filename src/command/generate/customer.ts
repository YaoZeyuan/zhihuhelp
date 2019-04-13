import Base from '~/src/command/generate/base'
import CommonUtil from '~/src/library/util/common'
import TypeTaskConfig from '~/src/type/namespace/task_config'
import TypeQuestion from '~/src/type/namespace/question'
import TypeAnswer from '~/src/type/namespace/answer'
import TypePin from '~/src/type/namespace/pin'
import TypeArticle from '~/src/type/namespace/article'
import MAuthorAskQuestion from '~/src/model/author_ask_question'
import MTotalAnswer from '~/src/model/total_answer'
import MArticle from '~/src/model/article'
import MTopic from '~/src/model/topic'
import MCollection from '~/src/model/collection'
import MColumn from '~/src/model/column'
import MPin from '~/src/model/pin'
import _ from 'lodash'

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
    this.log(`开始输出自定义电子书, 共有${customerTaskConfig.config_list.length}个任务`)
    // 将任务中的数据按照问题/文章/想法进行汇总
    let answerList: Array<TypeAnswer.Record> = []
    let articleList: Array<TypeArticle.Record> = []
    let pinList: Array<TypePin.Record> = []

    this.log(`将任务中的数据按照问题/文章/想法进行汇总`)
    let taskIndex = 0
    for (let taskConfig of customerTaskConfig.config_list) {
      taskIndex = taskIndex + 1
      this.log(`处理第${taskIndex}/${customerTaskConfig.config_list.length}个任务, 任务类型:${taskConfig.type}, 任务备注:${taskConfig.comment}`)
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
          this.log(`获取专栏${targetId}下所有文章id`)
          let articleListInColumn = await MArticle.asyncGetArticleList(targetId)
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
        case 'author-agree':
        case 'author-agree-article':
        case 'author-agree-answer':
        case 'author-watch-question':
        case 'author-activity':
          break
        default:
          this.log(`不支持的任务类型:${taskConfig.type}, 自动跳过`)
      }
    }

    this.log(`抓取任务合并完毕, 最终结果为=>`, taskListPackage)

    this.log(`开始派发自定义任务=>`)

    for (let taskType of Object.keys(taskListPackage)) {
      let targetIdList = taskListPackage[taskType]
      switch (taskType) {
        case 'author-ask-question':
          let batchFetchAuthorAskQuestion = new BatchFetchAuthorAskQuestion()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchAuthorAskQuestion.fetchListAndSaveToDb(targetIdList))
          break
        case 'author-answer':
          let batchFetchAuthorAnswer = new BatchFetchAuthorAnswer()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchAuthorAnswer.fetchListAndSaveToDb(targetIdList))
          break
        case 'author-pin':
          let batchFetchAuthorPin = new BatchFetchAuthorPin()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchAuthorPin.fetchListAndSaveToDb(targetIdList))
          break
        case 'topic':
          let batchFetchTopic = new BatchFetchTopic()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchTopic.fetchListAndSaveToDb(targetIdList))
          break
        case 'collection':
          let batchFetchCollection = new BatchFetchCollection()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchCollection.fetchListAndSaveToDb(targetIdList))
          break
        case 'column':
          let batchFetchColumn = new BatchFetchColumn()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchColumn.fetchListAndSaveToDb(targetIdList))
          break
        case 'article':
          let batchFetchArticle = new BatchFetchArticle()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchArticle.fetchListAndSaveToDb(targetIdList))
          break
        case 'question':
          let batchFetchQuestion = new BatchFetchQuestion()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchQuestion.fetchListAndSaveToDb(targetIdList))
          break
        case 'answer':
          let batchFetchAnswer = new BatchFetchAnswer()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchAnswer.fetchListAndSaveToDb(targetIdList))
          break
        case 'pin':
          let batchFetchPin = new BatchFetchPin()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchPin.fetchListAndSaveToDb(targetIdList))
          break
        case 'author-agree':
        case 'author-agree-article':
        case 'author-agree-answer':
        case 'author-watch-question':
        case 'author-activity':
          let batchFetchAuthorActivity = new BatchFetchAuthorActivity()
          await CommonUtil.asyncAppendPromiseWithDebounce(batchFetchAuthorActivity.fetchListAndSaveToDb(targetIdList))
          break
        default:
          this.log(`不支持的任务类型:${taskType}, 自动跳过`)
      }
    }
    await CommonUtil.asyncDispatchAllPromiseInQueen()
    this.log(`自定义任务抓取完毕`)
  }
}

export default FetchAuthor
