import * as TypeTaskConfig from '~/src/type/task_config'
import * as ConstTaskConfig from '~/src/constant/task_config'
import RequestConfig from '~/src/config/request'
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
import Logger from '~/src/library/logger'
import lodash from 'lodash'

type BatchFetcher = {
  fetchListAndSaveToDb(idList: string[]): Promise<void>
}

type TaskPackage = {
  [taskType: string]: Set<string>
}

const authorActivityTaskTypeList = [
  ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章,
  ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答,
  ConstTaskConfig.Const_Task_Type_用户关注过的所有问题,
]

/**
 * 执行自定义抓取任务。
 *
 * 该 workflow 负责合并配置中的任务并派发到抓取实现。知乎请求和入库仍由
 * 现有 batch/model 模块承载，后续可继续下沉到 gateway/repository。
 */
export default class FetchWorkflow {
  async execute(customerTaskConfig: TypeTaskConfig.Type_Task_Config): Promise<void> {
    RequestConfig.setRequestConfig(customerTaskConfig.requestConfig)
    this.log(`开始进行自定义抓取, 共有${customerTaskConfig.fetchTaskList.length}个任务`)

    const taskListPackage = this.mergeTaskList(customerTaskConfig.fetchTaskList)
    this.log(`抓取任务合并完毕, 最终结果为=>`, taskListPackage)
    this.log(`开始派发自定义任务=>`)

    for (const taskType of Object.keys(taskListPackage)) {
      const targetIdList = [...taskListPackage[taskType].values()]
      const fetcher = this.createBatchFetcher(taskType)
      if (fetcher === undefined) {
        this.log(`不支持的任务类型:${taskType}, 自动跳过`)
        continue
      }
      await fetcher.fetchListAndSaveToDb(targetIdList)
    }

    this.log(`自定义任务抓取完毕`)
  }

  private mergeTaskList(fetchTaskList: TypeTaskConfig.Type_Fetch_Task_Config_Item[]): TaskPackage {
    const taskListPackage: TaskPackage = {}
    this.log(`合并抓取任务`)

    for (const fetchTaskConfig of fetchTaskList) {
      if (fetchTaskConfig.skipFetch) {
        continue
      }
      const taskType = fetchTaskConfig.type
      const targetId = `${fetchTaskConfig.id}`
      if (taskType in taskListPackage === false) {
        taskListPackage[taskType] = new Set()
      }

      if (this.isSupportedTaskType(taskType) === false) {
        this.log(`不支持的任务类型:${fetchTaskConfig.type}, 自动跳过`)
        continue
      }

      if (authorActivityTaskTypeList.includes(taskType as typeof authorActivityTaskTypeList[number])) {
        taskListPackage[taskType].add(targetId)
        continue
      }

      taskListPackage[taskType].add(targetId)
    }

    return taskListPackage
  }

  private isSupportedTaskType(taskType: string): boolean {
    return this.createBatchFetcher(taskType) !== undefined
  }

  private createBatchFetcher(taskType: string): BatchFetcher | undefined {
    switch (taskType) {
      case ConstTaskConfig.Const_Task_Type_用户提问过的所有问题:
        return new BatchFetchAuthorAskQuestion()
      case ConstTaskConfig.Const_Task_Type_用户的所有回答:
        return new BatchFetchAuthorAnswer()
      case ConstTaskConfig.Const_Task_Type_用户发布的所有文章:
        return new BatchFetchAuthorArticle()
      case ConstTaskConfig.Const_Task_Type_销号用户的所有回答:
        return new BlockAccountAnswer()
      case ConstTaskConfig.Const_Task_Type_用户发布的所有想法:
        return new BatchFetchAuthorPin()
      case ConstTaskConfig.Const_Task_Type_话题:
        return new BatchFetchTopic()
      case ConstTaskConfig.Const_Task_Type_收藏夹:
        return new BatchFetchCollection()
      case ConstTaskConfig.Const_Task_Type_专栏:
        return new BatchFetchColumn()
      case ConstTaskConfig.Const_Task_Type_文章:
        return new BatchFetchArticle()
      case ConstTaskConfig.Const_Task_Type_问题:
        return new BatchFetchQuestion()
      case ConstTaskConfig.Const_Task_Type_回答:
        return new BatchFetchAnswer()
      case ConstTaskConfig.Const_Task_Type_想法:
        return new BatchFetchPin()
      case ConstTaskConfig.Const_Task_Type_用户赞同过的所有文章:
      case ConstTaskConfig.Const_Task_Type_用户赞同过的所有回答:
      case ConstTaskConfig.Const_Task_Type_用户关注过的所有问题:
        return new BatchFetchAuthorActivity()
      default:
        return undefined
    }
  }

  private log(...argumentList: unknown[]): void {
    let message = ''
    for (const rawMessage of argumentList) {
      if (lodash.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    Logger.log(`[FetchWorkflow] ` + message)
  }
}
