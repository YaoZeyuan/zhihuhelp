import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import AsyncPool from 'tiny-async-pool'

type Type_Asnyc_Task_Runner = (...paramList: any[]) => Promise<any>
const Const_Default_Task_Label = 'default_label_5cbc1b8ca2dd5154437aab1d13f1a079'

type Type_Task_Config = {
  task: Type_Asnyc_Task_Runner,
  taskNo: number,
}

type Type_Task_Pool = {
  taskList: Type_Task_Config[],
  currentTaskNo: number,
}
const Const_Default_Task_Pool: Type_Task_Pool = {
  taskList: [],
  currentTaskNo: 0,
}

// 每计数x次后, 重置任务
class TaskManager {
  private maxTaskRunner = 10

  // 任务超时时间, 走内部配置即可, 不需要全局配置
  private readonly Const_Task_Timeout_ms = 20 * 1000

  /**
   * 按label添加任务队列
   */
  private taskPoolMap: Map<string, Type_Task_Pool> = new Map()

  // 添加任务
  addAsyncTaskFunc({
    asyncTaskFunc,
    label = Const_Default_Task_Label,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    // 用于区分不同任务来源, 方便根据任务来源提供等待所有任务执行完毕的方法
    label?: any
  }) {
    let taskPool = this.taskPoolMap.get(label) ?? {
      ...Const_Default_Task_Pool
    }

    taskPool.currentTaskNo = taskPool.currentTaskNo + 1
    taskPool.taskList.push({
      "task": asyncTaskFunc,
      "taskNo": taskPool.currentTaskNo + 1
    })
    this.taskPoolMap.set(label, taskPool)
    return
  }

  /**
   * 等待所有任务执行完毕
   */
  async asyncWaitAllTaskComplete() {
    for (let key of this.taskPoolMap.keys()) {
      await this.asyncWaitTaskCompleteByLabel(key)
    }
    return true
  }

  /**
   * 等待指定任务label完成
   * @param label
   * @returns
   */
  async asyncWaitTaskCompleteByLabel(label = Const_Default_Task_Label) {
    let taskPool = this.taskPoolMap.get(label) ?? {
      ...Const_Default_Task_Pool
    }
    let taskCompleteCounter = 0
    let taskFailedCounter = 0
    let taskRunningCounter = 0
    let taskTotalCounter = taskPool.taskList.length

    let taskPromiseList = AsyncPool(this.maxTaskRunner, taskPool.taskList, async (asyncRunnerConfig) => {
      await Promise.race(
        [
          async () => {
            taskRunningCounter++
            logger.log(`[开始执行]开始执行第${asyncRunnerConfig.taskNo}个任务, 目前剩余个待完成, 当前任务执行情况:待执行${taskTotalCounter - taskCompleteCounter - taskFailedCounter}个, 执行中${taskRunningCounter}个, 已完成${taskCompleteCounter}个, 已失败${taskFailedCounter}个`)
            await asyncRunnerConfig.task()
            logger.log(`第${asyncRunnerConfig.taskNo}个任务执行完毕`)
            taskCompleteCounter++
          },
          new Promise((reslove, reject) => {
            setTimeout(() => {
              taskFailedCounter++
              reject(new Error(`任务执行超时`))
            }, this.Const_Task_Timeout_ms)
          })
        ]
      ).finally(() => {
        taskRunningCounter--
      })
    })
    for await (const _ of taskPromiseList) {
    }
    return true
  }
}

export default class CommonUtil {
  static taskManager = new TaskManager()

  /**
   * 添加promise到任务队列
   */
  static addAsyncTaskFunc({
    asyncTaskFunc,
    label = Const_Default_Task_Label,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    label?: any
  }) {
    this.taskManager.addAsyncTaskFunc({ asyncTaskFunc, label })
    return
  }

  /**
   * 等待所有任务执行完毕
   *
   * 由于项目只有一个开发者, 整个进程为单进程模型, 不会出现一边加任务, 一边等待所有任务完成的极端case, 所以可以一次性等待两个队列的执行完成
   * 线上项目不能这么做
   */
  static async asyncWaitAllTaskComplete() {
    await this.taskManager.asyncWaitAllTaskComplete()
    return
  }

  /**
   * 等待指定label下所有任务执行完毕
   */
  static async asyncWaitAllTaskCompleteByLabel(label: any) {
    await this.taskManager.asyncWaitTaskCompleteByLabel(label)
  }

  /**
   * 延迟执行函数, 返回一个 Promise
   * @param {number} ms
   */
  static async asyncSleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  static getUuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(36)
        .substring(1)
    }

    let uuid = `${s4()}-${s4()}-${s4()}-${s4()}`
    return uuid
  }

  static getConfig(): Type_TaskConfig.Type_Task_Config {
    if (fs.existsSync(PathConfig.configUri) === false) {
      // 没有就初始化一份
      fs.writeFileSync(PathConfig.configUri, JSON.stringify(Const_TaskConfig.Const_Default_Config, null, 2))
    }
    let configJson = fs.readFileSync(PathConfig.configUri)?.toString() ?? ''
    let config: Type_TaskConfig.Type_Task_Config
    try {
      config = JSON.parse(configJson)
    } catch (e) {
      config = {
        ...Const_TaskConfig.Const_Default_Config,
      }
    }
    return config
  }

  static saveConfig(config: Type_TaskConfig.Type_Task_Config) {
    fs.writeFileSync(PathConfig.configUri, JSON.stringify(config, null, 2))
    return
  }

  /**
   *
   * @param rawFilename
   */
  static encodeFilename(rawFilename: string) {
    let encodeFilename = rawFilename
    let illegalCharMap = {
      '\\': '＼',
      '/': '／',
      ':': '：',
      '*': '＊',
      '?': '？',
      '=': '＝',
      '%': '％',
      '+': '＋',
      '<': '《',
      '>': '》',
      '|': '｜',
      '"': '〃',
      '!': '！',
      '\n': '',
      '\r': '',
      '&': '＆',
    }

    type Type_Key = keyof typeof illegalCharMap

    for (let key of Object.keys(illegalCharMap)) {
      let legalChar: string = illegalCharMap?.[key as Type_Key] ?? ''
      // 全局替换, 将非法文件名替换为合法Unicode字符
      encodeFilename = encodeFilename.replaceAll(`${key}`, legalChar)
    }
    return encodeFilename
  }
}
