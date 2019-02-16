import logger from '~/src/library/logger'
import fs from 'fs'
import PathConfig from '~/src/config/path'
import RequestConfig from '~/src/config/request'
import TypeLocalConfig from '~/src/type/namespace/local_config'

class Common {
  static promiseList: Array<Promise<any>> = []
  // 并发数限制到10即可
  static maxBuf = 10
  /**
   * 添加promise, 到指定容量后再执行
   */
  static async asyncAppendPromiseWithDebounce (promise: Promise<any>, forceDispatch = false) {
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
   * 延迟执行函数, 返回一个 Promise
   * @param {number} ms
   */
  static asyncSleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static getUuid () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(36)
        .substring(1)
    }

    let uuid = `${s4()}-${s4()}-${s4()}-${s4()}`
    return uuid
  }

  static getLocalConfig () {
    if (fs.existsSync(PathConfig.localConfigUri) === false) {
      // 没有就初始化一份
      fs.writeFileSync(PathConfig.localConfigUri, JSON.stringify({
        'downloadUrl': 'http://www.baidu.com',
        'releaseAt': '2019年2月11日12点08分',
        'releaseNote': '',
        'version': 1.0,
        'requestConfig': {
          'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
          'cookie': ''
        }
      }, null, 4))
    }
    let localConfigJson = fs.readFileSync(PathConfig.localConfigUri)
    let localConfig: TypeLocalConfig.Record
    try {
      localConfig = JSON.parse(localConfigJson.toString())
    } catch (e) {
      localConfig = {}
    }
    return localConfig
  }

  // 重新载入配置文件
  static reloadConfig () {
    let localConfig = Common.getLocalConfig()
    RequestConfig.cookie = _.get(localConfig, ['requestConfig', 'cookie'], '')
  }
}

export default Common
