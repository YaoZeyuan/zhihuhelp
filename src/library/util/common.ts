import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import { CommonConfig } from '~/src/config/common'

// 每计数x次后, 重置任务
const Const_Max_TaskCompleteCounter = 1000000000
class TaskManager {
  maxTaskRunner = 10

  taskCompleteCounter = 0

  taskList: Promise<any>[] = []

  constructor(initalTaskRunner = 100) {
    // 初始化时直接派发initalTaskRunner个任务
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
        await Common.asyncSleep(1000)
        continue
      }

      let task = this.taskList.pop()
      logger.log(
        `[开始执行]由slave_${runnerId}号负责执行第${this.taskCompleteCounter}个任务, 当前剩余${totalTaskCount}个任务待执行`,
      )

      await task?.catch((e) => {
        logger.log(
          `[执行异常]由slave_${runnerId}号负责执行的第${this.taskCompleteCounter}个任务执行失败, 报错信息为: ${e}`,
        )
      })

      logger.log(
        `[执行完成]由slave_${runnerId}号负责执行第${this.taskCompleteCounter}个任务, 当前剩余${totalTaskCount}个任务待执行`,
      )

      // 累加任务计数器
      this.taskCompleteCounter++

      if (this.taskCompleteCounter > Const_Max_TaskCompleteCounter) {
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
    await Common.asyncSleep(sleep_ms)
    this.maxTaskRunner = currentMaxTaskRunner
  }

  // 添加任务
  addTask(task: Promise<any>) {
    this.taskList.push(task)
  }
}

class Common {
  static taskManager = new TaskManager()
  /**
   * 添加promise, 到指定容量后再执行
   * 警告, 该函数只能用于独立任务. 如果任务中依然调用asyncAppendPromiseWithDebounce方法, 会导致任务队列异常, 运行出非预期结果(外层函数结束后内层代码仍处于未完成,进行中状态)
   */
  static async asyncAppendPromiseWithDebounce(promise: Promise<any>) {
    this.taskManager.addTask(promise)
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
}

export default Common
