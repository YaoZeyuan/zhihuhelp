import logger from '~/src/library/logger'
import fs from 'fs'
import { PathConfig } from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import { CommonConfig } from '~/src/config/common'

// 每计数x次后, 重置任务
class TaskManager {
  private maxTaskRunner = 10

  // 当前正在执行的任务数
  private runingRunner = 0

  // 任务派发数
  private taskDispatchCounter = 0
  // 任务完成数
  private taskCompleteCounter = 0

  // 任务超时时间, 走内部配置即可, 不需要全局配置
  private readonly Const_Task_Timeout_ms = 20 * 1000
  // 最大记录的任务派发数/执行数, 超过该数自动重置计数器
  private readonly Const_Max_Task_Counter = 10000 * 10000 * 10000

  private taskList: Promise<any>[] = []

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
    // 初始化时直接派发initalTaskRunner个任务
    initalTaskRunner = 100,
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

    let counter = 0
    while (counter < initalTaskRunner) {
      let runnerId = counter
      this.runner(runnerId)
      counter++
    }
  }

  async runner(runnerId: number) {
    while (true) {
      // 当前总任务数
      let totalTaskCount = this.taskList.length
      // 是否有任务需要执行
      let hasTaskToRun = totalTaskCount > 0
      // 当前runner是否需要执行任务(用于动态控制最大并发数)
      let isRunnerNeedToRun = runnerId > this.maxTaskRunner

      if (isRunnerNeedToRun === false || hasTaskToRun === false) {
        // 没有任务时休眠1s
        await CommonUtil.asyncSleep(1000)
        continue
      }

      // 正在执行任务数+1
      this.runingRunner++

      let task = this.taskList.pop()
      logger.log(
        `[开始执行]由slave_${runnerId}号负责执行第${this.taskCompleteCounter}个任务, 当前剩余${totalTaskCount}个任务待执行`,
      )

      await Promise.all([
        task,
        new Promise((reslove, reject) => {
          setTimeout(() => {
            reject(new Error(`任务执行超时`))
          }, this.Const_Task_Timeout_ms)
        }),
      ]).catch((e) => {
        logger.log(
          `[执行异常]由slave_${runnerId}号负责执行的第${this.taskCompleteCounter}个任务执行失败, 报错信息为: ${e}`,
        )
      })

      // 正在执行任务数-1
      this.runingRunner--

      logger.log(
        `[执行完成]由slave_${runnerId}号负责执行第${this.taskCompleteCounter}个任务, 当前剩余${totalTaskCount}个任务待执行`,
      )

      // 累加任务计数器(不考虑溢出的情况)
      this.taskCompleteCounter++

      if (this.taskCompleteCounter > this.Const_Max_Task_Counter) {
        logger.log(`[重置任务完成数]任务完成数已抵达阈值${this.Const_Max_Task_Counter}, 自动重置`)
        // 运行次数足够多后, 重置任务计数器
        this.taskCompleteCounter = 0
      }
    }
  }

  /**
   * 整体休眠sleep_ms, 期间不会执行新任务, 以便保护知乎服务器
   * @param sleep_ms
   */
  async suspendAllTask(sleep_ms: number) {
    let currentMaxTaskRunner = this.maxTaskRunner
    this.maxTaskRunner = 0
    logger.log(
      `[任务暂停]已执行${this.taskCompleteCounter}/${this.taskDispatchCounter}个任务, 休眠${
        sleep_ms / 1000
      }秒, 当前剩余${this.taskList.length}个任务待执行`,
    )
    while (this.runingRunner > 0) {
      logger.log(`[任务暂停]当前正在执行任务数${this.runingRunner}, 等待所有待执行任务运行完毕后进行休眠`)
      await CommonUtil.asyncSleep(1000)
    }
    logger.log(`[任务暂停]所有待执行任务均已执行完毕, 开始休眠计时, 休眠时长:${sleep_ms / 1000}s`)
    await CommonUtil.asyncSleep(sleep_ms)
    logger.log(
      `[任务恢复]已执行${this.taskCompleteCounter}/${this.taskDispatchCounter}个任务, 休眠结束, 当前runner数:${currentMaxTaskRunner}, 当前剩余${this.taskList.length}个任务待执行`,
    )
    this.maxTaskRunner = currentMaxTaskRunner
  }

  // 添加任务
  addTask(task: Promise<any>) {
    this.taskList.push(task)
    this.taskDispatchCounter++

    if (this.protectedConfig.needProtect) {
      if (this.taskDispatchCounter % this.protectedConfig.protectLoopCounter === 0) {
        this.suspendAllTask(this.protectedConfig.protect2wait_ms)
      }
    }

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
}

export class CommonUtil {
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
  static async asyncAddTask({ task, needProtect = false }: { task: Promise<any>; needProtect: boolean }) {
    if (needProtect) {
      this.taskManagerWithProtect.addTask(task)
    } else {
      this.taskManagerWithoutProtect.addTask(task)
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

  static getConfig(): Type_TaskConfig.Type_Config {
    if (fs.existsSync(PathConfig.configUri) === false) {
      // 没有就初始化一份
      fs.writeFileSync(PathConfig.configUri, JSON.stringify(Const_TaskConfig.Const_Default_Config, null, 2))
    }
    let configJson = fs.readFileSync(PathConfig.configUri)?.toString() ?? ''
    let config: Type_TaskConfig.Type_Config
    try {
      config = JSON.parse(configJson)
    } catch (e) {
      config = {
        ...Const_TaskConfig.Const_Default_Config,
      }
    }
    return config
  }

  static getVersion() {
    let packageJson = fs.readFileSync(PathConfig.packageJsonUri)
    let packageConfig
    try {
      packageConfig = JSON.parse(packageJson.toString())
    } catch (e) {
      packageConfig = {}
    }
    return packageConfig?.['version'] ?? '0.0.0'
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
      encodeFilename = encodeFilename.replaceAll(`\\${key}`, legalChar)
    }
    return encodeFilename
  }
}
