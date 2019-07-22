import Base from '~/src/command/fetch/base'
import CommonUtil from '~/src/library/util/common'
import TypeTaskConfig from '~/src/type/namespace/task_config'
import PathConfig from '~/src/config/path'
import fs from 'fs'
import BatchFetchAnswer from '~/src/command/fetch/batch/answer'
import BatchFetchArticle from '~/src/command/fetch/batch/article'
import BatchFetchAuthorActivity from '~/src/command/fetch/batch/author_activity'
import BatchFetchAuthorAnswer from '~/src/command/fetch/batch/author_answer'
import BatchFetchAuthorAskQuestion from '~/src/command/fetch/batch/author_ask_question'
import BatchFetchAuthorPin from '~/src/command/fetch/batch/author_pin'
import BatchFetchCollection from '~/src/command/fetch/batch/collection'
import BatchFetchColumn from '~/src/command/fetch/batch/column'
import BatchFetchPin from '~/src/command/fetch/batch/pin'
import BatchFetchQuestion from '~/src/command/fetch/batch/question'
import BatchFetchTopic from '~/src/command/fetch/batch/topic'
import Logger from '~/src/library/logger'
import json5 from 'json5'

class FetchCustomer extends Base {
  static get signature() {
    return `
        Fetch:Customer
    `
  }

  static get description() {
    return `从${PathConfig.customerTaskConfigUri}中读取自定义抓取任务并执行`
  }

  async execute(args: any, options: any): Promise<any> {
    Logger.log(`从${PathConfig.customerTaskConfigUri}中读取配置文件`)
    let fetchConfigJSON = fs.readFileSync(PathConfig.customerTaskConfigUri).toString()
    Logger.log('content =>', fetchConfigJSON)
    let customerTaskConfig: TypeTaskConfig.Customer = json5.parse(fetchConfigJSON)
    this.log(`开始进行自定义抓取, 共有${customerTaskConfig.configList.length}个任务`)
    // 首先, 将任务进行汇总
    type TypeTaskPackage = {
      [key: string]: Array<string>
    }
    let taskListPackage: TypeTaskPackage = {}
    this.log(`合并抓取任务`)
    for (let taskConfig of customerTaskConfig.configList) {
      let taskType = taskConfig.type
      let targetId = `${taskConfig.id}`
      if (taskConfig.type in taskListPackage === false) {
        taskListPackage[taskType] = []
      }
      switch (taskConfig.type) {
        case 'author-ask-question':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'author-answer':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'author-pin':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'topic':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'collection':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'column':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'article':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'question':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'answer':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'pin':
          taskListPackage[taskConfig.type].push(targetId)
          break
        case 'author-agree-article':
        case 'author-agree-answer':
        case 'author-watch-question':
          taskListPackage[taskConfig.type].push(targetId)
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
          await CommonUtil.asyncAppendPromiseWithDebounce(
            batchFetchAuthorAskQuestion.fetchListAndSaveToDb(targetIdList),
          )
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

export default FetchCustomer
