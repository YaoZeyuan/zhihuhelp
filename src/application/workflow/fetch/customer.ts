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
import { BatchFetchError } from '~/src/api/batch/base'
import Logger from '~/src/library/logger'
import { RunContext } from '~/src/shared/runtime/run_context'
import lodash from 'lodash'
import {
  LogEventCode,
  LogLevel,
  LogStage,
  LogStatus,
  StructuredLogEntry,
} from '~/src/shared/logging/log_contract'
import {
  createPartialOutcome,
  createSuccessOutcome,
  ExecutionOutcome,
  hasFatalExecutionFailure,
} from '~/src/shared/runtime/execution_outcome'

type BatchFetcher = {
  fetchListAndSaveToDb(idList: string[]): Promise<ExecutionOutcome>
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
  async execute(customerTaskConfig: TypeTaskConfig.Type_Task_Config, context?: RunContext): Promise<ExecutionOutcome> {
    let successCount = 0
    const failureList: ExecutionOutcome['failures'] = []
    const planJobId = 'fetch-plan'
    RequestConfig.setRequestConfig(customerTaskConfig.requestConfig)
    this.event(context, {
      jobId: planJobId,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '加载抓取配置',
      details: this.summarizeFetchConfig(customerTaskConfig),
    })
    this.log(`开始进行自定义抓取, 共有${customerTaskConfig.fetchTaskList.length}个任务`)

    const taskListPackage = this.mergeTaskList(customerTaskConfig.fetchTaskList, context)
    this.event(context, {
      jobId: planJobId,
      status: LogStatus.SUCCESS,
      level: LogLevel.INFO,
      message: '抓取任务合并完成',
      details: {
        taskPackage: this.summarizeTaskPackage(taskListPackage),
      },
    })
    this.log(`抓取任务合并完毕, 最终结果为=>`, taskListPackage)
    this.log(`开始派发自定义任务=>`)

    for (const taskType of Object.keys(taskListPackage)) {
      const targetIdList = [...taskListPackage[taskType].values()]
      const fetcher = this.createBatchFetcher(taskType)
      if (fetcher === undefined) {
        this.event(context, {
          status: LogStatus.SKIP,
          level: LogLevel.WARN,
          message: '跳过不支持的抓取任务类型',
          taskType,
          details: {
            taskType,
            targetIdList,
          },
        })
        this.log(`不支持的任务类型:${taskType}, 自动跳过`)
        continue
      }
      const startedAt = Date.now()
      const taskJobId = `fetch-type-${taskType}`
      this.event(context, {
        jobId: taskJobId,
        status: LogStatus.START,
        level: LogLevel.INFO,
        message: '开始执行批量抓取',
        taskType,
        details: {
          taskType,
          targetIdCount: targetIdList.length,
          targetIdList,
          fetcher: fetcher.constructor.name,
        },
      })
      try {
        const outcome = await fetcher.fetchListAndSaveToDb(targetIdList)
        successCount += outcome.successCount
        failureList.push(...outcome.failures.map((failure) => ({ ...failure, taskType })))
        this.event(context, {
          jobId: taskJobId,
          eventCode:
            outcome.status === LogStatus.PARTIAL_SUCCESS
              ? LogEventCode.FETCH_PARTIAL_SUCCESS
              : LogEventCode.FETCH_SUCCESS,
          status: outcome.status,
          level: outcome.status === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
          message: outcome.status === LogStatus.PARTIAL_SUCCESS ? '批量抓取部分完成' : '批量抓取完成',
          taskType,
          durationMs: Date.now() - startedAt,
          details: {
            taskType,
            targetIdCount: targetIdList.length,
            targetIdList,
            fetcher: fetcher.constructor.name,
            successCount: outcome.successCount,
            failureCount: outcome.failureCount,
            failures: outcome.failures,
          },
        })
      } catch (error) {
        if (error instanceof BatchFetchError && hasFatalExecutionFailure(error.outcome.failures) === false) {
          failureList.push(...error.outcome.failures.map((failure) => ({ ...failure, taskType })))
          this.event(context, {
            jobId: taskJobId,
            eventCode: LogEventCode.FETCH_PARTIAL_SUCCESS,
            status: LogStatus.PARTIAL_SUCCESS,
            level: LogLevel.WARN,
            message: '当前任务类型没有成功实体，继续处理其他任务类型',
            taskType,
            durationMs: Date.now() - startedAt,
            details: {
              taskType,
              targetIdCount: targetIdList.length,
              successCount: error.outcome.successCount,
              failureCount: error.outcome.failureCount,
              failures: error.outcome.failures,
            },
          })
          continue
        }
        this.event(context, {
          jobId: taskJobId,
          status: LogStatus.FAILURE,
          level: LogLevel.ERROR,
          message: '批量抓取失败',
          taskType,
          durationMs: Date.now() - startedAt,
          error: Logger.serializeError(error),
          details: {
            taskType,
            targetIdCount: targetIdList.length,
            targetIdList,
            fetcher: fetcher.constructor.name,
          },
        })
        throw error
      }
    }

    const finalOutcome =
      failureList.length > 0
        ? createPartialOutcome(successCount, failureList)
        : createSuccessOutcome(successCount)
    if (hasFatalExecutionFailure(finalOutcome.failures)) {
      throw new BatchFetchError('FetchWorkflow', finalOutcome)
    }
    this.event(context, {
      status: LogStatus.PROGRESS,
      level: finalOutcome.status === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
      message: finalOutcome.status === LogStatus.PARTIAL_SUCCESS ? '自定义抓取任务部分完成' : '自定义抓取任务全部完成',
      details: {
        taskPackage: this.summarizeTaskPackage(taskListPackage),
        successCount: finalOutcome.successCount,
        failureCount: finalOutcome.failureCount,
        failures: finalOutcome.failures,
      },
    })
    this.log(`自定义任务抓取完毕`)
    return finalOutcome
  }

  private mergeTaskList(fetchTaskList: TypeTaskConfig.Type_Fetch_Task_Config_Item[], context?: RunContext): TaskPackage {
    const taskListPackage: TaskPackage = {}
    this.log(`合并抓取任务`)

    for (const [index, fetchTaskConfig] of fetchTaskList.entries()) {
      if (fetchTaskConfig.skipFetch) {
        this.event(context, {
          status: LogStatus.SKIP,
          level: LogLevel.INFO,
          message: '配置要求跳过抓取任务',
          taskType: fetchTaskConfig.type,
          entityId: `${fetchTaskConfig.id}`,
          details: {
            index,
            type: fetchTaskConfig.type,
            id: `${fetchTaskConfig.id}`,
            rawInputText: fetchTaskConfig.rawInputText,
            comment: fetchTaskConfig.comment,
          },
        })
        continue
      }
      const taskType = fetchTaskConfig.type
      const targetId = `${fetchTaskConfig.id}`
      if (taskType in taskListPackage === false) {
        taskListPackage[taskType] = new Set()
      }

      if (this.isSupportedTaskType(taskType) === false) {
        this.event(context, {
          status: LogStatus.SKIP,
          level: LogLevel.WARN,
          message: '配置中存在不支持的抓取任务类型',
          taskType,
          entityId: targetId,
          details: {
            index,
            type: fetchTaskConfig.type,
            id: targetId,
            rawInputText: fetchTaskConfig.rawInputText,
            comment: fetchTaskConfig.comment,
          },
        })
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

  private event(
    context: RunContext | undefined,
    entry: Omit<StructuredLogEntry, 'runId' | 'traceId' | 'stage'>,
  ): void {
    Logger.event({
      runId: context?.runId,
      traceId: context?.traceId,
      stage: LogStage.FETCH,
      ...entry,
    })
  }

  private summarizeFetchConfig(customerTaskConfig: TypeTaskConfig.Type_Task_Config): { [key: string]: unknown } {
    return {
      request: {
        uaLength: customerTaskConfig.requestConfig.ua.length,
        hasCookie: customerTaskConfig.requestConfig.cookie.trim().length > 0,
        cookieLength: customerTaskConfig.requestConfig.cookie.length,
      },
      taskCount: customerTaskConfig.fetchTaskList.length,
      enabledTaskCount: customerTaskConfig.fetchTaskList.filter((task) => task.skipFetch === false).length,
      skippedTaskCount: customerTaskConfig.fetchTaskList.filter((task) => task.skipFetch).length,
      tasks: customerTaskConfig.fetchTaskList.map((task, index) => ({
        index,
        type: task.type,
        id: `${task.id}`,
        rawInputText: task.rawInputText,
        comment: task.comment,
        skipFetch: task.skipFetch,
      })),
    }
  }

  private summarizeTaskPackage(taskListPackage: TaskPackage): { [key: string]: unknown }[] {
    return Object.keys(taskListPackage).map((taskType) => {
      const targetIdList = [...taskListPackage[taskType].values()]
      return {
        taskType,
        targetIdCount: targetIdList.length,
        targetIdList,
      }
    })
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
