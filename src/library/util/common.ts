import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import * as Type_TaskConfig from '~/src/type/task_config'
import * as Const_TaskConfig from '~/src/constant/task_config'
import { CommonConfig } from '~/src/config/common'

class Common {
  static promiseList: Array<Promise<any>> = []
  // 并发数限制到10即可
  static maxBuf = 10
  /**
   * 添加promise, 到指定容量后再执行
   * 警告, 该函数只能用于独立任务. 如果任务中依然调用asyncAppendPromiseWithDebounce方法, 会导致任务队列异常, 运行出非预期结果(外层函数结束后内层代码仍处于未完成,进行中状态)
   */
  static async asyncAppendPromiseWithDebounce(promise: Promise<any>, forceDispatch = false, protectZhihuServer = true) {
    Common.promiseList.push(promise)
    if (Common.promiseList.length >= Common.maxBuf || forceDispatch) {
      // 在执行的时候, 需要清空公共的promiseList数组.
      // 否则, 会出现: 执行公共PromiseList中第一个任务时, 第一个任务又向PromiseList中添加了一个待执行任务, 然后又从第一个任务开始执行(但因为第一个任务此时正在执行, 不可能执行一个正在执行的任务, 就会导致node崩溃, 而且不会打印错误)
      let taskList = Common.promiseList
      Common.promiseList = []
      logger.log(`任务队列已满, 开始执行任务, 共${taskList.length}个任务待执行`)
      // 模拟allSettled方法, 需要所有任务都完成后才能继续
      let wrappedPromises = taskList.map((p) =>
        Promise.resolve(p).then(
          (val) => ({ state: 'fulfilled', value: val }),
          (err) => ({ state: 'rejected', reason: err }),
        ),
      )
      await Promise.all(wrappedPromises)
      if (protectZhihuServer) {
        // 每完成一组抓取, 休眠1s
        logger.log(`队列已满, 休眠${CommonConfig.wait2ProtectZhihuServer_s}s, 保护知乎服务器`)
        await Common.asyncSleep(CommonConfig.wait2ProtectZhihuServer_s * 1000)
      }
      logger.log(`任务队列内所有任务执行完毕`)
    }
    return
  }

  /**
   * 派发所有未发出的Promise请求
   */
  static async asyncDispatchAllPromiseInQueen() {
    await Common.asyncAppendPromiseWithDebounce(Promise.resolve(true), true)
    return true
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
