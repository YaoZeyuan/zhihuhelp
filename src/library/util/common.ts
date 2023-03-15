import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import CommonConfig from '~/src/config/common'

type Type_Asnyc_Task_Runner = (...paramList: any[]) => Promise<any>
const Const_Default_Task_Runner: Type_Asnyc_Task_Runner = async () => { }
const Const_Default_Task_Label = Symbol('default_label')

// 每计数x次后, 重置任务
class TaskManager {
  private maxTaskRunner = 10

  // 当前正在执行的任务数
  private runingRunner = 0

  // 任务派发数
  private taskDispatchCounter = 0
  // 任务完成数
  private taskCompleteCounter = 0

  // 总任务计数器, 递增, 无实际意义
  private taskCounter = 0

  // 任务超时时间, 走内部配置即可, 不需要全局配置
  private readonly Const_Task_Timeout_ms = 20 * 1000
  // 最大记录的任务派发数/执行数, 超过该数自动重置计数器
  private readonly Const_Max_Task_Counter = 10000 * 10000 * 10000

  /**
   * 按label统计加入任务已完成的任务数, 和总任务数
   */
  private taskStateMapByLabel: Map<
    // 任意key
    any,
    {
      // 总任务数
      total: number
      // 已完成任务数
      complete: number
    }
  > = new Map()

  private taskList: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    label: any
    taskNo: number
  }[] = []

  /**
   * 是否暂停运行
   */
  private isSuspend = false

  /**
   * 保护配置
   */
  private protectedConfig = {
    needProtect: false,
    protectLoopCounter: 10,
    protect2wait_ms: 1,
  }

  /**
   *
   * @param param0
   */
  constructor({
    protectConfig = {
      // 是否需要保护
      needProtect: false,
      // 每完成多少个任务进行一次保护
      protectLoopCounter: 10,
      // 每次保护的等待时长
      protect2wait_ms: 1000,
    },
  }) {
    // 将配置进一步解构出来
    let {
      // 是否需要保护
      needProtect = false,
      // 每完成多少个任务进行一次保护
      protectLoopCounter = 10,
      // 每次保护的等待时长
      protect2wait_ms = 1000,
    } = protectConfig

    this.protectedConfig.needProtect = needProtect
    this.protectedConfig.protect2wait_ms = protect2wait_ms
    this.protectedConfig.protectLoopCounter = protectLoopCounter
  }

  canBeRun() {
    return this.isSuspend === false && this.runingRunner < this.maxTaskRunner
  }

  async runner() {
    // 先检查能否运行
    let canBeRun = this.canBeRun()
    while (canBeRun === false) {
      await CommonUtil.asyncSleep(1000)
      canBeRun = this.canBeRun()
    }

    // 当前总任务数
    let totalTaskCount = this.taskList.length
    // 是否有任务需要执行
    let hasTaskToRun = totalTaskCount > 0

    if (hasTaskToRun === false) {
      // 没有任务需要执行, 直接返回即可
      return
    }

    // 正在执行任务数+1
    this.runingRunner++

    let taskConfig = this.taskList.pop() ?? {
      asyncTaskFunc: Const_Default_Task_Runner,
      label: Const_Default_Task_Label,
      taskNo: 0,
    }
    let { asyncTaskFunc = Const_Default_Task_Runner, label = Const_Default_Task_Label } = taskConfig
    logger.log(`[开始执行]开始执行第${taskConfig.taskNo}个任务, 当前剩余${this.taskList.length}个任务待执行`)

    await Promise.race([
      asyncTaskFunc(),
      new Promise((reslove, reject) => {
        setTimeout(() => {
          reject(new Error(`任务执行超时`))
        }, this.Const_Task_Timeout_ms)
      }),
    ]).catch((e) => {
      logger.log(`[执行异常]第${taskConfig.taskNo}个任务执行失败, 报错信息为: ${e}`)
    })

    // 正在执行任务数-1
    this.runingRunner--

    // 更新任务计数
    let labelCounter = this.taskStateMapByLabel.get(label) ?? {
      complete: 0,
      total: 1,
    }
    labelCounter.complete = labelCounter.complete + 1
    this.taskStateMapByLabel.set(label, labelCounter)

    logger.log(`[执行完成]任务id:${taskConfig.taskNo}执行完成, 当前剩余${this.taskList.length}个任务待执行`)

    // 累加任务计数器(不考虑溢出的情况)
    this.taskCompleteCounter++

    if (this.taskCompleteCounter > this.Const_Max_Task_Counter) {
      logger.log(`[重置任务完成数]任务完成数已抵达阈值${this.Const_Max_Task_Counter}, 自动重置`)
      // 运行次数足够多后, 重置任务计数器
      this.taskCompleteCounter = 0
    }
  }

  /**
   * 整体休眠sleep_ms, 期间不会执行新任务, 以便保护知乎服务器
   * @param sleep_ms
   */
  async suspendAllTask(sleep_ms: number) {
    this.isSuspend = true
    logger.log(
      `[任务暂停]已派发${this.taskDispatchCounter}个任务, 其中${this.taskCompleteCounter}个任务已执行完毕, 休眠${sleep_ms / 1000
      }秒, 当前有${this.taskDispatchCounter - this.taskCompleteCounter}个任务执行中, 剩余${this.taskList.length}个任务待执行`,
    )
    while (this.runingRunner > 0) {
      logger.log(`[任务暂停]当前正在执行任务数${this.runingRunner}, 已派发${this.taskDispatchCounter}个任务, 其中${this.taskCompleteCounter}个任务已执行完毕,  当前有${this.taskDispatchCounter - this.taskCompleteCounter}个任务执行中, 等待所有待执行任务运行完毕后进行休眠`)
      await CommonUtil.asyncSleep(1000)
    }
    logger.log(`[任务暂停]所有待执行任务均已执行完毕, 开始休眠计时, 休眠时长:${sleep_ms / 1000}s`)
    await CommonUtil.asyncSleep(sleep_ms)
    logger.log(
      `[任务恢复]已执行${this.taskCompleteCounter}/${this.taskDispatchCounter}个任务, 休眠结束,  当前有${this.taskDispatchCounter - this.taskCompleteCounter}个任务执行中, 剩余${this.taskList.length}个任务待执行`,
    )
    this.isSuspend = false
  }

  // 添加任务
  addAsyncTaskFunc({
    asyncTaskFunc,
    label = Const_Default_Task_Label,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    // 用于区分不同任务来源, 方便根据任务来源提供等待所有任务执行完毕的方法
    label?: any
  }) {
    let labelCounter = this.taskStateMapByLabel.get(label) ?? {
      complete: 0,
      total: 0,
    }
    labelCounter.total = labelCounter.total + 1
    this.taskStateMapByLabel.set(label, labelCounter)

    this.taskCounter++

    this.taskList.push({
      asyncTaskFunc,
      label,
      taskNo: this.taskCounter
    })
    this.taskDispatchCounter++

    if (this.protectedConfig.needProtect) {
      if (this.taskDispatchCounter % this.protectedConfig.protectLoopCounter === 0) {
        this.suspendAllTask(this.protectedConfig.protect2wait_ms)
      }
    }

    // 每次添加任务后, 直接分发出去一个runner即可, runner自己可以判断应该何时运行
    this.runner()

    if (this.taskDispatchCounter > this.Const_Max_Task_Counter) {
      // 运行次数足够多后, 重置任务计数器
      logger.log(`[重置任务派发数]任务派发数已抵达阈值${this.Const_Max_Task_Counter}, 自动重置`)
      this.taskDispatchCounter = 0
    }
  }

  /**
   * 等待所有任务执行完毕
   */
  async asyncWaitAllTaskComplete() {
    while (this.taskList.length > 0 && this.runingRunner === 0) {
      await CommonUtil.asyncSleep(1000)
    }
    return true
  }

  /**
   * 等待指定任务label完成
   * @param label
   * @returns
   */
  async asyncWaitTaskCompleteByLabel(label = Const_Default_Task_Label) {
    while (true) {
      let labelCounter = this.taskStateMapByLabel.get(label) ?? {
        complete: 0,
        total: 0,
      }
      if (labelCounter.complete >= labelCounter.total) {
        return true
      }
      // 否则需要一直等待任务完成
      await CommonUtil.asyncSleep(1000)
    }
  }
}

export default class CommonUtil {
  static taskManagerWithProtect = new TaskManager({
    protectConfig: {
      needProtect: true,
      protect2wait_ms: CommonConfig.protect_To_Wait_ms,
      protectLoopCounter: CommonConfig.protect_Loop_Count,
    },
  })
  static taskManagerWithoutProtect = new TaskManager({})

  /**
   * 添加promise到任务队列
   */
  static addAsyncTaskFunc({
    asyncTaskFunc,
    needProtect = true,
    label = Const_Default_Task_Label,
  }: {
    asyncTaskFunc: Type_Asnyc_Task_Runner
    needProtect?: boolean
    label?: any
  }) {
    if (needProtect) {
      this.taskManagerWithProtect.addAsyncTaskFunc({ asyncTaskFunc, label })
    } else {
      this.taskManagerWithoutProtect.addAsyncTaskFunc({ asyncTaskFunc, label })
    }
    return
  }

  /**
   * 等待所有任务执行完毕
   *
   * 由于项目只有一个开发者, 整个进程为单进程模型, 不会出现一边加任务, 一边等待所有任务完成的极端case, 所以可以一次性等待两个队列的执行完成
   * 线上项目不能这么做
   */
  static async asyncWaitAllTaskComplete() {
    await this.taskManagerWithProtect.asyncWaitAllTaskComplete()
    await this.taskManagerWithoutProtect.asyncWaitAllTaskComplete()
  }

  /**
   * 等待指定label下所有任务执行完毕
   */
  static async asyncWaitAllTaskCompleteByLabel(label: any) {
    await this.taskManagerWithProtect.asyncWaitTaskCompleteByLabel(label)
    await this.taskManagerWithoutProtect.asyncWaitTaskCompleteByLabel(label)
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
