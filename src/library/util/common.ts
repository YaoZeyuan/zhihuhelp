import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import AsyncPool from 'tiny-async-pool'
import md5 from 'md5'

type Type_Asnyc_Task_Runner = (...paramList: any[]) => Promise<any>

type Type_Task_Config = {
  /**
   * 待执行任务函数
   */
  asyncTask: Type_Asnyc_Task_Runner,
  /**
   * 任务所属轮次
   */
  taskLoopNo: number,
  /**
   * 本轮任务的序号
   */
  taskNo: number,
  /**
   * 任务uuid
   */
  uuid: string
  /**
   * 任务状态
   */
  state: "pending" | "running" | "success" | "fail"
}

type Type_Task_Pool = {
  taskList: Type_Task_Config[],
  currentTaskNo: number,
}
const getDefaultTaskPool = (): Type_Task_Pool => {
  return {
    taskList: [],
    currentTaskNo: 0,
  }
}

// 每计数x次后, 重置任务
class TaskManager {
  private maxTaskRunner = 10

  private currentTaskLoopNo = 0

  private globalDispatchTaskCounter = 0

  // 任务超时时间, 走内部配置即可, 不需要全局配置
  private readonly Const_Task_Timeout_ms = 20 * 1000

  /**
   * 按label添加任务队列
   */
  private taskWithProtectPool: Type_Task_Pool = getDefaultTaskPool()

  /**
  * 按label添加任务队列
  */
  private directTaskPool: Type_Task_Pool = getDefaultTaskPool()

  /**
   * 任务保护配置
   */
  private protectConfig = {
    perTask2Protect: 10,
    protectMs: 10 * 1000,
  }

  // 添加任务
  addAsyncTaskFunc({
    asyncTaskFunc,
    needProtect = false,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    needProtect: boolean
  }) {
    let taskPool: Type_Task_Pool = needProtect === true ? this.taskWithProtectPool
      : this.directTaskPool

    taskPool.currentTaskNo = taskPool.currentTaskNo + 1
    taskPool.taskList.push({
      "asyncTask": asyncTaskFunc,
      "taskNo": taskPool.currentTaskNo,
      "taskLoopNo": this.currentTaskLoopNo,
      "uuid": CommonUtil.getUuid(),
      "state": "pending",
    })
    return
  }

  /**
   * 等待所有任务执行完毕
   */
  async asyncWaitAllTaskComplete({
    needTTL
  }: {
    /**
    * 基本原则为: 单个抓取任务需要配置超时时间, 向下分配任务不需配置超时时间
    */
    needTTL: boolean
  }) {
    this.currentTaskLoopNo++
    const taskLoopNo = this.currentTaskLoopNo

    // 开始执行任务后, 需要重置任务池, 避免新添加的任务影响到当前任务的执行
    const directTaskPool = this.directTaskPool
    const taskWithProtectPool = this.taskWithProtectPool
    this.directTaskPool = getDefaultTaskPool()
    this.taskWithProtectPool = getDefaultTaskPool()

    logger.log(`开始执行第${taskLoopNo}轮任务`)
    logger.log(`[第${taskLoopNo}轮任务1/2]执行无需等待的任务`)
    await this.dispatchTask({
      taskPool: directTaskPool,
      needProtect: false,
      needTTL: needTTL
    })
    logger.log(`[第${taskLoopNo}轮任务1/2]所有无需等待的任务执行完毕`)

    logger.log(`[第${taskLoopNo}轮任务2/2]执行需间隔中断的任务`)
    await this.dispatchTask({
      taskPool: taskWithProtectPool,
      needProtect: true,
      needTTL: needTTL
    })
    logger.log(`[第${taskLoopNo}轮任务2/2]所有需间隔中断的任务执行完毕`)
    logger.log(`[第${taskLoopNo}轮任务]所有任务执行完毕`)
    return true
  }

  private async dispatchTask({
    taskPool,
    needProtect,
    needTTL
  }: {
    taskPool: Type_Task_Pool,
    needProtect: boolean,
    /**
     * 是否需要设置任务超时时间
     */
    needTTL: boolean
  }) {
    let taskCompleteCounter = 0
    let taskFailedCounter = 0
    let taskRunningCounter = 0
    let taskTotalCounter = taskPool.taskList.length

    let taskPromiseList = AsyncPool(this.maxTaskRunner, taskPool.taskList, async (asyncRunnerConfig) => {
      let asyncRunner = async () => {
        taskRunningCounter++
        logger.log(`[uuid:${asyncRunnerConfig.uuid}]开始执行第${asyncRunnerConfig.taskLoopNo}轮第${asyncRunnerConfig.taskNo}个任务, 当前任务执行情况:待执行${taskTotalCounter - taskCompleteCounter - taskFailedCounter}个, 执行中${taskRunningCounter}个, 已完成${taskCompleteCounter}个, 已失败${taskFailedCounter}个`)
        asyncRunnerConfig.state = "running"
        await asyncRunnerConfig.asyncTask()
        logger.log(`[uuid:${asyncRunnerConfig.uuid}]第${asyncRunnerConfig.taskLoopNo}轮第${asyncRunnerConfig.taskNo}个任务执行完毕`)
        taskCompleteCounter++
      }
      await Promise.race(
        [
          asyncRunner(),
          new Promise((reslove, reject) => {
            if (needTTL) {
              // 只在需要设置超时时间时启用
              setTimeout(() => {
                taskFailedCounter++
                reject(new Error(`任务执行超时`))
              }, this.Const_Task_Timeout_ms)
            }
          })
        ]
      ).then(() => {
        asyncRunnerConfig.state = "success"
      }).catch(() => {
        asyncRunnerConfig.state = "fail"
      }).finally(() => {
        taskRunningCounter--
      })
    })


    for await (const _ of taskPromiseList) {
      this.globalDispatchTaskCounter++
      // 需要保护的任务, 每次执行完毕后, 需要等待一段时间(只能暂停派发任务, 已派发的任务无法中止)
      if (this.globalDispatchTaskCounter % this.protectConfig.perTask2Protect === 0 && needProtect === true) {
        logger.log(`当前已累计派发${this.globalDispatchTaskCounter}个任务, 暂停派发任务${this.protectConfig.protectMs / 1000}秒, 以保护知乎服务器`)
        await CommonUtil.asyncSleep(this.protectConfig.protectMs)
        logger.log(`休眠完毕, 继续执行剩余任务`)
      }
    }
    logger.log(`所有任务执行完毕`)
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
  static async asyncWaitAllTaskComplete({
    needTTL
  }: {
    /**
     * 基本原则为: 单个抓取任务需要配置超时时间, 向下分配任务不需配置超时时间
     */
    needTTL: boolean
  }) {
    await this.taskManager.asyncWaitAllTaskComplete({
      needTTL
    })
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
      // hack掉, 解决图片中包含／时, 文件名中不带／的导致找不到对应图片的问题
      '/': '',
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
