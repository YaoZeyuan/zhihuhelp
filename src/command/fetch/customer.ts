import Base from '~/src/command/base'
import * as Type_Task_Config from '~/src/type/task_config'
import * as Const_Task_Config from '~/src/constant/task_config'
import PathConfig from '~/src/config/path'
import fs from 'fs'
import BatchFetchAnswer from '~/src/api/batch/answer'
import BatchFetchArticle from '~/src/api/batch/article'
import BatchFetchAuthorActivity from '~/src/api/batch/author_activity'
import BatchFetchAuthorAnswer from '~/src/api/batch/author_answer'
import BatchFetchAuthorArticle from '~/src/api/batch/author_article'
import BlockAccountAnswer from '~/src/api/batch/block_account_answer'
import BatchFetchAuthorAskQuestion from '~/src/api/batch/author_ask_question'
import BatchFetchAuthorPin from '~/src/api/batch/author_pin'
import BatchFetchCollection from '~/src/api/batch/collection'
import BatchFetchColumn from '~/src/api/batch/column'
import BatchFetchPin from '~/src/api/batch/pin'
import BatchFetchQuestion from '~/src/api/batch/question'
import BatchFetchTopic from '~/src/api/batch/topic'
import json5 from 'json5'

class FetchCustomer extends Base {
  public static commandName = 'Fetch:Customer'
  public static description = `从${PathConfig.configUri}中读取自定义抓取任务并执行`

  async execute(): Promise<any> {
    this.log(`从${PathConfig.configUri}中读取配置文件`)
    let fetchConfigJSON = fs.readFileSync(PathConfig.configUri).toString()
    this.log('content =>', fetchConfigJSON)
    let customerTaskConfig: Type_Task_Config.Type_Task_Config = json5.parse(fetchConfigJSON)
    this.log(`开始进行自定义抓取, 共有${customerTaskConfig.fetchTaskList.length}个任务`)
    // 首先, 将任务进行汇总
    type TypeTaskPackage = {
      [key: string]: Set<string>
    }
    let taskListPackage: TypeTaskPackage = {}
    this.log(`合并抓取任务`)
    for (let fetchTaskConfig of customerTaskConfig.fetchTaskList) {
      if (fetchTaskConfig.skipFetch) {
        // 跳过不抓取的任务
        continue
      }
      let taskType = fetchTaskConfig.type
      let targetId = `${fetchTaskConfig.id}`
      if (fetchTaskConfig.type in taskListPackage === false) {
        taskListPackage[taskType] = new Set()
      }
      switch (fetchTaskConfig.type) {
        case Const_Task_Config.Const_Task_Type_用户提问过的所有问题:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_用户的所有回答:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_用户发布的所有文章:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_销号用户的所有回答:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_用户发布的所有想法:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_话题:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_收藏夹:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_专栏:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_文章:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_问题:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_回答:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_想法:
          taskListPackage[fetchTaskConfig.type].add(targetId)
          break
        case Const_Task_Config.Const_Task_Type_用户赞同过的所有文章:
        case Const_Task_Config.Const_Task_Type_用户赞同过的所有回答:
        case Const_Task_Config.Const_Task_Type_用户关注过的所有问题:
          if (taskListPackage[fetchTaskConfig.type].has(targetId) === false) {
            // 抓取用户活动记录工作量巨大, 因此在生成抓取任务时进行去重处理
            taskListPackage[fetchTaskConfig.type].add(targetId)
          }
          break
        default:
          this.log(`不支持的任务类型:${fetchTaskConfig.type}, 自动跳过`)
      }
    }

    this.log(`抓取任务合并完毕, 最终结果为=>`, taskListPackage)

    this.log(`开始派发自定义任务=>`)

    for (let taskType of Object.keys(taskListPackage)) {
      let targetIdList = [...taskListPackage[taskType].values()]
      switch (taskType) {
        case Const_Task_Config.Const_Task_Type_用户提问过的所有问题:
          let batchFetchAuthorAskQuestion = new BatchFetchAuthorAskQuestion()
          await batchFetchAuthorAskQuestion.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_用户的所有回答:
          let batchFetchAuthorAnswer = new BatchFetchAuthorAnswer()
          await batchFetchAuthorAnswer.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_用户发布的所有文章:
          let batchFetchAuthorArticle = new BatchFetchAuthorArticle()
          await batchFetchAuthorArticle.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_销号用户的所有回答:
          let blockAccountAnswer = new BlockAccountAnswer()
          await blockAccountAnswer.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_用户发布的所有想法:
          let batchFetchAuthorPin = new BatchFetchAuthorPin()
          await batchFetchAuthorPin.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_话题:
          let batchFetchTopic = new BatchFetchTopic()
          await batchFetchTopic.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_收藏夹:
          let batchFetchCollection = new BatchFetchCollection()
          await batchFetchCollection.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_专栏:
          let batchFetchColumn = new BatchFetchColumn()
          await batchFetchColumn.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_文章:
          let batchFetchArticle = new BatchFetchArticle()
          await batchFetchArticle.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_问题:
          let batchFetchQuestion = new BatchFetchQuestion()
          await batchFetchQuestion.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_回答:
          let batchFetchAnswer = new BatchFetchAnswer()
          await batchFetchAnswer.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_想法:
          let batchFetchPin = new BatchFetchPin()
          await batchFetchPin.fetchListAndSaveToDb(targetIdList)
          break
        case Const_Task_Config.Const_Task_Type_用户赞同过的所有文章:
        case Const_Task_Config.Const_Task_Type_用户赞同过的所有回答:
        case Const_Task_Config.Const_Task_Type_用户关注过的所有问题:
          let batchFetchAuthorActivity = new BatchFetchAuthorActivity()
          await batchFetchAuthorActivity.fetchListAndSaveToDb(targetIdList)
          break
        default:
          this.log(`不支持的任务类型:${taskType}, 自动跳过`)
      }
    }
    this.log(`自定义任务抓取完毕`)
  }
}

export default FetchCustomer
