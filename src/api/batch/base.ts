import Logger from '~/src/library/logger'
import { TaskManager } from '~/src/library/util/common'
import lodash from 'lodash'
import { LogEventCode, LogLevel, LogStage, LogStatus } from '~/src/shared/logging/log_contract'
import {
  createPartialOutcome,
  createSuccessOutcome,
  ExecutionOutcome,
  hasFatalExecutionFailure,
} from '~/src/shared/runtime/execution_outcome'
import { runWithLogCorrelation } from '~/src/shared/runtime/log_correlation_context'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'

let persistJobSequence = 0

export class BatchFetchError extends Error {
  readonly outcome: ExecutionOutcome

  constructor(label: string, outcome: ExecutionOutcome) {
    super(`${label} 批量抓取失败: ${outcome.failureCount}/${outcome.successCount + outcome.failureCount} 个实体失败`)
    this.name = 'BatchFetchError'
    this.outcome = outcome
  }
}

class BaseBatchFetch {
  /**
   * 单次获取的数据条数
   */
  fetchLimit = 20

  /**
   * 获取单个回答,并存入数据库中
   * @param id
   */
  async fetch(id: string): Promise<void | ExecutionOutcome> {
    throw new Error(`${this.constructor.name}.fetch(${id}) 尚未实现`)
  }

  /**
   * 获取回答列表,并存入数据库中
   * @param idList
   */
  async fetchListAndSaveToDb(idList: string[]): Promise<ExecutionOutcome> {
    const label = this.constructor.name
    let index = 0
    let successCount = 0
    const failures: ReturnType<typeof createPartialOutcome>['failures'] = []
    // Parent entities may enqueue their own pagination work. Keep parents
    // sequential in a private manager so nested waits never steal tasks from
    // the legacy global pagination pool.
    const parentTaskManager = new TaskManager({ maxTaskRunner: 1 })
    for (let id of idList) {
      index = index + 1
      let taskIndex = index
      this.log(`添加第${taskIndex}/${idList.length}个抓取任务(${id})`)
      const jobId = `fetch-${label}-${taskIndex}-${id}`
      let asyncTaskFunc = async () => runWithLogCorrelation({ jobId }, async () => {
        const startedAt = Date.now()
        Logger.event({
          eventCode: LogEventCode.FETCH_START,
          stage: LogStage.FETCH,
          status: LogStatus.START,
          level: LogLevel.INFO,
          entityType: label,
          entityId: id,
          message: '开始抓取实体',
        })
        try {
          const nestedOutcome = await this.fetch(id)
          successCount++
          if (nestedOutcome?.status === LogStatus.PARTIAL_SUCCESS) {
            failures.push(...nestedOutcome.failures)
          }
          Logger.event({
            eventCode:
              nestedOutcome?.status === LogStatus.PARTIAL_SUCCESS
                ? LogEventCode.FETCH_PARTIAL_SUCCESS
                : LogEventCode.FETCH_SUCCESS,
            stage: LogStage.FETCH,
            status: nestedOutcome?.status ?? LogStatus.SUCCESS,
            level: nestedOutcome?.status === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
            entityType: label,
            entityId: id,
            durationMs: Date.now() - startedAt,
            message: nestedOutcome?.status === LogStatus.PARTIAL_SUCCESS ? '实体抓取部分完成' : '实体抓取完成',
            details: nestedOutcome ? { outcome: nestedOutcome } : undefined,
          })
          this.log(`第${taskIndex}/${idList.length}个任务(${id})执行完毕`)
        } catch (error) {
          const serializedError = Logger.serializeError(error)
          if (error instanceof BatchFetchError && error.outcome.failures.length > 0) {
            failures.push(
              ...error.outcome.failures.map((failure) => ({
                ...failure,
                entityId: failure.entityId ?? id,
                entityType: failure.entityType ?? label,
              })),
            )
          } else {
            failures.push({
              entityId: id,
              entityType: label,
              error: serializedError,
            })
          }
          Logger.event({
            eventCode: LogEventCode.FETCH_FAILURE,
            stage: LogStage.FETCH,
            status: LogStatus.FAILURE,
            level: LogLevel.ERROR,
            entityType: label,
            entityId: id,
            durationMs: Date.now() - startedAt,
            error: serializedError,
            message: '实体抓取失败',
          })
          this.log(`第${taskIndex}/${idList.length}个任务(${id})执行失败, 错误原因=>`, serializedError)
        }
      })
      // 通过统一的任务中心执行
      parentTaskManager.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await parentTaskManager.asyncWaitAllTaskComplete({
      needTTL: false
    })
    if (failures.length === 0) {
      this.log(`所有抓取任务执行完毕`)
      return createSuccessOutcome(successCount)
    }

    const outcome = createPartialOutcome(successCount, failures)
    if (hasFatalExecutionFailure(failures) || (successCount === 0 && idList.length > 0)) {
      throw new BatchFetchError(label, outcome)
    }
    this.log(`批量抓取部分完成: 成功${successCount}个, 失败${failures.length}个`)
    if (outcome.status !== LogStatus.PARTIAL_SUCCESS) {
      throw new Error('批量抓取结果状态异常')
    }
    return outcome
  }

  protected async persist(
    entityType: string,
    entityId: string,
    action: () => Promise<unknown>,
  ): Promise<void> {
    const jobId = `persist-${entityType}-${entityId}-${++persistJobSequence}`
    await runWithLogCorrelation({ jobId }, async () => {
      const startedAt = Date.now()
      Logger.event({
        eventCode: LogEventCode.PERSIST_START,
        stage: LogStage.PERSIST,
        status: LogStatus.START,
        level: LogLevel.INFO,
        entityType,
        entityId,
        message: '开始持久化实体',
      })
      try {
        await action()
        Logger.event({
          eventCode: LogEventCode.PERSIST_SUCCESS,
          stage: LogStage.PERSIST,
          status: LogStatus.SUCCESS,
          level: LogLevel.INFO,
          entityType,
          entityId,
          durationMs: Date.now() - startedAt,
          message: '实体持久化完成',
        })
      } catch (error) {
        Logger.event({
          eventCode: LogEventCode.PERSIST_FAILURE,
          stage: LogStage.PERSIST,
          status: LogStatus.FAILURE,
          level: LogLevel.ERROR,
          entityType,
          entityId,
          durationMs: Date.now() - startedAt,
          error: Logger.serializeError(error),
          message: '实体持久化失败',
        })
        throw error
      }
    })
  }

  protected async collectNestedBatchOutcome(action: () => Promise<ExecutionOutcome>): Promise<ExecutionOutcome> {
    try {
      return await action()
    } catch (error) {
      if (error instanceof BatchFetchError && hasFatalExecutionFailure(error.outcome.failures) === false) {
        return error.outcome
      }
      throw error
    }
  }

  /**
   * 单实体接口必须返回至少一个稳定标识，空对象不能被当作成功写入数据库。
   */
  protected assertEntityRecord(
    value: unknown,
    entityType: string,
    requestedId: string,
    stableKeyList: string[] = ['id'],
  ): asserts value is Record<string, any> {
    if (value === null || typeof value !== 'object' || Array.isArray(value) || lodash.isEmpty(value)) {
      throw new ApplicationError(
        AppErrorCode.ENTITY_RESPONSE_EMPTY,
        `${entityType} ${requestedId} 返回空数据`,
      )
    }
    const record = value as Record<string, unknown>
    const hasStableIdentifier = stableKeyList.some((key) => {
      const identifier = record[key]
      return (typeof identifier === 'string' || typeof identifier === 'number')
        && String(identifier).trim() !== ''
    })
    if (hasStableIdentifier === false) {
      throw new ApplicationError(
        AppErrorCode.ENTITY_RESPONSE_EMPTY,
        `${entityType} ${requestedId} 缺少稳定标识 ${stableKeyList.join('/')}`,
      )
    }
  }

  /**
   * 简易logger
   * @returns  null
   */
  async log(...argumentList: string[] | any): Promise<any> {
    let message = ''
    for (const rawMessage of argumentList) {
      if (lodash.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    Logger.log(`[${this.constructor.name}] ` + message)
  }
}

export default BaseBatchFetch
