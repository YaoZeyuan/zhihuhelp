import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import AsyncPool from 'tiny-async-pool'

type Type_Asnyc_Task_Runner = (...paramList: any[]) => Promise<any>

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
  private taskWithProtectPool: Type_Task_Pool = {
    ...Const_Default_Task_Pool
  }

  /**
  * 按label添加任务队列
  */
  private directTaskPool: Type_Task_Pool = {
    ...Const_Default_Task_Pool
  }

  // 添加任务
  addAsyncTaskFunc({
    asyncTaskFunc,
    needProtect = false,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    needProtect: boolean
  }) {
    let taskPool: Type_Task_Pool = needProtect === true ? this.taskWithProtectPool : this.directTaskPool

    taskPool.currentTaskNo = taskPool.currentTaskNo + 1
    taskPool.taskList.push({
      "task": asyncTaskFunc,
      "taskNo": taskPool.currentTaskNo
    })
    return
  }

  /**
   * 等待所有任务执行完毕
   */
  async asyncWaitAllTaskComplete() {
    logger.log(`开始执行任务`)

    logger.log(`setp1: 执行无需等待的任务`)
    await this.dispatchTask(this.directTaskPool, false)
    logger.log(`所有无需等待的任务执行完毕`)

    logger.log(`setp2: 执行需间隔中断的任务`)
    await this.dispatchTask(this.taskWithProtectPool, true)
    logger.log(`所有需间隔中断的任务执行完毕`)
    logger.log(`所有任务执行完毕`)
    return true
  }

  private async dispatchTask(taskPool: Type_Task_Pool, needProtect: boolean) {
    // 需要保护的任务, 每次执行完毕后, 需要等待3秒
    let protectMs = needProtect === true ? 3000 : 0

    let taskCompleteCounter = 0
    let taskFailedCounter = 0
    let taskRunningCounter = 0
    let taskTotalCounter = taskPool.taskList.length

    let taskPromiseList = AsyncPool(this.maxTaskRunner, taskPool.taskList, async (asyncRunnerConfig) => {
      logger.log(`启动任务${asyncRunnerConfig.taskNo}`)
      let asyncRunner = async () => {
        taskRunningCounter++
        logger.log(`[开始执行]开始执行第${asyncRunnerConfig.taskNo}个任务, 当前任务执行情况:待执行${taskTotalCounter - taskCompleteCounter - taskFailedCounter}个, 执行中${taskRunningCounter}个, 已完成${taskCompleteCounter}个, 已失败${taskFailedCounter}个`)
        await asyncRunnerConfig.task()
        logger.log(`第${asyncRunnerConfig.taskNo}个任务执行完毕`)
        taskCompleteCounter++
      }
      await Promise.race(
        [
          asyncRunner(),
          new Promise((reslove, reject) => {
            setTimeout(() => {
              taskFailedCounter++
              reject(new Error(`任务执行超时`))
            }, this.Const_Task_Timeout_ms)
          })
        ]
      ).catch(() => { }).finally(() => {
        taskRunningCounter--
      })
    })

    let promiseCounter = 0
    for await (const _ of taskPromiseList) {
      promiseCounter++
      if (promiseCounter % 5 === 0 && needProtect === true) {
        logger.log(`当前已执行${promiseCounter}个任务, 执行全局休眠策略, 休眠${protectMs / 1000}秒`)
        await CommonUtil.asyncSleep(protectMs)
        logger.log(`休眠完毕, 继续执行剩余任务`)
      }
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
    needProtect = false,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    needProtect: boolean,
  }) {
    this.taskManager.addAsyncTaskFunc({ asyncTaskFunc, needProtect })
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
