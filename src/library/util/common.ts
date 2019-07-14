import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import TypeConfig from '~/src/type/namespace/config'
class Common {
  static promiseList: Array<Promise<any>> = []
  // 并发数限制到10即可
  static maxBuf = 10
  /**
   * 添加promise, 到指定容量后再执行
   */
  static async asyncAppendPromiseWithDebounce(promise: Promise<any>, forceDispatch = false) {
    Common.promiseList.push(promise)
    if (Common.promiseList.length >= Common.maxBuf || forceDispatch) {
      logger.log(`任务队列已满, 开始执行任务, 共${Common.promiseList.length}个任务待执行`)
      await Promise.all(Common.promiseList)
      logger.log(`任务队列内所有任务执行完毕`)
      Common.promiseList = []
    }
    return
  }

  /**
   * 派发所有未发出的Promise请求
   */
  static async asyncDispatchAllPromiseInQueen() {
    await Common.asyncAppendPromiseWithDebounce(new Promise(() => {}), true)
  }

  /**
   * 延迟执行函数, 返回一个 Promise
   * @param {number} ms
   */
  static asyncSleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
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

  static getConfig() {
    if (fs.existsSync(PathConfig.configUri) === false) {
      // 没有就初始化一份
      fs.writeFileSync(
        PathConfig.configUri,
        JSON.stringify(
          {
            request: {
              ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
              cookie: '',
            },
          },
          null,
          4,
        ),
      )
    }
    let configJson = fs.readFileSync(PathConfig.configUri)
    let config: TypeConfig.Local
    try {
      config = JSON.parse(configJson.toString())
    } catch (e) {
      config = {
        request: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
          cookie: '',
        },
      }
    }
    return config
  }

  static getPackageJsonConfig() {
    let configJson = fs.readFileSync(PathConfig.packageJsonUri)
    let config
    try {
      config = JSON.parse(configJson.toString())
    } catch (e) {
      config = {}
    }
    return config
  }
}

export default Common
